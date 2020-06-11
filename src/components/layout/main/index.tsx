import * as React from 'react'
import Navbar from 'components/navbar'
import Footbar from 'components/footbar'
import { useRedirection } from 'multiverse/simple-auth-session/hooks'

const REDIRECT_ON_DEAUTH_LOCATION = '/';
const REDIRECT_ON_FIRST_LOGIN_LOCATION = '/first-login';

export default function MainLayout(props: Record<string, unknown>) {
    const { children, navbarRender } = props;
    // ? We extract redirecting from props this way because it could be passed
    // ? in as something like: `{ redirecting: undefined }` versus `{}`!
    const loading = !('loading' in props) ? false : props.loading;

    const { redirecting: redirecting1 } = useRedirection({
        endpointURI: '/api/user',
        redirectTo: REDIRECT_ON_DEAUTH_LOCATION,
        redirectIf: data => !data.authed || data.restricted || data.deleted
    });

    const { redirecting: redirecting2 } = useRedirection({
        endpointURI: '/api/user',
        redirectTo: REDIRECT_ON_FIRST_LOGIN_LOCATION,
        redirectIf: data => data.firstLogin,
        fetchArgs: { method: 'GET' },
        redirectArgs: { replace: true }
    });

    // ? This ensures the page is only rendered if we're not redirecting
    return (
        <React.Fragment>
            <Navbar>
                { activateIf => navbarRender && navbarRender(activateIf) }
            </Navbar>
            <main>
            { (redirecting1 !== false || redirecting2 !== false || loading !== false)
                ? <h2 className="loading">One moment...</h2>
                : children
            }
            </main>
            <Footbar />
            <style jsx>{`
                @import "_variables.sass";

                main {
                    flex-grow: 1;
                }

                main > :global(*) {
                    padding: $aside-padding;
                }

                .loading {
                    text-align: center;
                }
            `}</style>
        </React.Fragment>
    );
}
