/* @flow */

import * as React from 'react'
import { useState, useEffect } from 'react'
import { useRedirection } from 'multiverse/simple-auth-session'
import { useUser } from 'universe/frontend/hooks'
import { fetchEndpoint } from 'multiverse/fetch-endpoint'

const REDIRECT_ON_AUTH_LOCATION = '/dashboard';

export default function LoginPage() {
    const { redirecting, mutate } = useRedirection({
        endpointURI: '/api/user',
        redirectTo: REDIRECT_ON_AUTH_LOCATION,
        redirectIf: data => data.authed && !data.deleted,
        redirectArgs: { replace: true }
    });

    const { user } = useUser();

    // ? When the user is deleted elsewhere and we're kicked to this page, tell
    // ? the rest of the app to deauth client-side and asynchronously deauth
    // ? server-side
    useEffect(() => {
        if(!redirecting && user.authed && user.deleted)
            fetchEndpoint.post('/api/logout'); // ! (purposely not await-ed)
    }, [redirecting, user.authed, user.deleted]);

    const [ username, setUsername ] = useState('');
    const [ password, setPassword ] = useState('');
    const [ email, setEmail ] = useState('');
    const [ showEmailPrompt, setShowEmailPrompt ] = useState(false);
    const [ sent, setSent ] = useState(false);
    const [ error, setError ] = useState('');

    const handleLoginSubmit = async e => {
        e.preventDefault();

        // ? We hash the password here so that the real password never leaves
        // ? the browser (the beginnings of a good security measure)
        const hashedPassword = `$SHA-256<${password}>`; // TODO: actually SHA-256 hash password
        const { res, data, error } = await fetchEndpoint.post('/api/login', {
            body: JSON.stringify({ username, password: hashedPassword })
        });

        // ? If the request returns ok, then we know the login was successful.
        // ? We use mutate() to the rest of the app about the great news!
        const triesLeft = data?.triesLeft !== undefined ? ` (${data.triesLeft} ${ data.triesLeft != 1 ? 'tries' : 'try' } left)` : '';
        res.ok ? mutate({ authed: true }) : setError(`${error}${triesLeft}`);
    };

    const handleEmailSubmit = async e => {
        e.preventDefault();

        if(!sent) {
            setSent(true);
            const { res, error } = await fetchEndpoint.post('/api/generate-otp', { body: JSON.stringify({ email }) });
            !res.ok && setError(`${error}`);
        }
    };

    const handleToggleEmailPrompt = async e => {
        e.preventDefault();
        setError('');
        setShowEmailPrompt(!showEmailPrompt);
    };

    // ? The next line ensures the login form is only rendered if we're not
    // ? redirecting
    return redirecting !== false ? null : (
        <div className={`wrapper ${showEmailPrompt ? 'show-email-prompt' : ''}`}>
            <div className="login">
                <form onSubmit={handleLoginSubmit}>
                    <label htmlFor="username">Username</label>
                    <input
                        required
                        id="username"
                        name="username"
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                    />
                    <label htmlFor="password">Password</label>
                    <input
                        required
                        id="password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                    <button type="submit" name="submit">Login</button>
                    <p className={`error ${error ? 'show' : ''}`}>{`Error: ${error}`}</p>
                </form>
                <p className="forgot-link">
                    <a href="#forgot" onClick={handleToggleEmailPrompt}>Forgot username/password?</a>
                </p>
            </div>
            <div className="forgot-form">
                <p>
                    Enter the email address associated with your account and, if it exists, an email with a recovery
                    link will be sent.
                </p>
                <form onSubmit={handleEmailSubmit}>
                    <label htmlFor="email">Email</label>
                    <input
                        required
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        disabled={sent}
                        onChange={e => setEmail(e.target.value)}
                    />
                    <button type="submit" name="submit" disabled={sent}>{
                        sent ? 'Sent!' : 'Send Recovery Email'
                    }</button>
                    <p className={`error ${error ? 'show' : ''}`}>{`Error: ${error}`}</p>
                </form>
                <p className="forgot-link">
                    <a href="#back" onClick={handleToggleEmailPrompt}>{'<'} Go back</a>
                </p>
            </div>
            <style jsx>{`
                .wrapper {
                    display: flex;
                    align-items: center;
                    width: 100%;
                    height: 100%;
                }

                .login,
                .forgot-form {
                    width: 100%;
                    max-width: 340px;
                    margin: 0 auto;
                    padding: 1rem;
                }

                .forgot-form {
                    display: none;

                    & > p {
                        margin-bottom: 30px;
                    }
                }

                form {
                    display: flex;
                    flex-flow: column;
                }

                label {
                    font-weight: bold;
                }

                input {
                    padding: 8px;
                    margin: 0.3rem 0 1rem;
                    border: 1px solid #ccc;
                }

                .error {
                    margin: 0.5rem 0 0;
                    display: none;
                    color: brown;
                }

                .show {
                    display: block;
                }

                .forgot-link {
                    text-align: center;
                    margin-top: 35px;
                }

                .show-email-prompt {
                    .login {
                        display: none;
                    }

                    .forgot-form {
                        display: block;
                    }
                }
            `}</style>
        </div>
    );
}
