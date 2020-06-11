import * as React from 'react'
import { useUserType } from 'universe/frontend/hooks'
import { UserTypes } from 'universe/backend'
import { useRedirection } from 'multiverse/simple-auth-session/hooks'
import MainLayout from 'components/layout/main'

const REDIRECT_ON_UNAUTH_LOCATION = '/dashboard';

export default function CreateUserPage(): JSX.Element {
    const { redirecting } = useRedirection({
        endpointURI: '/api/user',
        redirectTo: REDIRECT_ON_UNAUTH_LOCATION,
        redirectIf: data => data.type != UserTypes.administrator
    });

    const { isAdmin, isModerator } = useUserType();

    return (
        <MainLayout loading={redirecting}>
            <h1>Create user form</h1>
        </MainLayout>
    );
}
