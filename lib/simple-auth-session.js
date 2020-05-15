/* @flow */

import { useState } from 'react'
import { useIsomorphicLayoutEffect as useLayoutEffect } from 'react-use'
import { applySession } from 'next-session'
import { frontendRedirect } from 'multiverse/isomorphic-redirect'
import { fetchEndpoint } from 'multiverse/fetch-endpoint'
import findPackageJSON from 'find-package-json'
import isUndefined from 'is-undefined'
import useSWR from 'swr'

import type { FrontendRedirectArgs } from 'multiverse/isomorphic-redirect'
import type { NextParamsRR, NextSessionRequest, NextParamsRRWithSession } from 'multiverse/flow-extras'

export type { NextSessionRequest };

export type UseAuthArgs = {
    endpointURI: string,
    fetchArgs?: Object,
    redirectIf?: (data: Object, isDone: boolean) => boolean,
    redirectTo?: string,
    redirectArgs?: FrontendRedirectArgs,
    verbose?: boolean
};

let sessionOptions = null;

export function getGlobalSessionOptions() {
    return sessionOptions = sessionOptions || findPackageJSON(process.cwd()).next()?.value?.sessionOptions || {};
}

export async function sessionStart(args: NextParamsRR) {
    await applySession(args.req, args.res, getGlobalSessionOptions());
}

const setup = async (args: NextParamsRRWithSession) => {
    !args.req.session && await sessionStart(args);
    args.req.session.__sa = args.req.session.__sa || {};
};

export async function isAuthed(args: NextParamsRRWithSession): Promise<boolean> {
    await setup(args);
    return !!args.req.session.__sa.authed;
}

export async function auth(args: NextParamsRRWithSession) {
    await setup(args);
    args.req.session.__sa.authed = true; // TODO: document "authed" prop
}

export async function deauth(args: NextParamsRRWithSession) {
    await setup(args);
    args.req.session.__sa.authed = false;
}

// TODO: react hook meant for frontend use only
// TODO: returns "redirecting" null (undecided), true, or false
// TODO: also returns mutate
export function useRedirection({ endpointURI, redirectIf, redirectTo, redirectArgs, fetchArgs }: UseAuthArgs) {
    const { data, error, mutate } = useSWR(endpointURI,
        url => fetchEndpoint(url, { method: 'GET', ...fetchArgs }).then(o => o.data)
    );

    const [ redirecting, setRedirecting ] = useState(null);
    const isDone = !isUndefined(data);

    // ? This will cause all windows and tabs sharing the session to deauth
    useLayoutEffect(() => {
        if(!isDone) return;

        if(!redirectTo || !redirectIf || !redirectIf(data, isDone))
            setRedirecting(false);

        else {
            frontendRedirect(redirectTo, redirectArgs);
            setRedirecting(true);
        }
    }, [data, isDone, redirectIf, redirectTo, redirectArgs]);

    return { redirecting, mutate, error };
}
