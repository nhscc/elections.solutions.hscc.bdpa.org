/* eslint-disable @typescript-eslint/ban-ts-comment */
import { JsonDB as DummyDB } from 'node-json-db';
import { Config as DummyDBConfig } from 'node-json-db/dist/lib/JsonDBConfig'
import tmpDir from 'temp-dir'
import del from 'del'
import cpFile from 'cp-file'
import loadJsonFile from 'load-json-file'

import * as backend from 'universe/backend'

import type { Database } from 'types/global'

const dbPath = `${tmpDir}/2019-dummy.db.json`;
const defaultDbPath = `${__dirname}/../../app.db.default.json`;

let db = null;
let defaultNextId = 0;

const getRawDB = (): Promise<Database> => loadJsonFile(dbPath) || (() => { throw new Error('DB not found!') })();

beforeEach(async () => {
    await del(dbPath, { force: true });
    await cpFile(defaultDbPath, dbPath);
    backend.setDB(db = new DummyDB(new DummyDBConfig(dbPath, true, true)));
    defaultNextId = (await getRawDB()).nextUserId;
});

describe('createUser', () => {
    it('stores new credentials', async () => {
        backend.createUser('testuser', 't', 'voter');
        expect((await getRawDB())?.users[defaultNextId].password).toBe('t');
    });

    it('increments nextUserId counter', async () => {
        backend.createUser('testuser', 't', 'voter');
        expect((await getRawDB())?.nextUserId).toBe(defaultNextId + 1);
    });

    it("returns the new user's id", async () => {
        expect(backend.createUser('testuser', 't', 'voter')).toBe(defaultNextId);
    });

    it('maps new username to new id', async () => {
        backend.createUser('testuser', 't', 'voter');
        expect((await getRawDB())?.['username->id']['testuser']).toBe(defaultNextId);
    });

    it('maps new user to email if given', async () => {
        const newId = backend.createUser('testuser', 't', 'voter', { email: 'test@email.com' });
        expect((await getRawDB())?.['email->id']['test@email.com']).toBe(newId);
    });

    it('maps new user to otp if given', async () => {
        const newId = backend.createUser('testuser', 't', 'voter', { otp: 'test-otp' });
        expect((await getRawDB())?.['otp->id']['test-otp']).toBe(newId);
    });

    it('sets new user type to UserTypes.default when type is not specified', async () => {
        const newId = backend.createUser('testuser', 't', 'voter');
        expect((await getRawDB())?.users[newId].type).toBe('voter');
    });

    it('adds valid user properties to newly created user', async () => {
        const newId = backend.createUser('testuser', 'w', 'reporter', { name: { first: 'tre', last: 'giles' }});

        expect((await getRawDB())?.users[newId].name).toStrictEqual({ first: 'tre', last: 'giles' });
        expect((await getRawDB())?.users[newId].type).toBe('reporter');
    });

    it('throws on non-existent user property', async () => {
        // @ts-ignore
        expect(() => backend.createUser('testuser', 'w', 'voter', { yes: 'no' })).toThrow();
    });

    it('throws on duplicate username', async () => {
        backend.createUser('testuser', 'w', 'voter');
        expect(() => backend.createUser('testuser', 'w', 'voter')).toThrow();
    });

    it('throws on bad type', async () => {
        // @ts-ignore
        expect(() => backend.createUser('testuser', 'w', '')).toThrow();
        // @ts-ignore
        expect(() => backend.createUser('testuser', 'w', null)).toThrow();
        // @ts-ignore
        expect(() => backend.createUser('testuser', 'w', 50)).toThrow();
        // @ts-ignore
        expect(() => backend.createUser('testuser', 'w', 'bad')).toThrow();
    });

    it('does not allow violations of uniqueness invariants', async () => {
        const { username, email } = backend.getUser(2);
        backend.createUser('testuser', 't', 'voter', { otp: 'fake-otp' });

        expect(() => backend.createUser(username, 'p', 'voter')).toThrow();
        expect(() => backend.createUser('testuser-two', 'p', 'voter', { email })).toThrow();
        expect(() => backend.createUser('testuser-two', 'p', 'voter', { email: 'not-taken@email.com' })).not.toThrow();
        expect(() => backend.createUser('testuser-three', 'p', 'voter', { otp: 'fake-otp' })).toThrow();
        expect(() => backend.createUser('testuser-three', 'p', 'voter', { otp: 'real-otp' })).not.toThrow();
        expect(() => backend.createUser('testuser-four', 'p', 'voter', { email })).toThrow();
    });

    describe('throws on invalid user properties', () => {
        // @ts-ignore
        test('non-string username', () => expect(() => backend.createUser(false, 'w', 'voter')).toThrow());
        test('too-short username', () => expect(() => backend.createUser('z'.repeat(backend.minUsernameLength - 1), 'w', 'voter')).toThrow());
        test('too-long username', () => expect(() => backend.createUser('a'.repeat(backend.maxUsernameLength + 1), 'w', 'voter')).toThrow());
        test('username with bad characters 1', () => expect(() => backend.createUser('!@#$', 'w', 'voter')).toThrow());
        test('username with bad characters 2', () => expect(() => backend.createUser('bro111', 'w', 'voter')).toThrow());
        test('non-unique username', () => expect(() => backend.createUser('user-root', 'w', 'voter')).toThrow());
        // @ts-ignore
        test('non-string password', () => expect(() => backend.createUser('testuser', true, 'voter')).toThrow());
        // TODO: ensure passwords are proper (i.e. expected ciphertext length)
        // @ts-ignore
        test('illegal type', () => expect(() => backend.createUser('testuser', 't', 'bad')).toThrow());
        test('(legal firstLogin)', () => expect(() => backend.createUser('testuser', 't', 'voter', { firstLogin: false })).not.toThrow());
        // @ts-ignore
        test('illegal lastLogin object 1', () => expect(() => backend.createUser('testuser', 't', 'voter', { lastLogin: null })).toThrow());
        // @ts-ignore
        test('illegal lastLogin object 2', () => expect(() => backend.createUser('testuser', 't', 'voter', { lastLogin: { ip: '', time: null, cast: '' }})).toThrow());
        test('(legal lastLogin object 1)', () => expect(() => backend.createUser('testuser', 't', 'voter', { lastLogin: {} })).not.toThrow());
        test('(legal lastLogin object 2)', () => expect(() => backend.createUser('testuser', 't', 'voter', { lastLogin: { time: null }})).not.toThrow());
        test('(legal lastLogin object 3)', () => expect(() => backend.createUser('testuser', 't', 'voter', { lastLogin: { time: 5 }})).not.toThrow());
        // @ts-ignore
        test('illegal name object 1', () => expect(() => backend.createUser('testuser', 't', 'voter', { name: null })).toThrow());
        // @ts-ignore
        test('illegal name object 2', () => expect(() => backend.createUser('testuser', 't', 'voter', { name: { first: '', last: '', cast: '' }})).toThrow());
        test('(legal name object 1)', () => expect(() => backend.createUser('testuser', 't', 'voter', { name: {} })).not.toThrow());
        test('(legal name object 2)', () => expect(() => backend.createUser('testuser', 't', 'voter', { name: { first: '' }})).not.toThrow());
        // @ts-ignore
        test('illegal elections object 1', () => expect(() => backend.createUser('testuser', 't', 'voter', { elections: null })).toThrow());
        // @ts-ignore
        test('illegal elections object 2', () => expect(() => backend.createUser('testuser', 't', 'voter', { elections: { moderating: [], fake: '' }})).toThrow());
        // @ts-ignore
        test('illegal elections object 3', () => expect(() => backend.createUser('testuser', 't', 'voter', { elections: { moderating: '' }})).toThrow());
        // @ts-ignore
        test('illegal elections object 4', () => expect(() => backend.createUser('testuser', 't', 'voter', { elections: { moderating: [1234] }})).toThrow());
        // @ts-ignore
        test('(legal elections object 1)', () => expect(() => backend.createUser('testuser', 't', 'voter', { elections: {} })).not.toThrow());
        test('(legal elections object 2)', () => expect(() => backend.createUser('testuser', 't', 'voter', { elections: { eligible: [], moderating: ['5'] }})).not.toThrow());
        // @ts-ignore
        test('invalid email 1', () => expect(() => backend.createUser('testuser', 't', 'voter', { email: false })).toThrow());
        // @ts-ignore
        test('invalid email 2', () => expect(() => backend.createUser('testuser', 't', 'voter', { email: 'no@.' })).toThrow());
        // @ts-ignore
        test('invalid phone 1', () => expect(() => backend.createUser('testuser', 't', 'voter', { phone: false })).toThrow());
        // @ts-ignore
        test('invalid phone 2', () => expect(() => backend.createUser('testuser', 't', 'voter', { phone: 'a'.repeat(backend.expectedPhoneNumberLength) })).toThrow());
        // @ts-ignore
        test('invalid phone 3', () => expect(() => backend.createUser('testuser', 't', 'voter', { phone: '123456789' })).toThrow());
        // @ts-ignore
        test('non-string address', () => expect(() => backend.createUser('testuser', 't', 'voter', { address: null })).toThrow());
        // @ts-ignore
        test('non-string city', () => expect(() => backend.createUser('testuser', 't', 'voter', { city: true })).toThrow());
        // @ts-ignore
        test('non-string state', () => expect(() => backend.createUser('testuser', 't', 'voter', { state: 0 })).toThrow());
        // @ts-ignore
        test('non-number zip 1', () => expect(() => backend.createUser('testuser', 't', 'voter', { zip: false })).toThrow());
        // @ts-ignore
        test('non-number zip 2', () => expect(() => backend.createUser('testuser', 't', 'voter', { zip: 'a'.repeat(backend.expectedZipLength) })).toThrow());
        // @ts-ignore
        test('non-number zip 3', () => expect(() => backend.createUser('testuser', 't', 'voter', { zip: '0' })).toThrow());
        // @ts-ignore
        test('non-string otp', () => expect(() => backend.createUser('testuser', 't', 'voter', { otp: null })).toThrow());
    });
});

describe('getUserIdFromUsername', () => {
    it('gets user id if username exists', async () => {
        backend.createUser('testuser', 't', 'voter');
        expect(backend.getUserIdFromUsername('testuser')).toBe(defaultNextId);
    });

    it('throws if username does not exist', async () => {
        expect(() => backend.getUserIdFromUsername('testuser')).toThrow();
    });
});

describe('getUserIdFromEmail', () => {
    it('gets user id if email exists', async () => {
        backend.createUser('testuser', 't', 'voter', { email: 'test@test.test' });
        expect(backend.getUserIdFromEmail('test@test.test')).toBe(defaultNextId);
    });

    it('throws if email does not exist', async () => {
        expect(() => backend.getUserIdFromEmail('test@test.test')).toThrow();
    });
});

describe('getUserIdFromOTP', () => {
    it('gets user id if OTP exists', async () => {
        const newId = backend.createUser('testuser', 't', 'voter', { otp: 'real-otp' });
        expect(backend.getUserIdFromOTP('real-otp')).toBe(newId);
    });

    it('throws if OTP does not exist', async () => {
        expect(() => backend.getUserIdFromOTP('fake-otp')).toThrow();
    });
});

describe('doesUserIdExist', () => {
    it('returns `true` when id exists', async () => {
        backend.createUser('testuser', 't', 'voter');
        expect(backend.doesUserIdExist(defaultNextId)).toBe(true);
    });

    it('returns `false` when id does not exist', async () => {
        expect(backend.doesUserIdExist(defaultNextId)).toBe(false);
    });
});

describe('doesUsernameExist', () => {
    it('returns `true` when username exists', async () => {
        backend.createUser('testuser', 't', 'voter');
        expect(backend.doesUsernameExist('testuser')).toBe(true);
    });

    it('returns `false` when username does not exist', async () => {
        expect(backend.doesUsernameExist('testuser')).toBe(false);
    });
});

describe('doesEmailExist', () => {
    it('returns `true` when email exists', async () => {
        backend.createUser('testuser', 't', 'voter', { email: 'test@test.test' });
        expect(backend.doesEmailExist('test@test.test')).toBe(true);
    });

    it('returns `false` when email does not exist', async () => {
        expect(backend.doesEmailExist('test@test.test')).toBe(false);
    });
});

describe('deleteUser', () => {
    it('deletes (only) the specified id', () => {
        backend.createUser('testuser', 't', 'voter');
        backend.createUser('testuser-two', 'u', 'voter');
        backend.deleteUser(defaultNextId);

        expect(backend.doesUserIdExist(defaultNextId)).toBe(false);
        expect(backend.doesUserIdExist(defaultNextId + 1)).toBe(true);
    });

    it('deletes (only) the specified username->id index', () => {
        backend.createUser('testuser', 't', 'voter');
        backend.createUser('testuser-two', 'u', 'voter');
        backend.deleteUser(defaultNextId);

        expect(backend.doesUsernameExist('testuser')).toBe(false);
        expect(backend.doesUsernameExist('testuser-two')).toBe(true);
    });

    it('deletes (only) the specified email->id index', () => {
        backend.createUser('testuser', 't', 'voter', { email: 'email1@email.email' });
        backend.createUser('testuser-two', 'u', 'voter', { email: 'email2@email.email' });
        backend.deleteUser(defaultNextId);

        expect(backend.doesEmailExist('email1@email.email')).toBe(false);
        expect(backend.doesEmailExist('email2@email.email')).toBe(true);
    });

    it('deletes (only) the specified otp->id index', () => {
        backend.createUser('testuser', 't', 'voter', { otp: 'test-otp' });
        const newId = backend.createUser('testuser-two', 'u', 'voter', { otp: 'test-otp2' });
        backend.deleteUser(defaultNextId);

        expect(() => backend.getUserIdFromOTP('test-otp')).toThrow();
        expect(backend.getUserIdFromOTP('test-otp2')).toBe(newId);
    });

    it('does not throw on non-existent id', () => {
        expect(() => backend.deleteUser(-1)).not.toThrow();
    });
});

describe('getUserData', () => {
    it('debugging gets set properly', async () => {
        // @ts-ignore
        process.env.NODE_ENV = 'development';
        expect(backend.getUser(1).debugging).toBe(true);
        // @ts-ignore
        process.env.NODE_ENV = 'production';
        expect(backend.getUser(1).debugging).toBe(false);
    });

    it('returns id property in data object', async () => {
        const newId = backend.createUser('testuser', 't', 'voter');
        const data = backend.getUser(newId);

        expect(data.userId).toBe(newId);
    });

    it('returns `root: true` if user is root', async () => {
        const newId = backend.createUser('testuser', 't', 'voter');
        const data = backend.getUser(newId);
        const data2 = backend.getUser(1);

        expect(data.root).toBe(false);
        expect(data2.root).toBe(true);
    });

    it('returns hardcoded values if user is root', async () => {
        const newId = backend.createUser('testuser', 't', 'voter', { restricted: true, deleted: true });
        let data = backend.getUser(newId);

        expect(data.root).toBe(false);
        expect(data.type).not.toBe('administrator');

        db.push('/rootUserId', newId);
        data = backend.getUser(newId);

        expect(data.root).toBe(true);
        expect(data.restricted).toBe(false);
        expect(data.deleted).toBe(false);
        expect(data.type).toBe('administrator');
    });

    it('throws if userId does not exist', async () => {
        expect(() => backend.getUser(-1)).toThrow();
    });

    it('never returns OTP', async () => {
        const newId = backend.createUser('testuser', 't', 'voter', { otp: 'test-otp' });
        expect(backend.getUser(newId).otp).toBeUndefined();
    });
});

describe('getUserPublicData', () => {
    it("returns only a safe subset of a user's data", async () => {
        const newId = backend.createUser('testuser', 't', 'reporter');
        const { userId, username, type, ...rest } = backend.getPublicUser(newId);

        expect(userId).toBe(newId);
        expect(username).toBe('testuser');
        expect(type).toBe('reporter');
        expect(rest).toStrictEqual({});
    });

    it('throws if userId does not exist', async () => {
        expect(() => backend.getPublicUser(-1)).toThrow();
    });
});

describe('getUsersPublicData', () => {
    it('returns only a safe subset of user data', async () => {
        const newId = backend.createUser('testuser', 't', 'voter');
        const data = backend.getPublicUsers();
        expect(Object.values(data).every(item => Object.keys(item).length == 3)).toBe(true);
        expect(data[newId - 1].username).toBe('testuser');
    });

    it('returns all users', async () => {
        const newId = backend.createUser('testuser', 't', 'voter');
        expect(Object.keys(backend.getPublicUsers()).length).toBe(newId);
    });
});

describe('mergeUserData', () => {
    it("shallow merges the specified user's data", async () => {
        const newId = backend.createUser('testuser', 't', 'voter', { name: { first: 'tre', last: 'giles' }});
        backend.mergeUserData(newId, { name: { last: 'dickens' }});
        backend.mergeUserData(newId, { restricted: true });
        const data = backend.getUser(newId);

        expect(data.username).toEqual('testuser');
        expect(data.name).toStrictEqual({ first: 'tre', last: 'dickens' });
        expect(data.restricted).toBe(true);
    });

    it('adds new username->id index when username is updated from empty', async () => {
        const newId = backend.createUser('testuser', 't', 'voter');
        backend.mergeUserData(newId, { username: 'testuser-two' });

        const data = backend.getUser(newId);
        const foundId = backend.getUserIdFromUsername('testuser-two');

        expect(data.username).toBe('testuser-two');
        expect(foundId).toBe(newId);
    });

    it('adds new email->id index when email is updated from empty', async () => {
        const newId = backend.createUser('testuser', 't', 'voter');
        backend.mergeUserData(newId, { email: 'shiny@new.email' });
        const foundId = backend.getUserIdFromEmail('shiny@new.email');

        expect(foundId).toBe(newId);
    });

    it('adds new otp->id index when otp is updated from empty', async () => {
        const newId = backend.createUser('testuser', 't', 'voter');
        backend.mergeUserData(newId, { otp: 'shiny-new-otp' });
        const foundId = backend.getUserIdFromOTP('shiny-new-otp');

        expect(foundId).toBe(newId);
    });

    it('deletes outdated username->id index when username is updated', async () => {
        const newId = backend.createUser('testuser', 't', 'voter');
        backend.mergeUserData(newId, { username: 'testuser-two' });
        expect(() => backend.getUserIdFromUsername('testuser')).toThrow();
    });

    it('deletes outdated email->id index when email is updated', async () => {
        const newId = backend.createUser('testuser', 't', 'voter', { email: 'stinky@old.email' });
        backend.mergeUserData(newId, { email: 'shiny@new.email' });
        expect(() => backend.getUserIdFromEmail('stinky@old.email')).toThrow();
    });

    it('deletes outdated otp->id index when otp is updated', async () => {
        const newId = backend.createUser('testuser', 't', 'voter', { otp: 'stinky-old-otp' });
        backend.mergeUserData(newId, { otp: 'shiny-new-otp' });
        expect(() => backend.getUserIdFromOTP('stinky-old-otp')).toThrow();
    });

    it('throws when an invalid id is specified', async () => {
        const predb = await getRawDB();
        // @ts-ignore
        expect(() => backend.mergeUserData(-1, { bad: true })).toThrow();
        expect(await getRawDB())?.toStrictEqual(predb);
    });

    it('does not throw and is noop on empty and null data', async () => {
        const predb = await getRawDB();
        expect(() => backend.mergeUserData(1, {})).not.toThrow();
        // @ts-ignore
        expect(() => backend.mergeUserData(1, null)).not.toThrow();
        expect(await getRawDB())?.toStrictEqual(predb);
    });

    it('throws on non-existent user property', async () => {
        // @ts-ignore
        expect(() => backend.mergeUserData(1, { yes: 'no' })).toThrow();
    });

    it('does not allow violations of uniqueness invariants', async () => {
        const { username, email } = backend.getUser(2);
        backend.createUser('testuser', 't', 'voter', { otp: 'fake-otp' });

        expect(() => backend.mergeUserData(1, { username })).toThrow();
        expect(() => backend.mergeUserData(1, { email })).toThrow();
        expect(() => backend.mergeUserData(1, { email: 'not-taken@email.com' })).not.toThrow();
        expect(() => backend.mergeUserData(1, { otp: 'fake-otp' })).toThrow();
        expect(() => backend.mergeUserData(1, { otp: 'real-otp' })).not.toThrow();
    });

    describe('throws on invalid user properties', () => {
        // @ts-ignore
        test('non-string username', () => expect(() => backend.mergeUserData(1, { username: false })).toThrow());
        test('too-short username', () => expect(() => backend.mergeUserData(1, { username: 'z'.repeat(backend.minUsernameLength - 1) })).toThrow());
        test('too-long username', () => expect(() => backend.mergeUserData(1, { username: 'a'.repeat(backend.maxUsernameLength + 1) })).toThrow());
        test('username with bad characters 1', () => expect(() => backend.mergeUserData(1,  { username: '!@#$' })).toThrow());
        test('username with bad characters 2', () => expect(() => backend.mergeUserData(1,  { username: 'bro111' })).toThrow());
        test('non-unique username', () => expect(() => backend.mergeUserData(1, { username: 'user-admin' })).toThrow());
        test('(legal same username)', () => expect(() => backend.mergeUserData(1, { username: 'user-root' })).not.toThrow());
        // @ts-ignore
        test('non-string password', () => expect(() => backend.mergeUserData(1, { password: false })).toThrow());
        // TODO: ensure passwords are proper (i.e. expected ciphertext length)
        // @ts-ignore
        test('illegal type', () => expect(() => backend.mergeUserData(1, { type: 'bad' })).toThrow());
        test('illegal firstLogin', () => expect(() => backend.mergeUserData(1, { firstLogin: true })).toThrow());
        test('(legal firstLogin)', () => expect(() => backend.mergeUserData(1, { firstLogin: false })).not.toThrow());
        // @ts-ignore
        test('illegal lastLogin object 1', () => expect(() => backend.mergeUserData(1, { lastLogin: null })).toThrow());
        // @ts-ignore
        test('illegal lastLogin object 2', () => expect(() => backend.mergeUserData(1, { lastLogin: { ip: '', time: null, cast: '' }})).toThrow());
        test('(legal lastLogin object 1)', () => expect(() => backend.mergeUserData(1, { lastLogin: {} })).not.toThrow());
        test('(legal lastLogin object 2)', () => expect(() => backend.mergeUserData(1, { lastLogin: { time: null }})).not.toThrow());
        // @ts-ignore
        test('(legal lastLogin object 3)', () => expect(() => backend.mergeUserData(1, { lastLogin: { time: 5 }})).not.toThrow());
        // @ts-ignore
        test('illegal name object 1', () => expect(() => backend.mergeUserData(1, { name: null })).toThrow());
        // @ts-ignore
        test('illegal name object 2', () => expect(() => backend.mergeUserData(1, { name: { first: '', last: '', cast: '' }})).toThrow());
        test('(legal name object 1)', () => expect(() => backend.mergeUserData(1, { name: {} })).not.toThrow());
        test('(legal name object 2)', () => expect(() => backend.mergeUserData(1, { name: { first: '' }})).not.toThrow());
        // @ts-ignore
        test('illegal elections object 1', () => expect(() => backend.mergeUserData(1, { elections: null })).toThrow());
        // @ts-ignore
        test('illegal elections object 2', () => expect(() => backend.mergeUserData(1, { elections: { moderating: [], fake: '' }})).toThrow());
        // @ts-ignore
        test('illegal elections object 3', () => expect(() => backend.mergeUserData(1, { elections: { moderating: '' }})).toThrow());
        test('illegal elections object 4', () => expect(() => backend.mergeUserData(1, { elections: { moderating: ['x'] }})).not.toThrow());
        test('(legal elections object 1)', () => expect(() => backend.mergeUserData(1, { elections: {} })).not.toThrow());
        // @ts-ignore
        test('(legal elections object 2)', () => expect(() => backend.mergeUserData(1, { elections: { eligible: [], moderating: [5] }})).toThrow());
        // @ts-ignore
        test('invalid email 1', () => expect(() => backend.mergeUserData(1, { email: false })).toThrow());
        test('invalid email 2', () => expect(() => backend.mergeUserData(1, { email: 'no@.' })).toThrow());
        // @ts-ignore
        test('invalid phone 1', () => expect(() => backend.mergeUserData(1, { phone: false })).toThrow());
        test('invalid phone 2', () => expect(() => backend.mergeUserData(1, { phone: 'a'.repeat(backend.expectedPhoneNumberLength) })).toThrow());
        // @ts-ignore
        test('invalid phone 3', () => expect(() => backend.mergeUserData(1, { phone: '123456789' })).toThrow());
        // @ts-ignore
        test('non-string address', () => expect(() => backend.mergeUserData(1, { address: null })).toThrow());
        // @ts-ignore
        test('non-string city', () => expect(() => backend.mergeUserData(1, { city: true })).toThrow());
        // @ts-ignore
        test('non-string state', () => expect(() => backend.mergeUserData(1, { state: 0 })).toThrow());
        // @ts-ignore
        test('non-number zip 1', () => expect(() => backend.mergeUserData(1, { zip: false })).toThrow());
        test('non-number zip 2', () => expect(() => backend.mergeUserData(1, { zip: 'a'.repeat(backend.expectedZipLength) })).toThrow());
        test('non-number zip 3', () => expect(() => backend.mergeUserData(1, { zip: '0' })).toThrow());
        // @ts-ignore
        test('non-string otp', () => expect(() => backend.mergeUserData(1, { otp: {} })).toThrow());
    });
});

describe('areValidCredentials', () => {
    it('returns `true` when credentials are found', async () => {
        backend.createUser('testuser', 't', 'voter');
        expect(backend.areValidCredentials('testuser', 't')).toBe(true);
    });

    it('returns `false` when credentials are not found', async () => {
        backend.createUser('testuser', 't', 'voter');

        expect(backend.areValidCredentials('test', 't')).toBe(false);
        expect(backend.areValidCredentials('testuser', 'u')).toBe(false);
        expect(backend.areValidCredentials('testuser', '')).toBe(false);
        expect(backend.areValidCredentials('', '')).toBe(false);
        expect(backend.areValidCredentials('', 't')).toBe(false);
    });

    it('returns `false` when credentials are deleted', async () => {
        const newId = backend.createUser('testuser', 't', 'voter');
        expect(backend.areValidCredentials('testuser', 't')).toBe(true);
        backend.mergeUserData(newId, { deleted: true });
        expect(backend.areValidCredentials('testuser', 't')).toBe(false);
    });
});

describe('generateOTPFor', () => {
    it('generates OTP, updates OTP property, adds otp->id mapping, and returns otp for given userId', async () => {
        const newId = backend.createUser('testuser', 't', 'voter');
        const newOTP = backend.generateOTPFor(newId);

        expect((await getRawDB())?.users[newId].otp).toBe(newOTP);
        expect(backend.getUserIdFromOTP(newOTP)).toBe(newId);
    });

    it('removes old OTP from index and user when generating new OTP', async () => {
        const newId = backend.createUser('testuser', 't', 'voter', { otp: 'stinky-old-otp' });
        const newOTP = backend.generateOTPFor(newId);

        expect(backend.getUserIdFromOTP(newOTP)).toBe(newId);
        expect((await getRawDB())?.users[newId].otp).toBe(newOTP);

        const newerOTP = backend.generateOTPFor(newId);

        expect(() => backend.getUserIdFromOTP(newOTP)).toThrow();
        expect(backend.getUserIdFromOTP(newerOTP)).toBe(newId);
        expect((await getRawDB())?.users[newId].otp).toBe(newerOTP);
    });

    it('throws for invalid ids', async () => {
        expect(() => backend.generateOTPFor(-1)).toThrow();
    });

    it('throws when id points to deleted user', async () => {
        const newId = backend.createUser('testuser', 't', 'voter');
        expect(() => backend.generateOTPFor(newId)).not.toThrow();
        backend.mergeUserData(newId, { deleted: true });
        expect(() => backend.generateOTPFor(newId)).toThrow();
    });
});

describe('clearOTPFor', () => {
    it('resets OTP property and clears otp->id mapping (only) for given userId', async () => {
        const newId = backend.createUser('testuser', 't', 'voter');
        const newId2 = backend.createUser('testuser-two', 't', 'voter');
        const newOTP = backend.generateOTPFor(newId);
        const newOTP2 = backend.generateOTPFor(newId2);

        backend.clearOTPFor(newId);

        expect(() => backend.getUserIdFromOTP(newOTP)).toThrow();
        expect(backend.getUserIdFromOTP(newOTP2)).toBe(newId2);
        expect((await getRawDB())?.users[newId].otp).toBe('');
        expect((await getRawDB())?.users[newId2].otp).toBe(newOTP2);
    });

    it('does not throw on invalid ids', async () => {
        expect(() => backend.clearOTPFor(-1)).not.toThrow();
    });

    it('does not throw if otp already cleared', async () => {
        const newId = backend.createUser('testuser', 't', 'voter', { otp: 'test-otp' });
        expect(() => backend.clearOTPFor(newId)).not.toThrow();
        expect(() => backend.clearOTPFor(newId)).not.toThrow();
    });

    it('does not throw on deleted user', async () => {
        const newId = backend.createUser('testuser', 't', 'voter');
        expect(() => backend.clearOTPFor(newId)).not.toThrow();
        backend.mergeUserData(newId, { deleted: true });
        expect(() => backend.clearOTPFor(newId)).not.toThrow();
    });
});
