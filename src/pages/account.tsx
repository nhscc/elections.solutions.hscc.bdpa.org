import * as React from 'react'
import MainLayout from 'components/layout/main'
import { useState } from 'react'
import { useUser } from 'universe/frontend/hooks'
import NextLink from 'next/link'

export default function AccountPage() {
    const { user } = useUser();

    const [ loaded, setLoaded ] = useState(false);
    const [ error, setError ] = useState('');
    const [ disabled, setDisabled ] = useState(true);
    const [ username, setUsername ] = useState('');
    const [ first, setFirst ] = useState('');
    const [ last, setLast ] = useState('');
    const [ email, setEmail ] = useState('');
    const [ phone, setPhone ] = useState('');
    const [ address, setAddress ] = useState('');
    const [ city, setCity ] = useState('');
    const [ state, setState ] = useState('');
    const [ zip, setZip ] = useState('');

    if(!loaded && user.userId) {
        setUsername(user.username);
        setFirst(user.name.first);
        setLast(user.name.last);
        setEmail(user.email);
        setPhone(user.phone);
        setAddress(user.address);
        setCity(user.city);
        setState(user.state);
        setZip(user.zip);
        setLoaded(true);
    }

    const handleSubmit = async e => {
        e.preventDefault();
        setDisabled(true);

        const { error } = await user.put({
            name: { first, last },
            email,
            phone,
            address,
            city,
            state,
            zip
        });

        // ? `error` will be an empty string/falsey if there is no error
        setError(error);
        error && setDisabled(false);
    };

    // ? This ensures the form is only rendered if we're not redirecting
    return (
        <MainLayout loading={!loaded}>
            <div className="wrapper">
                <div className="account">
                    <form onSubmit={handleSubmit}>
                        <label htmlFor="username">Username</label>
                        <input disabled type="text" value={username} />
                        <NextLink href="/change-password"><a>Change your password</a></NextLink>
                        <hr />
                        <section className={`loaded ${ loaded ? 'show' : ''}`}>
                            <label htmlFor="name">Your Name</label>
                            <div id="name" className="flex-name">
                                <input
                                    id="first"
                                    name="first"
                                    placeholder="First"
                                    type="text"
                                    value={first}
                                    onChange={e => (setDisabled(false), setFirst(e.target.value)) }
                                />
                                <input
                                    id="last"
                                    name="last"
                                    placeholder="Last"
                                    type="text"
                                    value={last}
                                    onChange={e => (setDisabled(false), setLast(e.target.value)) }
                                />
                            </div>
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                name="email"
                                placeholder="Email"
                                type="email"
                                value={email}
                                onChange={e => (setDisabled(false), setEmail(e.target.value)) }
                            />
                            <label htmlFor="phone">Phone</label>
                            <input
                                id="phone"
                                name="phone"
                                placeholder="Phone"
                                type="text"
                                value={phone}
                                onChange={e => (setDisabled(false), setPhone(e.target.value)) }
                            />
                            <label htmlFor="address">Address</label>
                            <input
                                id="address"
                                name="address"
                                placeholder="Address"
                                type="text"
                                value={address}
                                onChange={e => (setDisabled(false), setAddress(e.target.value)) }
                            />
                            <div className="flex-city-state">
                                <div>
                                    <label htmlFor="city">City</label>
                                    <input
                                        id="city"
                                        name="city"
                                        placeholder="City"
                                        type="text"
                                        value={city}
                                        onChange={e => (setDisabled(false), setCity(e.target.value)) }
                                    />
                                </div>
                                <div>
                                    <label htmlFor="state">State</label>
                                    <input
                                        id="state"
                                        name="state"
                                        placeholder="State"
                                        type="text"
                                        value={state}
                                        onChange={e => (setDisabled(false), setState(e.target.value)) }
                                    />
                                </div>
                                <div>
                                    <label htmlFor="zip">Zip</label>
                                    <input
                                        id="zip"
                                        name="zip"
                                        placeholder="Zip"
                                        type="text"
                                        value={zip}
                                        onChange={e => (setDisabled(false), setZip(e.target.value)) }
                                    />
                                </div>
                            </div>
                            <button type="submit" name="submit" disabled={disabled}>{ disabled ? 'Saved!' : 'Save Changes' }</button>
                        </section>
                        <section className={`loading ${ !loaded ? 'show' : ''}`}>
                            <p>One moment...</p>
                        </section>
                        <p className={`error ${error ? 'show' : ''}`}>{`Error: ${error}`}</p>
                    </form>
                </div>
                <style jsx>{`
                    .wrapper {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        width: 100%;
                        height: 100%;
                    }

                    .account {
                        width: 100%;
                        max-width: 340px;
                        margin: 0 auto;
                    }

                    section {
                        display: none;
                        flex-flow: column;

                        &.show {
                            display: flex;
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

                    .error.show {
                        display: block;
                    }

                    .flex-name,
                    .flex-city-state {
                        display: flex;
                        justify-content: space-between;

                        input {
                            width: 47%;
                        }

                        div {
                            display: flex;
                            flex-direction: column;
                            align-items: center;

                            label {
                                align-self: flex-start;
                            }

                            &:first-child {
                                align-items: flex-start;
                            }

                            &:last-child {
                                align-items: flex-end;

                                label {
                                    align-self: flex-end;
                                    width: 95%;
                                }
                            }
                        }
                    }

                    .flex-city-state input {
                        width: 95%;
                    }

                    .loading {
                        text-align: center;
                    }
                `}</style>
            </div>
        </MainLayout>
    );
}
