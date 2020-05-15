/* @flow */

import { auth } from 'multiverse/simple-auth-session'
import { getClientIp } from 'request-ip'
import { handleUnauthedEndpoint } from 'universe/backend/middleware'

import {
    areValidCredentials,
    getUserIdFromUsername,
    getUserData,
    mergeUserData,
    clearOTPFor,
} from 'universe/backend'

import type { NextApiResponse } from 'next'
import type { NextSessionRequest } from 'multiverse/simple-auth-session'
import {getUserIdFromOTP} from '../../backend'

export const maxLoginAttempts = 3;
export const rateLimitedSeconds = 900;

export const rateLimitedMilliseconds = rateLimitedSeconds * 1000;

const rates: {
    [key: string]: {
        attempts: number,
        lastAttempt: number
    }
} = {};

// ? To prevent DoS attacks and the like against our memory stores, we'll prune
// ? the "rates" memory every once ina while based on rateLimitedMilliseconds
setInterval(() => {
    let deleted = 0;
    let total = 0;

    for(let [ ident, rate ] of Object.entries(rates)) {
        total++;
        // flow-disable-line
        if(Date.now() - rate.lastAttempt >= rateLimitedMilliseconds) {
            delete rates[ident];
            deleted++;
        }
    }

    process.env.APP_ENV == 'development' && console.info(
        `cron  - cleared ${deleted} stale rates, ${ total - deleted } remaining`
    );
}, rateLimitedMilliseconds * 4);

console.info(`cron  - initialized new rates watchdog`);

export default async function(req: NextSessionRequest, res: NextApiResponse) {
    const ip = getClientIp(req);

    const ifUserIsUnrestrictedThenAuth = async (userId: number) => {
        const user = getUserData(userId);

        if(user.restricted)
            res.status(403).send({ error: 'this account is restricted' });

        else {
            await auth({ req, res });
            req.session.userId = userId;
            req.session.prevLogin = user.lastLogin;
            mergeUserData(userId, { lastLogin: { ip, time: Date.now() }});
            clearOTPFor(userId);
            res.status(200).send({ success: true, authed: true });
        }
    };

    const badCredentialsResponse = (ident: string) => {
        const now = Date.now();
        const idents = [ident, ip];

        idents.forEach(id => {
            if(!rates[id] || now - rates[id].lastAttempt >= rateLimitedMilliseconds)
                rates[id] = { attempts: 0, lastAttempt: 0 };

            rates[id].attempts += 1;
            rates[id].lastAttempt = now;

            res.status(401).send({
                error: 'bad credential(s)',
                triesLeft: maxLoginAttempts - rates[id].attempts
            });
        });
    };

    await handleUnauthedEndpoint(async () => {
        const { username, password, otp } = req.body;

        // ? If a user has tried to login too many times and failed, (soft) ban
        // ? them
        if(rates[username]?.attempts >= maxLoginAttempts || rates[otp]?.attempts >= maxLoginAttempts)
            res.status(429).send({ error: 'too many login attempts on this account. Try again later' });

        // ? If an IP address has tried to log into too many users with
        // ? failures, soft ban them (probably a bot)
        else if(rates[ip]?.attempts >= maxLoginAttempts)
            res.status(429).send({ error: 'too many login attempts from this IP. Try again later' });

        // ? Handle this as OTP based authentication
        else if(otp) {
            const userId = getUserIdFromOTP(otp);

            if(userId) {
                delete rates[otp];
                await ifUserIsUnrestrictedThenAuth(userId);
            }

            else badCredentialsResponse(otp);
        }

        // ? Handle this as normal username/password based authentication
        else if(username) {
            if(areValidCredentials(username, password)) {
                delete rates[username];

                const userId = getUserIdFromUsername(username);

                if(!userId)
                    throw new Error('failed to map username to id');

                await ifUserIsUnrestrictedThenAuth(userId);
            }

            else badCredentialsResponse(username);
        }
    }, { req, res, methods: ['POST'] });
}
