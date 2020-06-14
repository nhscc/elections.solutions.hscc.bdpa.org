import { handleAuthedEndpoint } from 'universe/backend/middleware'

import type { NextApiResponse } from 'next'
import type { NextAuthedSessionRequest as NextSessionRequest } from 'types/global'

export default async function(req: NextSessionRequest, res: NextApiResponse) {
    await handleAuthedEndpoint(async () => {
        const { id: electionId } = req.query;

        if(!electionId) return;

        if(req.method == 'GET') {
            // TODO: pull from remote API instead (404 on not found, pass-through errors)
            res.status(200).send({ success: true });
        }

        else if(req.method == 'PUT') {
            // TODO: interact with remote API instead
            res.status(200).send({ success: true });
        }

        else if(req.method == 'DELETE') {
            // TODO: interact with remote API instead
            res.status(200).send({ success: true });
        }
    }, { req, res, methods: ['GET', 'PUT', 'DELETE'] });
}
