import { useState } from 'react'
import { useIsomorphicLayoutEffect as useLayoutEffect } from 'react-use'
import { frontendRedirect } from 'multiverse/isomorphic-redirect'
import { fetchEndpoint } from 'multiverse/fetch-endpoint'
import isUndefined from 'is-undefined'
import useSWR from 'swr'

import type { FrontendRedirectArgs } from 'multiverse/isomorphic-redirect'

export type useRedirectionArgs = {
    endpointURI: string;
    fetchArgs?: Record<string, unknown>;
    redirectIf?: (data: Record<string, unknown>, isDone: boolean) => boolean;
    redirectTo?: string;
    redirectArgs?: FrontendRedirectArgs;
    verbose?: boolean;
};

// TODO: document this:
// TODO: react hook meant for frontend use only
// TODO: returns "redirecting" null (undecided), true, or false
// TODO: also returns mutate
export function useRedirection({ endpointURI, redirectIf, redirectTo, redirectArgs, fetchArgs }: useRedirectionArgs) {
    const { data, error, mutate } = useSWR(endpointURI,
        url => fetchEndpoint(url, { method: 'GET', ...fetchArgs }).then(o => o.data)
    );

    const [ redirecting, setRedirecting ] = useState<boolean | null>(null);

    // ? This will cause all windows and tabs sharing the session to deauth
    useLayoutEffect(() => {
        if(!isUndefined(data))
            return;

        if(!redirectTo || !redirectIf || !redirectIf(data, true))
            setRedirecting(false);

        else {
            frontendRedirect(redirectTo, redirectArgs);
            setRedirecting(true);
        }
    }, [data, redirectIf, redirectTo, redirectArgs]);

    return { redirecting, mutate, error };
}
