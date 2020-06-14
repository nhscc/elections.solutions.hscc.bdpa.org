import { handleAuthedEndpoint, handleUserEndpoint } from 'universe/backend/middleware'

import type { NextApiResponse } from 'next'
import type { NextAuthedSessionRequest as NextSessionRequest } from 'types/global'

export default async function(req: NextSessionRequest, res: NextApiResponse) {
    await handleAuthedEndpoint(async () => {
        await handleUserEndpoint(req.session.userId, { req, res, returnAuthed: true });
    }, { req, res, methods: ['GET', 'PUT'] });
}
