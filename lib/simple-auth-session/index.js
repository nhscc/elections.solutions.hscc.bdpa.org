/* @flow */

import { applySession } from 'next-session'
import findPackageJSON from 'find-package-json'

import type { NextParamsRR, NextSessionRequest, NextParamsRRWithSession } from 'multiverse/flow-extras'

export type { NextSessionRequest };

// TODO: document all of this
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
