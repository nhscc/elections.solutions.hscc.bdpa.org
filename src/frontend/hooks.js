/* @flow */

import { useState } from 'react'
import { useIsomorphicLayoutEffect as useLayoutEffect } from 'react-use'
import { UserTypes } from 'universe/backend'
import { defaultSWRFetcher } from 'universe/frontend'
import { fetchEndpoint } from 'multiverse/fetch-endpoint'
import useSWR from 'swr'

/**
 * TODO: isXYZ are null when unknown/loading, false when false, true when true
 */
export function useUserType() {
    const { data: user } = useSWR('/api/user', defaultSWRFetcher);

    const [ isRoot, setIsRoot ] = useState(null);
    const [ isAdmin, setIsAdmin ] = useState(null);
    const [ isModerator, setIsModerator ] = useState(null);
    const [ isVoter, setIsVoter ] = useState(null);
    const [ isReporter, setIsReporter ] = useState(null);

    useLayoutEffect(() => {
        setIsRoot(user?.root);
        setIsAdmin(user?.type == UserTypes.administrator);
        setIsModerator(user?.type == UserTypes.moderator);
        setIsVoter(user?.type == UserTypes.voter);
        setIsReporter(user?.type == UserTypes.reporter);
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
    // ? like: `newData = { ...user, somedata }`
    const user = Object.assign(Object.create({
        async put(o: any) {
            const { error: err } = await fetchEndpoint.put('/api/user', { body: JSON.stringify(o) });
            return { error: err };
        }
    }), data);

    return { user, error, mutate };
}
