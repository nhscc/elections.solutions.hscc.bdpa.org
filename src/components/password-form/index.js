/* @flow */

import * as React from 'react'
import { useState, useEffect } from 'react'
import { useUser } from 'universe/frontend/hooks'
import { frontendRedirect } from 'multiverse/isomorphic-redirect'
import NextLink from 'next/link'

export const WEAK = -1;
export const MEDIUM = 0;
export const STRONG = 1;


export const validatePasswordsMatch = (p1: string, p2: string) => p1 == p2;
export const calcPasswordStrength = (pass: string) => pass.length <= 10 ? WEAK : (pass.length <= 16 ? MEDIUM : STRONG);

// TODO: document that it takes in topmatter via props
export default function PasswordForm({ topmatter }: Object) {
    const { user } = useUser();
    const [ error, setError ] = useState('');
    const [ isFirstRender, setIsFirstRender ] = useState(true);
    const [ canSubmit, setCanSubmit ] = useState(false);
    const [ submitted, setSubmitted ] = useState(false);
    const [ password, setPassword ] = useState('');
    const [ repeatPassword, setRepeatPassword ] = useState('');

    const checkValidPassword = () => {
        const valid = validatePasswordsMatch(password, repeatPassword);

        if(!valid) {
            setCanSubmit(false);
            setError('Your passwords must match!');
        }

        return valid;
    }

    const checkStrongPassword = () => {
        const strong = calcPasswordStrength(password) != WEAK;

        if(!strong) {
            setCanSubmit(false);
            setError('Your password is not strong enough. Please add more characters.');
        }

        return strong;
    };

    useEffect(() => {
        setIsFirstRender(false);

        if(!isFirstRender && checkStrongPassword() && checkValidPassword()) {
            setCanSubmit(true);
            setError('');
        }
    }, [password, repeatPassword]);

    const handleSubmit = async e => {
        setCanSubmit(false); // ? Disable the submit button so it's not double clicked
        e.preventDefault();

        if(checkValidPassword() && checkStrongPassword()) {
            // ? We hash the password here so that the real password never leaves
            // ? the browser (the beginnings of a good security measure)
            const hashedPassword = `$SHA-256<${password}>`; // TODO: actually SHA-256 hash password

            // ? Send the updated data to the server and mutate key
            const { err } = await user.put({
                firstLogin: false,
                password: hashedPassword,
            });

            // ? `err` will be an empty string/falsey if there is no error
            setError(err);
            setCanSubmit(true);
            !err && setSubmitted(true);
        }
    };

    return (
        <div className="wrapper">
            <div className="first-login">
                { topmatter }
                <form onSubmit={handleSubmit}>
                    <label htmlFor="password">New Password</label>
                    <input
                        required
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Your password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className={error && 'error'}
                    />
                    <label htmlFor="repeat-password">Repeat Password</label>
                    <input
                        required
                        id="repeat-password"
                        name="repeat-password"
                        type="password"
                        placeholder="Repeat your password"
                        value={repeatPassword}
                        onChange={e => setRepeatPassword(e.target.value)}
                        className={error && 'error'}
                    />
                    <button disabled={!canSubmit} type="submit" name="submit">Finalize</button>
                    <p className={`error ${error ? 'show' : ''}`}>{`Error: ${error}`}</p>
                    <p className={`submitted ${submitted ? 'show' : ''}`}>
                        Password was updated successfully!<br /><NextLink href="/account"><a>Go back.</a></NextLink>
                    </p>
                </form>
            </div>
            <style jsx>{`
                .wrapper {
                    display: flex;
                    flex-flow: column;
                    width: 100%;
                    height: 100%;
                }

                .first-login {
                    width: 100%;
                    max-width: 340px;
                    margin: 0 auto;
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

                input.error {
                    outline: 1px red solid;
                }

                p.error {
                    margin: 15px 0 0;
                    display: none;
                    color: brown;
                }

                p.submitted {
                    margin: 15px 0 0;
                    display: none;
                }

                p.show {
                    display: block;
                }
            `}</style>
        </div>
    );
}
