import { useState } from 'react'
import { useIsomorphicLayoutEffect as useLayoutEffect } from 'react-use'
import { defaultSWRFetcher } from 'universe/frontend'
import { FrontendHookError } from 'universe/backend/error'
import { fetchEndpoint } from 'multiverse/fetch-endpoint'
import useSWR from 'swr'

import type { PublicUser, User, DeepPartial, WithAuthed, UnionObjects, WithPrevLogin } from 'types/global'

/**
 * TODO: isXYZ are null when unknown/loading, false when false, true when true
 */
export function useUserType() {
    const { data, error } = useSWR('/api/user', defaultSWRFetcher);
    const user = data as PublicUser || {};

    if(error)
        throw new FrontendHookError(error);

    const [ isRoot, setIsRoot ] = useState<boolean | null>(null);
    const [ isAdmin, setIsAdmin ] = useState<boolean | null>(null);
    const [ isModerator, setIsModerator ] = useState<boolean | null>(null);
    const [ isVoter, setIsVoter ] = useState<boolean | null>(null);
    const [ isReporter, setIsReporter ] = useState<boolean | null>(null);

    useLayoutEffect(() => {
        setIsRoot(user.root);
        setIsAdmin(user.type == 'administrator');
        setIsModerator(user.type == 'moderator');
        setIsVoter(user.type == 'voter');
        setIsReporter(user.type == 'reporter');
    }, [user]);

    return { isRoot, isAdmin, isModerator, isVoter, isReporter };
}

/**
 * TODO: user is always an object, but will be empty if data is still loading.
 * TODO: Does not handle calling mutate()
 */
export function useUser() {
    const { data, error, mutate } = useSWR('/api/user', defaultSWRFetcher);

    // ? This code gives the user object a method hidden in the prototype chain,
    // ? i.e. it won't show up when the object is spread, allowing for stuff
    // ? like: `newData = { ...user, some_data }`
    const base = {
        async put(o: DeepPartial<User>) {
            const { error: err } = await fetchEndpoint.put('/api/user', { body: JSON.stringify(o) });
            return { error: err };
        }
    };

    type WAPL<T> = WithAuthed<WithPrevLogin<T>>;
    const user = Object.assign<typeof base, WAPL<PublicUser>>(Object.create(base), data as WAPL<PublicUser>);

    return { user: user as UnionObjects<typeof base, typeof user>, error, mutate };
}
