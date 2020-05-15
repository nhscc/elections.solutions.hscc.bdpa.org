/* @flow */

import { handleAuthedEndpoint } from 'universe/backend/middleware'

import {
    UserTypes,
    createUser,
    getUserData,
    getUsersPublicData,
} from 'universe/backend'

import type { NextApiResponse } from 'next'
import type { NextSessionRequest } from 'multiverse/simple-auth-session'

export default async function(req: NextSessionRequest, res: NextApiResponse) {
    await handleAuthedEndpoint(async () => {
        if(req.method == 'GET')
            res.status(200).send(getUsersPublicData());

        if(req.method == 'POST') {
            try {
                const user = getUserData(req.session.userId);

                if(user.type != UserTypes.administrator)
                    res.status(403).send({ error: 'user lacks authorization to create new users' });

                else {
                    const { username, password, elections, otp, ...userData } = req.body;

                    if(!user.root && userData.type == UserTypes.administrator)
                        res.status(403).send({ error: 'user lacks authorization to create new administrators' });

                    else if(elections !== undefined)
                        res.status(403).send({ error: 'must use `election` endpoint to mutate election properties' });

                    else if(otp !== undefined)
                        res.status(403).send({ error: 'must use `generate-otp` endpoint to mutate otp property' });

                    else if(!username || !password)
                        res.status(400).send({ error: 'missing either `username` or `password` properties' });

                    else {
                        const userId = createUser(username, password, userData);
                        res.status(200).send({ userId });
                    }
                }
            }

            catch(error) {
                res.status(400).send({ error: error.message });
            }
        }
    }, { req, res, methods: ['GET', 'POST'] });
}
