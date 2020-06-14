import { useState } from 'react'
import { useIsomorphicLayoutEffect as useLayoutEffect } from 'react-use'
import { frontendRedirect } from 'multiverse/isomorphic-redirect'
import { fetchEndpoint } from 'multiverse/fetch-endpoint'
import isUndefined from 'is-undefined'
import useSWR from 'swr'

import type { FrontendRedirectArgs } from 'multiverse/isomorphic-redirect'
import type { Options } from 'multiverse/fetch-endpoint'

export type useRedParams<T=Record<string, unknown>> = {
    endpointURI: string;
    fetchArgs?: Options;
    redirectIf?: (data: T) => boolean;
    redirectTo?: string;
    redirectArgs?: FrontendRedirectArgs;
    verbose?: boolean;
};

// TODO: document this:
// TODO: react hook meant for frontend use only
// TODO: returns "redirecting" null (undecided), true, or false
// TODO: also returns mutate
export function useRedirection<T>({ endpointURI, redirectIf, redirectTo, redirectArgs, fetchArgs }: useRedParams<T>) {
    const { data, error, mutate } = useSWR(endpointURI,
        url => fetchEndpoint(url, { method: 'GET', ...fetchArgs }).then(o => o.data)
    );

    const [ redirecting, setRedirecting ] = useState<boolean | null>(null);

    // ? This will cause all windows and tabs sharing the session to deauth
    useLayoutEffect(() => {
        if(isUndefined(data))
            return;

        if(!redirectTo || !redirectIf || !redirectIf(data || {}))
            setRedirecting(false);

        else {
            frontendRedirect(redirectTo, redirectArgs);
            setRedirecting(true);
        }
    }, [data, redirectIf, redirectTo, redirectArgs]);

    return { redirecting, mutate, error };
}
