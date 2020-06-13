// ? Access types shared between projects from `types/global` too
export * from './_shared';

/**
 * 
 */
export type UserType = 'administrator' | 'moderator' | 'voter' | 'reporter';
export const UserTypes: UserType[] = ['administrator', 'moderator', 'voter', 'reporter'];

export type LastLogin = {
    ip: string;
    time: number;
};

export type User = {
    username: string;
    password: string;
    type: UserType;
    firstLogin: false;
    deleted: false;
    restricted: false;
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

export type AugmentedUser = User & {
    root: boolean;
    userId: number,
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

