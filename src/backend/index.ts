import { JsonDB as DummyDB } from 'node-json-db';
import { Config as DummyDBConfig } from 'node-json-db/dist/lib/JsonDBConfig'
import { getEnv } from 'universe/backend/env'
import { NotFoundError, ValidationError, AlreadyExistsError, AppError } from 'universe/backend/error';
import { UserTypes, UserType, Users } from 'types/global'
import EmailValidator from 'email-validator'
import isString from 'is-string'
import isNumber from 'is-number';
import deepMerge from 'deepmerge'
import genRndString from 'crypto-random-string'

import type { User, AugmentedUser } from 'types/global'

let db: DummyDB;

export const minUsernameLength = 5;
export const maxUsernameLength = 20;
export const expectedPhoneNumberLength = 10;
export const expectedZipLength = 5;
export const otpStringLength = 30;

type DefaultUser = Omit<User, 'type' | 'firstLogin' | 'lastLogin'> & {
    type: null;
    firstLogin: true;
    lastLogin: { ip: '', time: null };
};

export const DefaultUserProperties: DefaultUser = {
    username: '',
    password: '',
    type: null,
    firstLogin: true,
    restricted: false,
    deleted: false,
    lastLogin: { ip: '', time: null },
    name: { first: '', last: '' },
    elections: { eligible: [], moderating: [] },
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    otp: ''
};

// ? These hardcoded values override whatever's in the database when we get the
// ? root user's data
export const rootHardcodedData = {
    type: 'administrator',
    restricted: false,
    deleted: false,
};

/**
 * Used to lazily create the database once on-demand instead of immediately when
 * the app runs. Not exported.
 */
const getDB = () => db || (db = new DummyDB(new DummyDBConfig(getEnv().DUMMY_DB_PATH, true, true)));

/**
 * 
 * @param {*} path 
 */
const getData = (path: string): unknown => {
    try { return getDB().getData(path); }
    catch(e) {
        if(!e.message.startsWith("Can't find dataPath"))
            throw e;

        return null;
    }
}

/**
 * 
 * @param {*} path 
 */
const delData = (path: string) => {
    try { getDB().delete(path); }
    catch(e) {
        if(!e.message.startsWith("Can't find dataPath"))
            throw e;
    }
}

/**
 * 
 * @param  {...any} args 
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const putData = (...args: unknown[]) => getDB().push(...args);

/**
 * Used for testing purposes. Sets the global db instance to something else.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export function setDB(JSONDatabase: any) { db = JSONDatabase; }

/**
 * This function is called whenever modifications are being made to user data.
 * This function ensures the database does not become corrupted.
 *
 * Returns a merged data object that might be pushed into the database or null
 */
const sanitizeUserData = ({ userId, data }: { userId?: number, data: Partial<User> }) => {
    const hasUserId = userId !== undefined;
    const oldData = hasUserId ? getData(`/users/${userId}`) as User : null;

    data = data || {};

    // ? userId is not falsey only when we're mutating, so the userId must exist
    if(hasUserId && !oldData)
        throw new NotFoundError(`user id "${userId}" does not exist`);

    // ? Protect data integrity: let's whitelist possible user data mutations
    const keys = Object.keys(data);
    if(!keys.every(key => Object.keys(DefaultUserProperties).includes(key)))
        throw new ValidationError('only valid object key(s) in data', keys.join(', '));

    // ? We do this JSON stuff here to "deep clone" DefaultUserProperties
    // ? ensuring no references are shared between user objects (bad!)
    const defaultUserData = JSON.parse(JSON.stringify(DefaultUserProperties))

    // ! Note that, when merging one array with another, the new array will
    // ! OVERWRITE the old array, they will not be merged by design. Otherwise,
    // ! a deep merge occurs as expected.
    // See: https://www.npmjs.com/package/deepmerge#arraymerge-example-overwrite-target-array
    const newData = deepMerge.all([
        defaultUserData,
        oldData || {},
        data || {}
    ], { arrayMerge: (_, s) => s }) as User;

    // ? Ensure username is a string
    if(!isString(newData.username))
        throw new ValidationError('username to be a string', newData.username);

    // ? Ensure usernames are not less than minUsernameLength characters
    if(!(newData.username.length >= minUsernameLength))
        throw new ValidationError(`username.length >= ${minUsernameLength}`, newData.username);

    // ? Ensure usernames are not more than maxUsernameLength characters
    if(!(newData.username.length <= maxUsernameLength))
        throw new ValidationError(`username.length <= ${maxUsernameLength}`, newData.username);

    // ? Ensure usernames are alphabetical plus dashes
    if(!(/^[a-zA-Z-]+$/).test(newData.username))
        throw new ValidationError('username to contain only characters a-z, A-Z, and -', newData.username);

    // ? Ensure usernames remain unique
    if(newData.username != oldData?.username && getData(`/username->id/${newData.username}`))
        throw new AlreadyExistsError(`username "${newData.username}"`);

    // ? Ensure password is a string
    if(!isString(newData.password))
        throw new ValidationError('password to be a string', newData.password);

    // TODO: ensure passwords are proper (i.e. expected ciphertext length && password != username hashed (empty, salted))

    // ? Ensure the type is a value in our UserTypes enum
    if(!UserTypes.includes(newData.type))
        throw new ValidationError('valid type', newData.type);

    // ? firstLogin cannot go from false to true
    else if(oldData?.firstLogin === false && newData.firstLogin)
        throw new ValidationError('firstLogin cannot be set to `true`');

    // ? Ensure firstLogin, restricted, and deleted are booleans
    newData.firstLogin = !!newData.firstLogin;
    newData.restricted = !!newData.restricted;
    newData.deleted = !!newData.deleted;

    // ? Ensure lastLogin is proper
    if(!newData.lastLogin
        || !isString(newData.lastLogin.ip)
        || (newData.lastLogin.time !== null && !isNumber(newData.lastLogin.time))
        || Object.keys(newData.lastLogin).length != 2) {
        throw new ValidationError('a valid lastLogin', JSON.stringify(newData.lastLogin));
    }

    // ? Ensure the name is proper
    if(!newData.name
        || !isString(newData.name.first)
        || !isString(newData.name.last)
        || Object.keys(newData.name).length != 2) {
        throw new ValidationError('a valid name', JSON.stringify(newData.name));
    }

    // ? Ensure the elections is proper
    if(!newData.elections
        || !Array.isArray(newData.elections.eligible)
        || !Array.isArray(newData.elections.moderating)
        || Object.keys(newData.elections).length != 2
        // ? All the ids must be strings
        || Object.values(newData.elections).some(list => list.some(id => !isString(id)))) {
        throw new ValidationError('valid elections mappings', JSON.stringify(newData.elections));
    }

    // ? Ensure the email address is valid (regex)
    if(newData.email !== '' && !EmailValidator.validate(newData.email))
        throw new ValidationError('a valid email', newData.email);

    // ? Ensure emails remain unique
    if(newData.email !== '' && newData.email != oldData?.email && getData(`/email->id/${newData.email}`))
        throw new AlreadyExistsError(`email "${newData.email}"`);

    // ? Ensure the phone number is valid (length, numbers)
    if(newData.phone !== '' && (newData.phone.length != expectedPhoneNumberLength || !isNumber(newData.phone)))
        throw new ValidationError(`${expectedPhoneNumberLength} digit phone number (string)`, newData.phone);

    // ? Ensure address, city, and state are strings
    if(!isString(newData.address) || !isString(newData.city) || !isString(newData.state))
        throw new ValidationError(`any of the keys "address", "city", "state", or "zip" are invalid`);

    // ? Ensure the zip is valid (length, numbers)
    if(newData.zip !== '' && (newData.zip.length != expectedZipLength || !isNumber(newData.zip)))
        throw new ValidationError(`${expectedZipLength} digit zip code (string)`, newData.zip);

    // ? Ensure OTP is a string
    if(newData.otp !== '' && !isString(newData.otp))
        throw new ValidationError('otp', newData.otp);

    // ? Ensure OTPs remain unique
    if(newData.otp !== '' && newData.otp != oldData?.otp && getData(`/otp->id/${newData.otp}`))
        throw new ValidationError(`otp is invalid, generate another`);

    return { oldData: (oldData || {}) as Partial<User>, newData: newData };
};

/**
 * Creates a new valid login for a user. Returns the newly created user's id.
 *
 * TODO: Hashed password will be salted server-side with the username:
 * TODO: `hashedPassword = SHA256(username + password)`.
 */
export function createUser(username: string, password: string, type: UserType, data?: Record<string, unknown>) {
    const userId = getData(`/nextUserId`) as number;

    if(!userId)
        throw new AppError('failed to acquire next user id');

    const { newData } = sanitizeUserData({ data: { ...data, username, password, type }});

    putData(`/users/${userId}`, newData);
    putData(`/username->id/${username}`, userId);
    newData.email && putData(`/email->id/${newData.email}`, userId);
    newData.otp && putData(`/otp->id/${newData.otp}`, userId);
    putData(`/nextUserId`, userId + 1);

    return userId;
}

/**
 * 
 * @param {*} userId 
 */
export function getUserIdFromUsername(username: string) {
    const data = getData(`/username->id/${username}`) as number;

    if(!data)
        throw new NotFoundError();

    return data;
}

/**
 * 
 * @param {*} email 
 */
export function getUserIdFromEmail(email: string) {
    const data = getData(`/email->id/${email}`) as string;

    if(!data)
        throw new NotFoundError();

    return data;
}

/**
 * 
 * @param {*} email 
 */
export function getUserIdFromOTP(otp: string) {
    const data = getData(`/otp->id/${otp}`) as string;

    if(!data)
        throw new NotFoundError();

    return data;
}

/**
 * Deletes a user and corresponding index mappings from the database.
 *
 * ! Most deletes in the system are "soft deletes" where the `deleted` property
 * ! of a user object is set to `true`. This function, however, performs "hard
 * ! deletes". User data will be destroyed!
 */
export function deleteUser(userId: number) {
    const oldData = getData(`/users/${userId}`) as User;

    if(oldData) {
        delData(`/users/${userId}`);
        oldData.username && delData(`/username->id/${oldData.username}`);
        oldData.email && delData(`/email->id/${oldData.email}`);
        oldData.otp && delData(`/otp->id/${oldData.otp}`);
    }
}

/**
 * 
 * @param {*} userId
 */
export function doesUserIdExist(userId: number) {
    return !!getData(`/users/${userId}`);
}

/**
 * 
 * @param {*} username
 */
export function doesUsernameExist(username: string) {
    return !!getData(`/username->id/${username}`);
}

/**
 * 
 * @param {*} email
 */
export function doesEmailExist(email: string) {
    return !!getData(`/email->id/${email}`);
}

/**
 * 
 * @param {*} username 
 */
export function getUser(userId: number) {
    const { otp, ...data } = getData(`/users/${userId}`) as User || {};

    if(!data.username)
        throw new NotFoundError();

    const root = getData(`/rootUserId`) == userId;

    return {
        ...data,
        // ? Override any data with hardcoded values if user is root
        ...(root ? rootHardcodedData : {}),
        root,
        userId: userId,
        // ? Tell the client to go into debugging mode when we do
        debugging: getEnv().NODE_ENV != 'production'
    } as AugmentedUser;
}

/**
 * 
 * @param {*} username 
 */
export function getPublicUser(userId: number) {
    const data = getData(`/users/${userId}`) as User;
    const { username, type } = data || {};

    if(!data)
        throw new NotFoundError();

    return { userId, username, type };
}

/**
 * 
 * @param {*} username 
 */
export function getPublicUsers() {
    return Object.entries<User>(getData(`/users`) as Users || {}).map(([ userId, { username, type } ]) => ({
        userId,
        username,
        type
    }));
}

/**
 * 
 * @param {*} username 
 */
export function mergeUserData(userId: number, data: Record<string, unknown>) {
    const { oldData, newData } = sanitizeUserData({ userId, data });
    putData(`/users/${userId}`, newData);

    if(data?.username) {
        putData(`/username->id/${data.username}`, userId);
        oldData.username && delData(`/username->id/${oldData.username}`);
    }

    if(isString(data?.email)) {
        putData(`/email->id/${data.email}`, userId);
        oldData.email && delData(`/email->id/${oldData.email}`);
    }

    if(isString(data?.otp)) {
        data.otp && putData(`/otp->id/${data.otp}`, userId);
        oldData.otp && delData(`/otp->id/${oldData.otp}`);
    }
}

/**
 * Returns true if the username and (hashed) password are valid, false if not.
 *
 * ? Note: IDs are guaranteed to be above 0, so a -1 id (used below) will always
 * ? return null!
 */
export function areValidCredentials(username: string, password: string) {
    try {
        const data = getUser(getUserIdFromUsername(username) || -1);
        return !data.deleted && password == data.password;
    }

    catch(e) {
        return false;
    }
}

/**
 * @param {*} userId 
 */
export function generateOTPFor(userId: number) {
    const data = getData(`/users/${userId}`) as User;
    let otp = null;

    if(data && !data.deleted) {
        otp = genRndString({ length: otpStringLength, type: 'url-safe' });
        mergeUserData(userId, { otp });
    }

    if(!otp)
        throw new AppError('OTP generation failed');

    return otp;
}

/**
 * TODO: deletes OTP from index and from user account information
 * @param {*} userId 
 */
export function clearOTPFor(userId: number) {
    const data = getData(`/users/${userId}`);
    data && mergeUserData(userId, { otp: '' });
}
