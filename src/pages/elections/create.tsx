import * as React from 'react'
import { useUserType } from 'universe/frontend/hooks'
import { useRedirection } from 'multiverse/simple-auth-session/hooks'
import MainLayout from 'components/layout/main'
import { WithAuthed, User } from 'types/global';

const REDIRECT_ON_UNAUTH_LOCATION = '/dashboard';

export default function CreateElectionPage() {
    const { redirecting } = useRedirection<WithAuthed<User>>({
        endpointURI: '/api/user',
        redirectTo: REDIRECT_ON_UNAUTH_LOCATION,
        redirectIf: data => data.type != 'administrator'
    });

    //const { isAdmin, isModerator } = useUserType();

    return (
        <MainLayout loading={!!redirecting}>
            <h1>Create election form</h1>
        </MainLayout>
    );
}
