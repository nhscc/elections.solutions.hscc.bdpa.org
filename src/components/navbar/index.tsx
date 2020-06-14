import * as React from 'react'
import { useState } from 'react'
import NextLink from 'next/link'
import { fetchEndpoint } from 'multiverse/fetch-endpoint'
import { mutate } from 'swr'
import { useRouter } from 'next/router'
import { useUserType } from 'universe/frontend/hooks'

import type { Nil } from 'types/global'

export type RenderProp = Nil | ((activateIf: (...regExs: string[]) => string | undefined) => JSX.Element | Nil);

export default function Navbar({ children: renderProp }: { children?: RenderProp }) {
    const router = useRouter();
    const { isAdmin, isModerator } = useUserType();
    const [ docked, setDocked ] = useState(false);

    const activateIf = (...exps: string[]) => exps.some(regex => !!router.pathname.match(regex)) ? 'active' : undefined;
    const middleMatter = renderProp && renderProp(activateIf);

    const handleLogout = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        await fetchEndpoint.post('/api/logout');
        mutate('/api/user', { authed: false });
    };

    return (
        <nav className="nav">
            <header>
                <a onClick={() => setDocked(!docked)}><i aria-hidden className="fas fa-bars fa-lg" /></a>
                <h1>BDPA Elections</h1>
            </header>
            <aside>
                <ol>
                    <li className={activateIf('dashboard')}><NextLink href="/dashboard"><a>Your dashboard</a></NextLink></li>
                    <li className={activateIf('elections$')}><NextLink href="/elections"><a>Search elections</a></NextLink></li>
                    { isAdmin &&
                        <li className={activateIf('elections/create')}>
                            <NextLink href="/elections/create"><a>Create election</a></NextLink>
                        </li>
                    }
                    { (isAdmin || isModerator) &&
                        <li className={activateIf('users$')}>
                            <NextLink href="/users"><a>Manage users</a></NextLink>
                        </li>
                    }
                    { isAdmin &&
                        <li className={activateIf('users/create')}>
                            <NextLink href="/users/create"><a>Create user</a></NextLink>
                        </li>
                    }
                    { middleMatter &&
                        <React.Fragment>
                            <hr />
                            { middleMatter }
                        </React.Fragment>
                    }
                </ol>
                <hr />
                <ol>
                    <li className={activateIf('account', 'password')}><NextLink href="/account"><a>Account</a></NextLink></li>
                    <li className={activateIf('help')}><NextLink href="/help"><a>Help</a></NextLink></li>
                    <li><a href="#logout" onClick={handleLogout}>Logout</a></li>
                </ol>
            </aside>
            <style jsx>{`
                @import "_variables.sass";

                .nav {
                    display: flex;
                    flex-flow: column nowrap;
                }

                header {
                    display: flex;
                    position: sticky;
                    top: 0;
                    width: 100vw;
                    height: $header-height;
                    flex-flow: ${ docked ? 'row-reverse' : 'row' };
                    align-content: center;
                    align-items: center;
                    background-color: black;
                    color: white;

                    a {
                        margin: 0;
                        padding: 0 $aside-padding;
                        padding-${ docked ? 'left' : 'right' }: 0;
                        background: none;
                        outline: 0;
                        border: none;
                        color: inherit;

                        &:hover, &:focus, &:active, &:visited {
                            color: inherit;
                            text-decoration: none;
                        }
                    }

                    h1 {
                        margin: 0 auto;
                        font-weight: bold;
                        font-size: 115%;
                    }
                }

                aside {
                    display: flex;
                    flex-flow: column nowrap;
                    width: 100%;
                    top: $header-height;
                    height: calc(100vh - #{$header-height});
                    background-color: white;
                    position: absolute;
                    z-index: 1;
                    left: ${ docked ? 0 : -100 }vw;

                    :global(a) {
                        outline: 0;
                    }

                    :global(hr) {
                        margin: 0.5rem 0;
                    }

                    :global(ol) {
                        display: flex;
                        list-style-type: none;
                        flex-flow: column nowrap;
                        padding: $aside-padding;

                        &:first-child { padding-bottom: 0; }
                        &:last-child { padding-top: 0; }

                        :global(li) {
                            text-transform: lowercase;
                            font-variant: small-caps;

                            :global(a) {
                                padding: 5px;
                            }
                        }

                        :global(li.active) {
                            background-color: $link;

                            :global(a) {
                                color: white;
                            }
                        }
                    }
                }
            `}</style>
        </nav>
    );
}
