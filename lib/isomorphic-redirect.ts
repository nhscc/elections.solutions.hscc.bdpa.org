import Router from 'next/router'
import isServerSide from 'multiverse/is-server-side'

import type { HTTPStatusCode } from 'types/global'
import type { NextApiResponse } from 'next'

const DEFAULT_REDIRECT_STATUS: HTTPStatusCode = 301;

export type FrontendRedirectArgs = {
    replace?: boolean;
    bypassRouter?: boolean;
};

export type BackendRedirectArgs = {
    res: NextApiResponse;
    status?: HTTPStatusCode;
    immediate?: boolean;
};

export type IsomorphicRedirectArgs = FrontendRedirectArgs & BackendRedirectArgs;

/**
 * Redirects the client to a specific location when this function is called on
 * the frontend. This function should never be called from the backend. Supports
 * any valid URI.
 *
 * If `replace` is `true`, `Router.replace()` will be called, otherwise
 * `Router.push()` is used (default).
 *
 * If `bypassRouter` is `true` or `location` is a network-path reference, the
 * Router is bypassed and window.location will be used for a "hard" redirect.
 */
export const frontendRedirect = (location: string, args?: FrontendRedirectArgs) => {
    // ? Ensure we're not dealing with a network-path reference (https://stackoverflow.com/q/3583103/1367414)
    (!args?.bypassRouter && location[0] == '/' && location[1] != '/')
        ? Router[args?.replace ? 'replace' : 'push'](location)
        : window.location = location;
};

/**
 * Redirects the client to a specific location when this function is called
 * backend. This function should never be called from the frontend. Supports any
 * valid HTTP 3xx redirect target.
 *
 * If the `immediate` parameter is `true`, `res.end()` will be called,
 * immediately ending further processing of the response. It is false by
 * default.
 */
export const backendRedirect = (location: string, { res, status = DEFAULT_REDIRECT_STATUS, immediate }: BackendRedirectArgs) => {
    res.setHeader('Location', location);
    res.statusCode = status;
    immediate && res.end();
};

/**
 * Redirects the client to a specific location regardless of the runtime:
 * frontend or backend. Supports any valid URI or HTTP 3xx redirect target.
 *
 * To keep this function's behavior simple to reason about, note that if
 * IsomorphicRedirectArgs does not have a "res" key, then this function MUST be
 * executing on the frontend. An Error will be thrown if this is not the case.
 */
export const isomorphicRedirect = (location: string, { res, status, immediate, replace }: IsomorphicRedirectArgs) => {
    if(isServerSide()) {
        if(!res) throw new Error('Function isomorphicRedirect expects a res key in the IsomorphicRedirectArgs parameter');
        return backendRedirect(location, { res, status, immediate });
    }

    else
        return frontendRedirect(location, { replace });
};
