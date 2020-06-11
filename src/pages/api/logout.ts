import { deauth } from 'multiverse/simple-auth-session'
import { handleEndpoint } from 'universe/backend/middleware'

import type { NextApiResponse } from 'next'
import type { NextSessionRequest } from 'multiverse/simple-auth-session'

export default async function(req: NextSessionRequest, res: NextApiResponse): void {
    await handleEndpoint(async () => {
        await deauth({ req, res });
        req.session.destroy();
        res.status(200).send({ success: true });
    }, { req, res, methods: ['POST'] });
}
