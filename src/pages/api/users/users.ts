import { handleAuthedEndpoint } from 'universe/backend/middleware'
import { User, DeepPartial } from 'types/global'
import {
    createUser,
    getUser,
    getPublicUsers,
} from 'universe/backend'

import type { NextApiResponse } from 'next'
import type { NextAuthedSessionRequest as NextSessionRequest } from 'types/global'

export default async function(req: NextSessionRequest, res: NextApiResponse) {
    await handleAuthedEndpoint(async () => {
        if(req.method == 'GET')
            res.status(200).send(getPublicUsers());

        if(req.method == 'POST') {
            try {
                const user = getUser(req.session.userId);

                if(user.type != 'administrator')
                    res.status(403).send({ error: 'user lacks authorization to create new users' });

                else {
                    const { username, password, type, elections, otp, ...userData } = req.body as DeepPartial<User>;

                    if(!user.root && type == 'administrator')
                        res.status(403).send({ error: 'user lacks authorization to create new administrators' });

                    else if(elections !== undefined)
                        res.status(403).send({ error: 'must use `election` endpoint to mutate election properties' });

                    else if(otp !== undefined)
                        res.status(403).send({ error: 'must use `generate-otp` endpoint to mutate otp property' });

                    else if(!username || !password)
                        res.status(400).send({ error: 'missing either `username` or `password` properties' });

                    else if(!type) {
                        res.status(400).send({ error: 'missing `type` property' });
                    }

                    else {
                        const userId = createUser(username, password, type, userData);
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
