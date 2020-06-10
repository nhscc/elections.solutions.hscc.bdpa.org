import { applySession } from 'next-session'
import findPackageJSON from 'find-package-json'

import type { NextApiRequest, NextApiResponse } from 'next'

export type NextParamsRR<T = object> = {
    req: NextApiRequest;
    res: NextApiResponse<T>;
};

export type NextSessionRequest = NextApiRequest & { session: { __sa: { authed: boolean }}};
export type NextParamsRRWithSession = NextParamsRR & { req: NextSessionRequest };

// TODO: document all of this
let sessionOptions: object | null = null;

export function getGlobalSessionOptions(): typeof sessionOptions {
    return sessionOptions = sessionOptions || findPackageJSON(process.cwd()).next()?.value?.sessionOptions || {};
}

export async function sessionStart(args: NextParamsRR): Promise<void> {
    await applySession(args.req, args.res, getGlobalSessionOptions());
}

const setup = async (args: NextParamsRRWithSession): Promise<void> => {
    !args.req.session && await sessionStart(args);
    // TODO: use a symbol type for authed instead of relying on __sa.whatever
    args.req.session.__sa = args.req.session.__sa || { authed: false };
};

export async function isAuthed(args: NextParamsRRWithSession): Promise<boolean> {
    await setup(args);
    return !!args.req.session.__sa.authed;
}

export async function auth(args: NextParamsRRWithSession): Promise<void> {
    await setup(args);
    args.req.session.__sa.authed = true; // TODO: document "authed" prop
}

export async function deauth(args: NextParamsRRWithSession): Promise<void> {
    await setup(args);
    args.req.session.__sa.authed = false;
}
