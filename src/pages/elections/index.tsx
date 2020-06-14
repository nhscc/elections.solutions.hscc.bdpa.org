import * as React from 'react'
import { useUserType } from 'universe/frontend/hooks'
import MainLayout from 'components/layout/main'

export default function ListElectionsPage() {
    //const { isAdmin, isModerator } = useUserType();

    return (
        <MainLayout>
            <h1>List of elections in the system</h1>
        </MainLayout>
    );
}
