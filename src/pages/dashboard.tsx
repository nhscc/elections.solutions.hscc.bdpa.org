import * as React from 'react'
import { useState, useEffect, useRef } from 'react'
import { useUser, useUserType } from 'universe/frontend/hooks'
import { fetchEndpoint } from 'multiverse/fetch-endpoint'
import MainLayout from 'components/layout/main'
import NextLink from 'next/link'

const MAX_ELECTIONS_FOR_TRIPLE_SECTION = 3;
const MAX_ELECTIONS_FOR_DOUBLE_SECTION = 6;
const MAX_ELECTIONS_FOR_SINGLE_SECTION = 14;

export default function DashboardPage() {
    const { user } = useUser();
    const { isAdmin, isModerator, isVoter, isReporter } = useUserType();
    const loaded = !!user.userId;
    const [ expandedSection, setExpandedSection ] = useState(null);

    useEffect(() => {
        // ? Erase the last login info so it doesn't show up again for this
        // ? session
        fetchEndpoint.put('/api/user', { body: JSON.stringify({ lastLogin: {} }) })
    });

    // ? If the last login info exists, cache it in memory
    const ref = useRef(null);

    if(user.prevLogin)
        ref.current = user.prevLogin;

    // TODO: set expandedSection
    const currentIsExpanded = expandedSection == 'current';
    const upcomingIsExpanded = expandedSection == 'upcoming';
    const pastIsExpanded = expandedSection == 'past';
    const assignedIsExpanded = expandedSection == 'assigned';
    const latestIsExpanded = expandedSection == 'latest';

    // TODO: check election counts for each category conditionally depending
    const currentIsExpandable = false;
    const upcomingIsExpandable = false;
    const pastIsExpandable = false;
    const assignedIsExpandable = false;
    const latestIsExpandable = false;

    // TODO: handle empty (as table; and center)
    // TODO: change footer: update with total # of elections in system

    ref.current = { ip: '1.1.1.1', time: Date.now() }; // TODO: delete this line

    const nameEl = <React.Fragment>{', '}<span style={{ fontWeight: 'bold' }}>{user?.name?.first}</span></React.Fragment>;

    return (
        <MainLayout loading={!loaded}>
            <div>
                <h1>Welcome back{ user?.name?.first ? nameEl : '' }!</h1>
                {!!ref.current &&
                <h3>You last logged in from {ref.current.ip} on {(new Date(ref.current.time).toLocaleString())}</h3>}
                { isVoter &&
                <React.Fragment>
                    { (!expandedSection || currentIsExpanded) &&
                    <div className="current spaced">
                        <h2>
                            <i className="fas fa-vote-yea fa-fw" />
                            eligible elections
                            { (currentIsExpandable || currentIsExpanded) &&
                            <a href="#toggle">
                                <i className={`fas ${ currentIsExpanded ? 'fa-compress-alt' : 'fa-expand-alt' } fa-fw`} />
                            </a>
                            }
                        </h2>
                        <table>
                            <tbody>
                                <tr>
                                    <td>Election name with dots if too long...</td>
                                    <td><NextLink href="/elections/1"><a>vote</a></NextLink></td>
                                </tr>
                                <tr>
                                    <td>Election name with dots if too long...</td>
                                    <td><NextLink href="/elections/2"><a>vote</a></NextLink></td>
                                </tr>
                                <tr>
                                    <td>Election name with dots if too long...</td>
                                    <td><NextLink href="/elections/3"><a>vote</a></NextLink></td>
                                </tr>
                            </tbody>
                        </table>
                        { (currentIsExpandable && !currentIsExpanded) &&
                        <p className="toggle">
                            <a href="#toggle">show more</a>
                        </p>
                        }
                    </div>
                    }
                    { (!expandedSection || upcomingIsExpanded) &&
                    <div className="upcoming spaced">
                        <h2>
                            <i className="fas fa-fast-forward fa-fw" />
                            upcoming elections
                            { (upcomingIsExpandable || upcomingIsExpanded) &&
                            <a href="#toggle">
                                <i className={`fas ${ upcomingIsExpanded ? 'fa-compress-alt' : 'fa-expand-alt' } fa-fw`} />
                            </a>
                            }
                        </h2>
                        <table>
                            <tbody>
                                <tr>
                                    <td>Election name with dots if too long...</td>
                                    <td><NextLink href="/elections/4"><a>vote</a></NextLink></td>
                                </tr>
                                <tr>
                                    <td>Election name with dots if too long...</td>
                                    <td><NextLink href="/elections/5"><a>vote</a></NextLink></td>
                                </tr>
                                <tr>
                                    <td>Election name with dots if too long...</td>
                                    <td><NextLink href="/elections/6"><a>vote</a></NextLink></td>
                                </tr>
                            </tbody>
                        </table>
                        { (upcomingIsExpandable && !upcomingIsExpanded) &&
                        <p className="toggle">
                            <a href="#toggle">show more</a>
                        </p>
                        }
                    </div>
                    }
                    { (!expandedSection || pastIsExpanded) &&
                    <div className="past spaced">
                        <h2>
                            <i className="fas fa-history fa-fw" />
                            election history
                            { (pastIsExpandable || pastIsExpanded) &&
                            <a href="#toggle">
                                <i className={`fas ${ pastIsExpanded ? 'fa-compress-alt' : 'fa-expand-alt' } fa-fw`} />
                            </a>
                            }
                        </h2>
                        <table>
                            <tbody>
                                <tr>
                                    <td>Election name with dots if too long...</td>
                                    <td><NextLink href="/elections/4"><a>vote</a></NextLink></td>
                                </tr>
                                <tr>
                                    <td>Election name with dots if too long...</td>
                                    <td><NextLink href="/elections/5"><a>vote</a></NextLink></td>
                                </tr>
                                <tr>
                                    <td>Election name with dots if too long...</td>
                                    <td><NextLink href="/elections/6"><a>vote</a></NextLink></td>
                                </tr>
                            </tbody>
                        </table>
                        { (pastIsExpandable && !pastIsExpanded) &&
                        <p className="toggle">
                            <a href="#toggle">show more</a>
                        </p>
                        }
                    </div>
                    }
                </React.Fragment>
                }
                { isModerator &&
                <React.Fragment>
                    { (!expandedSection || assignedIsExpanded) &&
                    <div className="assigned spaced">
                        <h2>
                            <i className="fas fa-vote-yea fa-fw" />
                            elections you&apos;re moderating
                            { (assignedIsExpandable || assignedIsExpanded) &&
                            <a href="#toggle">
                                <i className={`fas ${ assignedIsExpanded ? 'fa-compress-alt' : 'fa-expand-alt' } fa-fw`} />
                            </a>
                            }
                        </h2>
                        <table>
                            <tbody>
                                <tr>
                                    <td>Election name with dots if too long...</td>
                                    <td><NextLink href="/elections/1"><a>vote</a></NextLink></td>
                                </tr>
                                <tr>
                                    <td>Election name with dots if too long...</td>
                                    <td><NextLink href="/elections/2"><a>vote</a></NextLink></td>
                                </tr>
                                <tr>
                                    <td>Election name with dots if too long...</td>
                                    <td><NextLink href="/elections/3"><a>vote</a></NextLink></td>
                                </tr>
                            </tbody>
                        </table>
                        { (assignedIsExpandable && !assignedIsExpanded) &&
                        <p className="toggle">
                            <a href="#toggle">show more</a>
                        </p>
                        }
                    </div>
                    }
                </React.Fragment>
                }
                { !isVoter &&
                <React.Fragment>
                    { (!expandedSection || latestIsExpanded) &&
                    <div className="latest spaced">
                        <h2>
                            <i className="fas fa-vote-yea fa-fw" />
                            latest elections
                            { (latestIsExpandable || latestIsExpanded) &&
                            <a href="#toggle">
                                <i className={`fas ${ latestIsExpanded ? 'fa-compress-alt' : 'fa-expand-alt' } fa-fw`} />
                            </a>
                            }
                        </h2>
                        <table>
                            <tbody>
                                <tr>
                                    <td>Election name with dots if too long...</td>
                                    <td><NextLink href="/elections/1"><a>vote</a></NextLink></td>
                                </tr>
                                <tr>
                                    <td>Election name with dots if too long...</td>
                                    <td><NextLink href="/elections/2"><a>vote</a></NextLink></td>
                                </tr>
                                <tr>
                                    <td>Election name with dots if too long...</td>
                                    <td><NextLink href="/elections/3"><a>vote</a></NextLink></td>
                                </tr>
                            </tbody>
                        </table>
                        { (latestIsExpandable && !latestIsExpanded) &&
                        <p className="toggle">
                            <a href="#toggle">show more</a>
                        </p>
                        }
                    </div>
                    }
                </React.Fragment>
                }
                <style jsx>{`
                    h1, h3 {
                        text-align: center;
                        white-space: nowrap;
                    }

                    h2 {
                        background-color: black;
                        color: white;
                        padding: 10px;
                        font-variant: small-caps;
                        display: flex;
                        align-items: center;

                        a {
                            margin: 0 5px 0 auto;
                            transform: rotate(-45deg);
                        }
                    }

                    h3 {
                        margin-top: 5px;
                        font-size: .64rem;
                    }

                    h2 > i {
                        margin: 0 12.5px 0 5px;
                    }

                    table {
                        width: 100%;
                        margin-top: 5px;

                        td {
                            padding: 2.5px 5px;
                        }

                        td:first-child {
                            width: 100%;
                        }

                        td:last-child {
                            font-variant: small-caps;
                        }

                        &.empty td:first-child {
                            text-align: center;
                        }
                    }

                    .spaced {
                        margin: 25px 0;
                    }

                    .bold {
                        font-weight: bold;
                    }

                    .toggle {
                        margin-top: 2.5px;
                        font-variant: small-caps;
                        text-align: center;
                    }
                `}</style>
            </div>
        </MainLayout>
    );
}
