import { handleAuthedEndpoint } from 'universe/backend/middleware'

import type { NextApiResponse } from 'next'
import type { NextAuthedSessionRequest as NextSessionRequest } from 'types/global'

export default async function(req: NextSessionRequest, res: NextApiResponse) {
    await handleAuthedEndpoint(async () => {
        if(req.method == 'GET') {
            // TODO: pull from remote API instead
            res.status(200).send([
                {
                    electionId: '1',
                    title: 'Election Title 1',
                    description: 'election description text would go here if there were election description text to go here',
                    assigned: {
                        moderators: [],
                        voters: []
                    },
                    options: {},
                    votes: {},
                    deleted: false,
                    owned: true
                },
                {
                    electionId: '2',
                    title: 'Election Title 2',
                    description: 'election description text would go here if there were election description text to go here',
                    options: {},
                    votes: {},
                    deleted: false,
                    owned: false
                },
            ]);
        }

        else if(req.method == 'POST') {
            const electionId = 3;

            // TODO: interact with remote API instead
            res.status(200).send({ electionId });
        }
    }, { req, res, methods: ['GET', 'POST'] });
}
