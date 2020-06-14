import * as React from 'react'
import { useUserType } from 'universe/frontend/hooks'
import MainLayout from 'components/layout/main'

export default function ListUsersPage(): JSX.Element {
    //const { isAdmin, isModerator } = useUserType();

    return (
        <MainLayout>
            <h1>List of users in the system</h1>
        </MainLayout>
    );
}
