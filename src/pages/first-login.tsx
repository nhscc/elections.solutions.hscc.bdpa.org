import * as React from 'react'
import { useRedirection } from 'multiverse/simple-auth-session/hooks'
import { useUser } from 'universe/frontend/hooks'
import PasswordForm from 'components/password-form'

const REDIRECT_ON_NOT_FIRST_LOGIN_LOCATION = '/dashboard';

export default function FirstLoginPage() {
    const { redirecting } = useRedirection({
        endpointURI: '/api/user',
        redirectTo: REDIRECT_ON_NOT_FIRST_LOGIN_LOCATION,
        redirectIf: data => !data.authed || !data.firstLogin,
        redirectArgs: { replace: true }
    });

    const { user } = useUser();

    const topmatter = (
        <header>
            <p>Welcome, {user.username}. You must update your password before you can use this account.</p>
            <hr />
            <style jsx>{`
                header {
                    margin-bottom: 15px;
                }
            `}</style>
        </header>
    );

    // ? This ensures the form is only rendered if we're not redirecting
    return redirecting !== false ? null : <PasswordForm topmatter={topmatter} />;
}
