/* @flow */

import * as React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { useUser } from 'universe/frontend/hooks'
import { frontendRedirect } from 'multiverse/isomorphic-redirect'
import { useIsomorphicLayoutEffect as useLayoutEffect } from 'react-use'
import { fetchEndpoint } from 'multiverse/fetch-endpoint'
import NextLink from 'next/link'
import Footbar from 'components/footbar'

const REDIRECT_TO_LOCATION = '/change-password';

export default function OTPAuthPage() {
    const router = useRouter();
    const { otp } = router.query;
    const { user, error: notAuthed } = useUser();
    const [ failed, setFailed ] = useState(false);
    const [ sent, setSent ] = useState(false);

    useLayoutEffect(() => {
        if(!failed && !sent && otp && notAuthed && !user.authed) {
            setSent(true);
            fetchEndpoint.post('/api/login', { body: JSON.stringify({ otp }) }).then(({ data }) => {
                !data.success ? setFailed(true) : frontendRedirect(REDIRECT_TO_LOCATION, { replace: true });
            });
        }
    });

    return (
        <div className="wrapper">
            <div className="body">
                { !sent && !failed && <p className="center">One moment...</p> }
                { sent && !failed && <p className="center">Validating credentials...</p> }
                { failed && <p>Your password reset link has expired, please <NextLink href="/"><a>try again</a></NextLink>.</p> }
            </div>
            <Footbar />
            <style jsx>{`
                .wrapper {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;

                    .body {
                        flex-grow: 1;
                        padding: 15px;
                    }

                    .center {
                        text-align: center;
                    }
                }
            `}</style>
        </div>
    );
}
