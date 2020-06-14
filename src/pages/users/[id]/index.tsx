import * as React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { useUserType, useUser } from 'universe/frontend/hooks'
import { useRedirection } from 'multiverse/simple-auth-session/hooks'
import { defaultSWRFetcher } from 'universe/frontend'
import { WithAuthed, User } from 'types/global'
import MainLayout from 'components/layout/main'
import useSWR from 'swr'

const REDIRECT_ON_UNAUTH_LOCATION = '/dashboard';

export default function UserPage() {
    const { redirecting } = useRedirection<WithAuthed<User>>({
        endpointURI: '/api/user',
        redirectTo: REDIRECT_ON_UNAUTH_LOCATION,
        redirectIf: data => !['administrator', 'moderator'].includes(data.type as string)
    });

    const router = useRouter();
    const { user: sessionUser } = useUser();
    const { isAdmin, isModerator, isRoot } = useUserType();
    const { id } = router.query;
    const { data: pageUser, error, mutate } = useSWR(`/api/users/${id}`, defaultSWRFetcher);

    // ? 0 = view, 1 = edit, 2 = restrict, 3 = delete
    const [ showMode, setShowMode ] = useState(0);

    const handleEditUser = (e: React.SyntheticEvent) => {
        e.preventDefault();
    };

    const handleDeleteUser = (e: React.SyntheticEvent) => {
        e.preventDefault();
    };

    const handleRestrictUser = (e: React.SyntheticEvent) => {
        e.preventDefault();
    };

    // ? (the following assumes the isAdmin === TRUE)
    // ? 1. Admins cannot mutate/delete each other (unless root)
    // ? 2. Root can never be deleted or restricted
    // ? 3. Accounts cannot mutate/restrict themselves
    const viewingSelf = sessionUser.userId == pageUser?.userId;
    const canMutatePageUser = viewingSelf || sessionUser.root || pageUser?.type != 'administrator';

    const navbarRender = () => isAdmin && canMutatePageUser && (
        <React.Fragment>
            <li className={showMode == 1 ? 'active' : undefined}>
                <a href="#edit" onClick={handleEditUser}>Edit user</a>
            </li>
            { !viewingSelf &&
                <React.Fragment>
                    <li className={showMode == 2 ? 'active' : undefined}>
                        <a href="#restrict" onClick={handleRestrictUser}>Restrict user</a>
                    </li>
                    <li className={showMode == 3 ? 'active' : undefined}>
                        <a href="#delete" onClick={handleDeleteUser}>Delete user</a>
                    </li>
                </React.Fragment>
            }
        </React.Fragment>
    );

    return (
        <MainLayout navbarRender={navbarRender} loading={redirecting || !sessionUser.userId || !pageUser?.userId}>
            <h1>Viewing user {pageUser?.userId}</h1>
        </MainLayout>
    );
}

