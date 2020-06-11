import { handleAuthedEndpoint, handleUserEndpoint } from 'universe/backend/middleware'

import type { NextApiResponse } from 'next'
import type { NextSessionRequest } from 'multiverse/simple-auth-session'

export default async function(req: NextSessionRequest, res: NextApiResponse) {
    await handleAuthedEndpoint(async () => {
        await handleUserEndpoint(req.query.id, { req, res });
    }, { req, res, methods: ['GET', 'PUT', 'DELETE'] });
}
