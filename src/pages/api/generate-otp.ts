import {
    generateOTPFor,
    getUserIdFromEmail,
} from 'universe/backend'

import { handleUnauthedEndpoint } from 'universe/backend/middleware'

import type { NextApiResponse } from 'next'
import type { NextSessionRequest } from 'multiverse/simple-auth-session'

export default async function(req: NextSessionRequest, res: NextApiResponse) {
    await handleUnauthedEndpoint(async () => {
        const { email } = req.body;

        if(email) {
            const userId = getUserIdFromEmail(email);

            if(userId) {
                const otp = generateOTPFor(userId);

                // * In real life, we'd send this as an email link at this point
                // eslint-disable-next-line no-console
                console.info(`otp   - new OTP link generated for userId "${userId}"\n        ` +
                    `--> ${req.headers.host}/change-password/${otp}`);
            }
        }

        // ? For security reasons, we always return `success: true` here
        res.status(200).send({ success: true });
    }, { req, res, methods: ['POST'] });
}
