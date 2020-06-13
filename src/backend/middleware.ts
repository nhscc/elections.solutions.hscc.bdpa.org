import { isAuthed } from 'multiverse/simple-auth-session'
import { UserTypes } from 'types/global'
import {
    getUserData,
    mergeUserData,
    getUserPublicData,
} from 'universe/backend'

import type { NextParamsRRWithSession } from 'multiverse/simple-auth-session'

export type GenericHandlerParams = NextParamsRRWithSession & { methods: Array<string> };
export type AsyncHandlerCallback = (NextParamsRRWithSession) => Promise;

/**
 * Generic middleware to handle any api endpoint. You can give it an empty async
 * handler function to trigger a 501 not implemented (to stub out API
 * endpoints).
 */
export async function handleEndpoint(fn: AsyncHandlerCallback, { req, res, methods }: GenericHandlerParams) {
    if(!methods.includes(req.method))
        res.status(405).send({ error: `method ${req.method} is not allowed` });

    else {
        try {
            // ? This will let us know if the sent method was called
            let sent = false;
            res.$send = res.send;
            res.send = (...args) => (sent = true) && res.$send(...args);

            await fn({ req, res });

            // ? If the response hasn't been sent yet, send one now
            !sent && res.status(400).send({ error: 'bad request' });
        }
        catch(error) { res.status(400).send({ error: error.message }); }
    }
}

/**
 * Generic middleware to handle any api endpoint with required no authentication
 */
export async function handleUnauthedEndpoint(fn: AsyncHandlerCallback, { req, res, methods }: GenericHandlerParams) {
    if(await isAuthed({ req, res}))
        res.status(403).send({ error: 'authenticated sessions cannot access this endpoint' });

    else
        await handleEndpoint(fn, { req, res, methods });
}

/**
 * Generic middleware to handle any api endpoint with required authentication
 */
export async function handleAuthedEndpoint(fn: AsyncHandlerCallback, { req, res, methods }: GenericHandlerParams) {
    if(!await isAuthed({ req, res}))
        res.status(401).send({ error: 'session must authenticate first' });

    else
        await handleEndpoint(fn, { req, res, methods });
}

/**
 * High-level middleware to handle /api/user related endpoint functions
 */
export function handleUserEndpoint(userId?: number, { req, res, returnAuthed }: NextParamsRRWithSession & { returnAuthed?: boolean }) {
    userId = userId || -1;

    const self = userId == req.session.userId;
    const sessionUser = getUserData(req.session.userId);
    const isAdmin = sessionUser.type == UserTypes.administrator;
    const isMod = sessionUser.type == UserTypes.moderator;
    const canSeePrivateData = self || isAdmin;

    if(req.method == 'GET') {
        const targetUser = (canSeePrivateData ? getUserData : getUserPublicData)(userId);
        const { password, ...userData } = targetUser; // ? Remove password prop

        !targetUser
            ? res.status(404).send({ error: `user id "${userId}" does not exist` })
            : res.status(200).send({
                ...userData,
                ...(returnAuthed && { authed: true }),
                ...(self && req.session.prevLogin && { prevLogin: req.session.prevLogin })
            });
    }

    else if(req.method == 'PUT') {
        const limited = ['username', 'type', 'restricted'];

        const { type: oldType, deleted: oldDeleted } = sessionUser;
        const { type: newType, deleted: newDeleted, elections, otp, lastLogin } = req.body;

        // ? Only admins can mutate other users and only root can mutate
        // ? admins! Users can mutate themselves, however. Also, only root
        // ? can turn normal users into administrators and vice-versa
        if(!self && (!isAdmin || (!sessionUser.root && ([oldType, newType].includes(UserTypes.administrator)))))
            res.status(403).send({ error: 'user lacks authorization to make this mutation' });

        // ? Non-root users cannot undelete themselves
        else if(self && !sessionUser.root && oldDeleted && newDeleted === false)
        res.status(403).send({ error: 'non-root users are unable to undelete themselves' });

        // ? If this mutation was issued by an admin, then we additionally
        // ? accept limited properties (above)
        else if(!isAdmin && Object.keys(req.body).some(item => limited.includes(item))) {
            res.status(403).send({ error: 'user lacks authorization to change one or more properties' });
        }

        // ? These types of mutations involve the external API, disallow
        // ? them here
        else if(elections !== undefined)
            res.status(403).send({ error: 'must use `election` endpoint to mutate election properties' });

        // ? If this is an attempted mutation of OTP, disallow it
        else if(otp !== undefined)
            res.status(403).send({ error: 'must use `generate-otp` endpoint to mutate otp property' });

        // ? This is a special command to clear the prevLogin memory (we don't
        // ? ever want to let users mod the login records anyways)
        else if(lastLogin !== undefined) {
            delete req.session.prevLogin;
            res.status(200).send({ success: true });
        }

        // ? Otherwise, only password and email through zip are accepted
        else {
            mergeUserData(userId, req.body);
            res.status(200).send({ success: true });
        }
    }

    else if(req.method == 'DELETE') {
        const { type: oldType } = getUserData(userId);

        // ? Only admins can delete users and only root can delete admins!
        // ? Users can delete themselves, however
        if(!self && (!isAdmin || (!sessionUser.root && oldType == UserTypes.administrator)))
            res.status(403).send({ error: 'user lacks authorization to delete this user' });

        else {
            mergeUserData(userId, { deleted: true });
            res.status(200).send({ success: true });
        }
    }
}
