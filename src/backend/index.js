/* @flow */

import { JsonDB as DummyDB } from 'node-json-db';
import { Config as DummyDBConfig } from 'node-json-db/dist/lib/JsonDBConfig'
import EmailValidator from 'email-validator'
import isString from 'is-string'
import isNumber from 'is-number';
import deepMerge from 'deepmerge'
import deepFreeze from 'deep-freeze'
import genRndString from 'crypto-random-string'

let db = null;

export const minUsernameLength = 5;
export const maxUsernameLength = 20;
export const expectedPhoneNumberLength = 10;
export const expectedZipLength = 5;
export const otpStringLength = 30;

/**
 * 
 */
export const UserTypes = {
    default: '', // ? This is set later (below)
    administrator: 'administrator',
    moderator: 'moderator',
    voter: 'voter',
    reporter: 'reporter',
};

UserTypes.default = UserTypes.voter;

export const DefaultUserProperties = {
    username: '',
    password: '',
    type: UserTypes.default,
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
    type: UserTypes.administrator,
    restricted: false,
    deleted: false,
};

/**
 * Used to lazily create the database once on-demand instead of immediately when
 * the app runs. Not exported.
 */
const getDB = (): DummyDB => db || (db = new DummyDB(new DummyDBConfig(process.env.DUMMY_DB_PATH, true, true)));

/**
 * 
 * @param {*} path 
 */
const getData = path => {
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
const delData = path => {
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
const putData = (...args) => getDB().push(...args);

/**
 * Used for testing purposes. Sets the global db instance to something else.
 */
export function setDB(JSONDatabase: any) { db = JSONDatabase; }

/**
 * Creates a new valid login for a user. Returns the newly created user's id.
 *
 * TODO: Hashed password will be salted server-side with the username:
 * TODO: `hashedPassword = SHA256(username + password)`.
 */
export function createUser(username: string, password: string, data?: Object) {
    const userId = getData(`/nextUserId`);

    if(!userId)
        throw new Error('failed to acquire next user id');

    const { newData } = sanitizeUserData({ data: { username, password, ...data }});

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
    return getData(`/username->id/${username}`);
}

/**
 * 
 * @param {*} email 
 */
export function getUserIdFromEmail(email: string) {
    return getData(`/email->id/${email}`);
}

/**
 * 
 * @param {*} email 
 */
export function getUserIdFromOTP(otp: string) {
    return getData(`/otp->id/${otp}`);
}

/**
 * Deletes a user and corresponding index mappings from the database.
 *
 * ! Most deletes in the system are "soft deletes" where the `deleted` property
 * ! of a user object is set to `true`. This function, however, performs "hard
 * ! deletes". User data will be destroyed!
 */
export function deleteUser(userId: number) {
    const oldData = getData(`/users/${userId}`);

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
export function getUserData(userId: number) {
    const { otp, ...data } = getData(`/users/${userId}`) || {};

    if(!data.username)
        return deepFreeze({});

    const root = getData(`/rootUserId`) == userId;

    return deepFreeze({
        ...data,
        // ? Override any data with hardcoded values if user is root
        ...(root ? rootHardcodedData: {}),
        root,
        userId: userId,
        // ? Tell the client to go into debugging mode when we do
        debugging: process.env.APP_ENV != 'production'
    });
}

/**
 * 
 * @param {*} username 
 */
export function getUserPublicData(userId: number) {
    const data = getData(`/users/${userId}`);
    const { username, type } = data || {};

    return deepFreeze(!data ? {} : { userId, username, type });
}

/**
 * 
 * @param {*} username 
 */
export function getUsersPublicData() {
    return deepFreeze(Object.entries(getData(`/users`) || {}).map<Object>(([ userId, { username, type } ]: any) => ({
        userId,
        username,
        type
    })));
}

/**
 * 
 * @param {*} username 
 */
export function mergeUserData(userId: number, data: Object) {
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
 * This function is called whenever modifications are being made to user data.
 * This function ensures the database does not become corrupted.
 *
 * Returns a merged data object that might be pushed into the database or null
 */
const sanitizeUserData = ({ userId, data }: any) => {
    const hasUserId = userId !== undefined;
    const oldData: ?Object = hasUserId && getData(`/users/${userId}`);

    data = data || {};

    // ? userId is not falsey only when we're mutating, so the userId must exist
    if(hasUserId && !oldData)
        throw new Error(`user id "${userId}" does not exist`);

    // ? Protect data integrity: let's whitelist possible user data mutations
    if(!Object.keys(data).every(key => Object.keys(DefaultUserProperties).includes(key)))
        throw new Error('invalid object key(s) present in data');

    // ? We do this JSON stuff here to "deep clone" DefaultUserProperties
    // ? ensuring no references are shared between user objects (bad!)
    const defaultUserData = JSON.parse(JSON.stringify(DefaultUserProperties))

    // ! Note that, when merging one array with another, the new array will
    // ! OVERWRITE the old array, they will not be merged by design. Otherwise,
    // ! a deep merge occurs as expected.
    // See: https://www.npmjs.com/package/deepmerge#arraymerge-example-overwrite-target-array
    let newData = deepMerge.all([defaultUserData, (oldData || {}), (data || {})], { arrayMerge: (d, s) => s });

    // ? Ensure username is a string
    if(!isString(newData.username))
        throw new Error(`username "${newData.username}" is not a string`);

    // ? Ensure usernames are not less than minUsernameLength characters
    if(!(newData.username.length >= minUsernameLength))
        throw new Error(`username "${newData.username}" must be no shorter than ${minUsernameLength} characters`);

    // ? Ensure usernames are not more than maxUsernameLength characters
    if(!(newData.username.length <= maxUsernameLength))
        throw new Error(`username "${newData.username}" must be no longer than ${maxUsernameLength} characters`);

    // ? Ensure usernames are alphabetical plus dashes
    if(!(/^[a-zA-Z-]+$/).test(newData.username))
        throw new Error(`username "${newData.username}" contains invalid characters (allowed: a-z, A-Z, and -)`);

    // ? Ensure usernames remain unique
    if(newData.username != oldData?.username && getData(`/username->id/${newData.username}`))
        throw new Error(`username "${newData.username}" already exists`);

    // ? Ensure password is a string
    if(!isString(newData.password))
        throw new Error(`password "${newData.password}" is not a string`);

    // TODO: ensure passwords are proper (i.e. expected ciphertext length && password != username hashed (empty, salted))

    // ? Ensure the type is a value in our UserTypes enum
    if(!Object.values(UserTypes).includes(newData.type))
        throw new Error(`type "${newData.type}" is invalid`);

    // ? firstLogin cannot go from false to true
    else if(oldData?.firstLogin === false && newData.firstLogin)
        throw new Error('firstLogin cannot be set to `true`');

    // ? Ensure firstLogin, restricted, and deleted are booleans
    newData.firstLogin = !!newData.firstLogin;
    newData.restricted = !!newData.restricted;
    newData.deleted = !!newData.deleted;

    // ? Ensure lastLogin is proper
    if(!newData.lastLogin
        || !isString(newData.lastLogin.ip)
        || (newData.lastLogin.time !== null && !isNumber(newData.lastLogin.time))
        || Object.keys(newData.lastLogin).length != 2) {
        throw new Error(`lastLogin must be valid, saw \`${JSON.stringify(newData.lastLogin)}\` instead`);
    }

    // ? Ensure the name is proper
    if(!newData.name
        || !isString(newData.name.first)
        || !isString(newData.name.last)
        || Object.keys(newData.name).length != 2) {
        throw new Error(`name must be valid, saw \`${JSON.stringify(newData.name)}\` instead`);
    }

    // ? Ensure the elections is proper
    if(!newData.elections
        || !Array.isArray(newData.elections.eligible)
        || !Array.isArray(newData.elections.moderating)
        || Object.keys(newData.elections).length != 2
        // ? All the ids must be positive numbers
        || Object.values(newData.elections).some((list: any) => list.some(id => !(isNumber(id) && id > 0)))) {
        throw new Error(`elections must be valid (ids all positive integers), saw \`${JSON.stringify(newData.elections)}\` instead`);
    }

    // ? Ensure the email address is valid (regex)
    if(newData.email !== '' && !EmailValidator.validate(newData.email))
        throw new Error(`email "${newData.email}" is invalid`);

    // ? Ensure emails remain unique
    if(newData.email !== '' && newData.email != oldData?.email && getData(`/email->id/${newData.email}`))
        throw new Error(`email "${newData.email}" already exists`);

    // ? Ensure the phone number is valid (length, numbers)
    if(newData.phone !== '' && (newData.phone.length != expectedPhoneNumberLength || !isNumber(newData.phone)))
        throw new Error(`phone number "${newData.phone}" must be a ${expectedPhoneNumberLength} digit string`);

    // ? Ensure address, city, and state are strings
    if(!isString(newData.address) || !isString(newData.city) || !isString(newData.state))
        throw new Error(`any of the keys "address", "city", "state", or "zip" are invalid`);

    // ? Ensure the zip is valid (length, numbers)
    if(newData.zip !== '' && (newData.zip.length != expectedZipLength || !isNumber(newData.zip)))
        throw new Error(`zip number "${newData.zip}" must be a ${expectedZipLength} digit string`);

    // ? Ensure OTP is a string
    if(newData.otp !== '' && !isString(newData.otp))
        throw new Error(`otp "${newData.otp}" is not a string`);

    // ? Ensure OTPs remain unique
    if(newData.otp !== '' && newData.otp != oldData?.otp && getData(`/otp->id/${newData.otp}`))
        throw new Error(`otp is invalid, generate another`);

    return { oldData: deepFreeze(oldData || {}), newData: deepFreeze(newData) };
};

/**
 * Returns true if the username and (hashed) password are valid, false if not.
 *
 * ? Note: IDs are guaranteed to be above 0, so a -1 id (used below) will always
 * ? return null!
 */
export function areValidCredentials(username: string, password: string): boolean {
    const data = getUserData(getUserIdFromUsername(username) || -1);
    return !!data.userId && password == data.password && !data.deleted;
}

/**
 * TODO: returns OTP on success or null on failure
 * @param {*} userId 
 */
export function generateOTPFor(userId: number) {
    let otp = null;
    const data = getData(`/users/${userId}`);

    if(data && !data.deleted) {
        otp = genRndString({ length: otpStringLength, type: 'url-safe' });
        mergeUserData(userId, { otp });
    }

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
