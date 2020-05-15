/* @flow */

import { handleAuthedEndpoint } from 'universe/backend/middleware'

import type { NextApiResponse } from 'next'
import type { NextSessionRequest } from 'multiverse/simple-auth-session'

export default async function(req: NextSessionRequest, res: NextApiResponse) {
    await handleAuthedEndpoint(async () => {
        const { id: electionId } = req.query;

        if(!electionId) return;

        if(req.method == 'GET') {
            // TODO: pull from remote API instead (404 on not found, pass-through errors)
            res.status(200).send(
                electionId == 1
                ? {
                    electionId: '1',
                    title: 'Election Title 1',
                    description: 'election description text would go here if there were election description text to go here',
                    assigned: {
                        moderators: [],
                        voters: []
                    },
                    votes: {},
                    deleted: false,
                    owned: true
                }
                : {
                    electionId: '2',
                    title: 'Election Title 2',
                    description: 'election description text would go here if there were election description text to go here',
                    votes: {},
                    deleted: false,
                    owned: false
                }
            );
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
