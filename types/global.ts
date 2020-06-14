import type {
    NextParamsRRWithSession as NPR,
    NextSessionRequest as NSR
} from 'multiverse/simple-auth-session'

// ? Access types shared between projects from `types/global` too
export * from './_shared';

/**
 * 
 */
export type UserType = 'administrator' | 'moderator' | 'voter' | 'reporter';
export const UserTypes: UserType[] = ['administrator', 'moderator', 'voter', 'reporter'];

export type LastLogin = {
    ip: string;
    time: number | null;
};

export type User = {
    username: string;
    password: string;
    type: UserType;
    firstLogin: boolean;
    deleted: boolean;
    restricted: boolean;
    lastLogin: LastLogin;
    name: {
        first: string;
        last: string;
    },
    elections: {
        eligible: string[];
        moderating: string[];
    },
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    otp: string;
};

export type Users = { [userId: string]: User };

export type PublicUser = User & {
    root: boolean;
    userId: number;
    debugging: boolean;
}

/**
 * 
 */
export type Database = {
    nextUserId: number;
    rootUserId: number;
    users: Users;
    'username->id': { [username: string]: number };
    'email->id': { [email: string]: number };
    'otp->id': { [otp: string]: number };
};

type AppSessionProperties = {
    userId: number;
    prevLogin: LastLogin;
};

export type NextSessionRequest = NSR;
export type NextAuthedSessionRequest = NSR<AppSessionProperties>;
export type NextParamsRRWithSession = NPR<AppSessionProperties>;

export type WithAuthed<T> = { authed: boolean } & T;
export type WithPrevLogin<T> = { prevLogin: LastLogin } & T;
