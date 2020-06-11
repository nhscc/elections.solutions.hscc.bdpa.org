import { JsonDB as DummyDB } from 'node-json-db';
import { Config as DummyDBConfig } from 'node-json-db/dist/lib/JsonDBConfig'
import tmpDir from 'temp-dir'
import del from 'del'
import cpFile from 'cp-file'
import loadJsonFile from 'load-json-file'

import * as backend from 'universe/backend'

const dbPath = `${tmpDir}/2019-dummy.db.json`;
const defaultDbPath = `${__dirname}/../../app.db.default.json`;

let db = null;
let defaultNextId = 0;

const getRawDB = () => loadJsonFile(dbPath);

beforeEach(async () => {
    await del(dbPath, { force: true });
    await cpFile(defaultDbPath, dbPath);
    backend.setDB(db = new DummyDB(new DummyDBConfig(dbPath, true, true)));
    defaultNextId = (await getRawDB()).nextUserId;
});

describe('createUser', () => {
    it('stores new credentials', async () => {
        backend.createUser('testuser', 't');
        expect((await getRawDB()).users[defaultNextId].password).toBe('t');
    });

    it('increments nextUserId counter', async () => {
        backend.createUser('testuser', 't');
        expect((await getRawDB()).nextUserId).toBe(defaultNextId + 1);
    });

    it("returns the new user's id", async () => {
        expect(backend.createUser('testuser', 't')).toBe(defaultNextId);
    });

    it('maps new username to new id', async () => {
        backend.createUser('testuser', 't');
        expect((await getRawDB())['username->id']['testuser']).toBe(defaultNextId);
    });

    it('maps new user to email if given', async () => {
        const newId = backend.createUser('testuser', 't', { email: 'test@email.com' });
        expect((await getRawDB())['email->id']['test@email.com']).toBe(newId);
    });

    it('maps new user to otp if given', async () => {
        const newId = backend.createUser('testuser', 't', { otp: 'test-otp' });
        expect((await getRawDB())['otp->id']['test-otp']).toBe(newId);
    });

    it('sets new user type to UserTypes.default when type is not specified', async () => {
        const newId = backend.createUser('testuser', 't');
        expect((await getRawDB()).users[newId].type).toBe(backend.UserTypes.default);
    });

    it('adds valid user properties to newly created user', async () => {
        const newId = backend.createUser('testuser', 'w', { type: backend.UserTypes.reporter, name: { first: 'tre', last: 'giles' }});

        expect((await getRawDB()).users[newId].name).toStrictEqual({ first: 'tre', last: 'giles' });
        expect((await getRawDB()).users[newId].type).toBe(backend.UserTypes.reporter);
    });

    it('throws on non-existent user property', async () => {
        expect(() => backend.createUser('testuser', 'w', { yes: 'no' })).toThrow();
    });

    it('does not allow violations of uniqueness invariants', async () => {
        const { username, email } = backend.getUserData(2);
        backend.createUser('testuser', 't', { otp: 'fake-otp' });

        expect(() => backend.createUser(username, 'p')).toThrow();
        expect(() => backend.createUser('testuser-two', 'p', { email })).toThrow();
        expect(() => backend.createUser('testuser-two', 'p', { email: 'not-taken@email.com' })).not.toThrow();
        expect(() => backend.createUser('testuser-three', 'p', { otp: 'fake-otp' })).toThrow();
        expect(() => backend.createUser('testuser-three', 'p', { otp: 'real-otp' })).not.toThrow();
    });

    it('does not allow username or password to be given as arguments twice', async () => {
        backend.createUser('testuser', 'p')
        expect(() => backend.createUser('testuser', 'p')).toThrow();
    });

    describe('throws on invalid user properties', () => {
        test('non-string username', () => expect(() => backend.createUser(false, 'w')).toThrow());
        test('too-short username', () => expect(() => backend.createUser('z'.repeat(backend.minUsernameLength - 1), 'w')).toThrow());
        test('too-long username', () => expect(() => backend.createUser('a'.repeat(backend.maxUsernameLength + 1), 'w')).toThrow());
        test('username with bad characters 1', () => expect(() => backend.createUser('!@#$', 'w')).toThrow());
        test('username with bad characters 2', () => expect(() => backend.createUser('bro111', 'w')).toThrow());
        test('non-unique username', () => expect(() => backend.createUser('user-root', 'w')).toThrow());
        test('non-string password', () => expect(() => backend.createUser('testuser', true)).toThrow());
        // TODO: ensure passwords are proper (i.e. expected ciphertext length)
        test('illegal type', () => expect(() => backend.createUser('testuser', 't', { type: 'bad' })).toThrow());
        test('(legal firstLogin)', () => expect(() => backend.createUser('testuser', 't', { firstLogin: false })).not.toThrow());
        test('illegal lastLogin object 1', () => expect(() => backend.createUser('testuser', 't', { lastLogin: null })).toThrow());
        test('illegal lastLogin object 2', () => expect(() => backend.createUser('testuser', 't', { lastLogin: { ip: '', time: null, cast: '' }})).toThrow());
        test('(legal lastLogin object 1)', () => expect(() => backend.createUser('testuser', 't', { lastLogin: {} })).not.toThrow());
        test('(legal lastLogin object 2)', () => expect(() => backend.createUser('testuser', 't', { lastLogin: { time: null }})).not.toThrow());
        test('(legal lastLogin object 3)', () => expect(() => backend.createUser('testuser', 't', { lastLogin: { time: 5 }})).not.toThrow());
        test('illegal name object 1', () => expect(() => backend.createUser('testuser', 't', { name: null })).toThrow());
        test('illegal name object 2', () => expect(() => backend.createUser('testuser', 't', { name: { first: '', last: '', cast: '' }})).toThrow());
        test('(legal name object 1)', () => expect(() => backend.createUser('testuser', 't', { name: {} })).not.toThrow());
        test('(legal name object 2)', () => expect(() => backend.createUser('testuser', 't', { name: { first: '' }})).not.toThrow());
        test('illegal elections object 1', () => expect(() => backend.createUser('testuser', 't', { elections: null })).toThrow());
        test('illegal elections object 2', () => expect(() => backend.createUser('testuser', 't', { elections: { moderating: [], fake: '' }})).toThrow());
        test('illegal elections object 3', () => expect(() => backend.createUser('testuser', 't', { elections: { moderating: '' }})).toThrow());
        test('illegal elections object 4', () => expect(() => backend.createUser('testuser', 't', { elections: { moderating: ['x'] }})).toThrow());
        test('(legal elections object 1)', () => expect(() => backend.createUser('testuser', 't', { elections: {} })).not.toThrow());
        test('(legal elections object 2)', () => expect(() => backend.createUser('testuser', 't', { elections: { eligible: [], moderating: [5] }})).not.toThrow());
        test('invalid email 1', () => expect(() => backend.createUser('testuser', 't', { email: false })).toThrow());
        test('invalid email 2', () => expect(() => backend.createUser('testuser', 't', { email: 'no@.' })).toThrow());
        test('invalid phone 1', () => expect(() => backend.createUser('testuser', 't', { phone: false })).toThrow());
        test('invalid phone 2', () => expect(() => backend.createUser('testuser', 't', { phone: 'a'.repeat(backend.expectedPhoneNumberLength) })).toThrow());
        test('invalid phone 3', () => expect(() => backend.createUser('testuser', 't', { phone: '123456789' })).toThrow());
        test('non-string address', () => expect(() => backend.createUser('testuser', 't', { address: null })).toThrow());
        test('non-string city', () => expect(() => backend.createUser('testuser', 't', { city: true })).toThrow());
        test('non-string state', () => expect(() => backend.createUser('testuser', 't', { state: 0 })).toThrow());
        test('non-number zip 1', () => expect(() => backend.createUser('testuser', 't', { zip: false })).toThrow());
        test('non-number zip 2', () => expect(() => backend.createUser('testuser', 't', { zip: 'a'.repeat(backend.expectedZipLength) })).toThrow());
        test('non-number zip 3', () => expect(() => backend.createUser('testuser', 't', { zip: '0' })).toThrow());
        test('non-string otp', () => expect(() => backend.createUser('testuser', 't', { otp: null })).toThrow());
    });
});

describe('getUserIdFromUsername', () => {
    it('gets user id if username exists', async () => {
        backend.createUser('testuser', 't');
        expect(backend.getUserIdFromUsername('testuser')).toBe(defaultNextId);
    });

    it('returns null if username does not exist', async () => {
        expect(backend.getUserIdFromUsername('testuser')).toBeNull();
    });
});

describe('getUserIdFromEmail', () => {
    it('gets user id if email exists', async () => {
        backend.createUser('testuser', 't', { email: 'test@test.test' });
        expect(backend.getUserIdFromEmail('test@test.test')).toBe(defaultNextId);
    });

    it('returns null if email does not exist', async () => {
        expect(backend.getUserIdFromEmail('test@test.test')).toBeNull();
    });
});

describe('getUserIdFromOTP', () => {
    it('gets user id if OTP exists', async () => {
        const newId = backend.createUser('testuser', 't', { otp: 'real-otp' });
        expect(backend.getUserIdFromOTP('real-otp')).toBe(newId);
    });

    it('returns null if OTP does not exist', async () => {
        expect(backend.getUserIdFromOTP('fake-otp')).toBeNull();
    });
});

describe('doesUserIdExist', () => {
    it('returns `true` when id exists', async () => {
        backend.createUser('testuser', 't');
        expect(backend.doesUserIdExist(defaultNextId)).toBe(true);
    });

    it('returns `false` when id does not exist', async () => {
        expect(backend.doesUserIdExist(defaultNextId)).toBe(false);
    });
});

describe('doesUsernameExist', () => {
    it('returns `true` when username exists', async () => {
        backend.createUser('testuser', 't');
        expect(backend.doesUsernameExist('testuser')).toBe(true);
    });

    it('returns `false` when username does not exist', async () => {
        expect(backend.doesUsernameExist('testuser')).toBe(false);
    });
});

describe('doesEmailExist', () => {
    it('returns `true` when email exists', async () => {
        backend.createUser('testuser', 't', { email: 'test@test.test' });
        expect(backend.doesEmailExist('test@test.test')).toBe(true);
    });

    it('returns `false` when email does not exist', async () => {
        expect(backend.doesEmailExist('test@test.test')).toBe(false);
    });
});

describe('deleteUser', () => {
    it('deletes (only) the specified id', () => {
        backend.createUser('testuser', 't');
        backend.createUser('testuser-two', 'u');
        backend.deleteUser(defaultNextId);

        expect(backend.doesUserIdExist(defaultNextId)).toBe(false);
        expect(backend.doesUserIdExist(defaultNextId + 1)).toBe(true);
    });

    it('deletes (only) the specified username->id index', () => {
        backend.createUser('testuser', 't');
        backend.createUser('testuser-two', 'u');
        backend.deleteUser(defaultNextId);

        expect(backend.doesUsernameExist('testuser')).toBe(false);
        expect(backend.doesUsernameExist('testuser-two')).toBe(true);
    });

    it('deletes (only) the specified email->id index', () => {
        backend.createUser('testuser', 't', { email: 'email1@email.email' });
        backend.createUser('testuser-two', 'u', { email: 'email2@email.email' });
        backend.deleteUser(defaultNextId);

        expect(backend.doesEmailExist('email1@email.email')).toBe(false);
        expect(backend.doesEmailExist('email2@email.email')).toBe(true);
    });

    it('deletes (only) the specified otp->id index', () => {
        backend.createUser('testuser', 't', { otp: 'test-otp' });
        const newId = backend.createUser('testuser-two', 'u', { otp: 'test-otp2' });
        backend.deleteUser(defaultNextId);

        expect(backend.getUserIdFromOTP('test-otp')).toBe(null);
        expect(backend.getUserIdFromOTP('test-otp2')).toBe(newId);
    });

    it('does not throw on non-existent credentials', () => {
        backend.deleteUser(-1);

        expect(backend.doesUserIdExist('testuser')).toBe(false);
    });
});

describe('getUserData', () => {
    it('debugging gets set properly', async () => {
        process.env.APP_ENV = 'development';
        expect(backend.getUserData(1).debugging).toBe(true);
        process.env.APP_ENV = 'production';
        expect(backend.getUserData(1).debugging).toBe(false);
    });

    it('returns id property in data object', async () => {
        const newId = backend.createUser('testuser', 't');
        const data = backend.getUserData(newId);

        expect(data.userId).toBe(newId);
    });

    it('returns `root: true` if user is root', async () => {
        const newId = backend.createUser('testuser', 't');
        const data = backend.getUserData(newId);
        const data2 = backend.getUserData(1);

        expect(data.root).toBe(false);
        expect(data2.root).toBe(true);
    });

    it('returns hardcoded values if user is root', async () => {
        const newId = backend.createUser('testuser', 't', { restricted: true, deleted: true });
        let data = backend.getUserData(newId);

        expect(data.root).toBe(false);
        expect(data.type).not.toBe(backend.UserTypes.administrator);

        db.push('/rootUserId', newId);
        data = backend.getUserData(newId);

        expect(data.root).toBe(true);
        expect(data.restricted).toBe(false);
        expect(data.deleted).toBe(false);
        expect(data.type).toBe(backend.UserTypes.administrator);
    });

    it('returns `{}` if userId does not exist', async () => {
        expect(backend.getUserData(-1)).toStrictEqual({});
    });

    it('never returns OTP', async () => {
        const newId = backend.createUser('testuser', 't', { otp: 'test-otp' });
        expect(backend.getUserData(newId).otp).toBeUndefined();
    });
});

describe('getUserPublicData', () => {
    it("returns only a safe subset of a user's data", async () => {
        const newId = backend.createUser('testuser', 't');
        const { userId, username, type, ...rest } = backend.getUserPublicData(newId);

        expect(userId).toBe(newId);
        expect(username).toBe('testuser');
        expect(type).toBe(backend.UserTypes.default);
        expect(rest).toStrictEqual({});
    });

    it('returns `{}` if userId does not exist', async () => {
        expect(backend.getUserPublicData(-1)).toStrictEqual({});
    });
});

describe('getUsersPublicData', () => {
    it('returns only a safe subset of user data', async () => {
        const newId = backend.createUser('testuser', 't');
        const data = backend.getUsersPublicData();
        expect(Object.values(data).every(item => Object.keys(item).length == 3)).toBe(true);
        expect(data[newId - 1].username).toBe('testuser');
    });

    it('returns all users', async () => {
        const newId = backend.createUser('testuser', 't');
        expect(Object.keys(backend.getUsersPublicData()).length).toBe(newId);
    });
});

describe('mergeUserData', () => {
    it("shallow merges the specified user's data", async () => {
        const newId = backend.createUser('testuser', 't', { name: { first: 'tre', last: 'giles' }});
        backend.mergeUserData(newId, { name: { last: 'dickens' }});
        backend.mergeUserData(newId, { restricted: true });
        const data = backend.getUserData(newId);

        expect(data.username).toEqual('testuser');
        expect(data.name).toStrictEqual({ first: 'tre', last: 'dickens' });
        expect(data.restricted).toBe(true);
    });

    it('adds new username->id index when username is updated from empty', async () => {
        const newId = backend.createUser('testuser', 't');
        backend.mergeUserData(newId, { username: 'testuser-two' });

        const data = backend.getUserData(newId);
        const foundId = backend.getUserIdFromUsername('testuser-two');

        expect(data.username).toBe('testuser-two');
        expect(foundId).toBe(newId);
    });

    it('adds new email->id index when email is updated from empty', async () => {
        const newId = backend.createUser('testuser', 't');
        backend.mergeUserData(newId, { email: 'shiny@new.email' });
        const foundId = backend.getUserIdFromEmail('shiny@new.email');

        expect(foundId).toBe(newId);
    });

    it('adds new otp->id index when otp is updated from empty', async () => {
        const newId = backend.createUser('testuser', 't');
        backend.mergeUserData(newId, { otp: 'shiny-new-otp' });
        const foundId = backend.getUserIdFromOTP('shiny-new-otp');

        expect(foundId).toBe(newId);
    });

    it('deletes outdated username->id index when username is updated', async () => {
        const newId = backend.createUser('testuser', 't');
        backend.mergeUserData(newId, { username: 'testuser-two' });
        expect(backend.getUserIdFromUsername('testuser')).toBeNull();
    });

    it('deletes outdated email->id index when email is updated', async () => {
        const newId = backend.createUser('testuser', 't', { email: 'stinky@old.email' });
        backend.mergeUserData(newId, { email: 'shiny@new.email' });
        expect(backend.getUserIdFromEmail('stinky@old.email')).toBeNull();
    });

    it('deletes outdated otp->id index when otp is updated', async () => {
        const newId = backend.createUser('testuser', 't', { otp: 'stinky-old-otp' });
        backend.mergeUserData(newId, { otp: 'shiny-new-otp' });
        expect(backend.getUserIdFromOTP('stinky-old-otp')).toBeNull();
    });

    it('throws when an invalid id is specified', async () => {
        const predb = await getRawDB();
        expect(() => backend.mergeUserData(-1, { bad: true })).toThrow();
        expect(await getRawDB()).toStrictEqual(predb);
    });

    it('does not throw and is noop on empty and null data', async () => {
        const predb = await getRawDB();
        expect(() => backend.mergeUserData(1, {})).not.toThrow();
        expect(() => backend.mergeUserData(1, null)).not.toThrow();
        expect(await getRawDB()).toStrictEqual(predb);
    });

    it('throws on non-existent user property', async () => {
        expect(() => backend.mergeUserData(1, { yes: 'no' })).toThrow();
    });

    it('does not allow violations of uniqueness invariants', async () => {
        const { username, email } = backend.getUserData(2);
        backend.createUser('testuser', 't', { otp: 'fake-otp' });

        expect(() => backend.mergeUserData(1, { username })).toThrow();
        expect(() => backend.mergeUserData(1, { email })).toThrow();
        expect(() => backend.mergeUserData(1, { email: 'not-taken@email.com' })).not.toThrow();
        expect(() => backend.mergeUserData(1, { otp: 'fake-otp' })).toThrow();
        expect(() => backend.mergeUserData(1, { otp: 'real-otp' })).not.toThrow();
    });

    describe('throws on invalid user properties', () => {
        test('non-string username', () => expect(() => backend.mergeUserData(1, { username: false })).toThrow());
        test('too-short username', () => expect(() => backend.mergeUserData(1, { username: 'z'.repeat(backend.minUsernameLength - 1) })).toThrow());
        test('too-long username', () => expect(() => backend.mergeUserData(1, { username: 'a'.repeat(backend.maxUsernameLength + 1) })).toThrow());
        test('username with bad characters 1', () => expect(() => backend.mergeUserData(1,  { username: '!@#$' })).toThrow());
        test('username with bad characters 2', () => expect(() => backend.mergeUserData(1,  { username: 'bro111' })).toThrow());
        test('non-unique username', () => expect(() => backend.mergeUserData(1, { username: 'user-admin' })).toThrow());
        test('(legal same username)', () => expect(() => backend.mergeUserData(1, { username: 'user-root' })).not.toThrow());
        test('non-string password', () => expect(() => backend.mergeUserData(1, { password: false })).toThrow());
        // TODO: ensure passwords are proper (i.e. expected ciphertext length)
        test('illegal type', () => expect(() => backend.mergeUserData(1, { type: 'bad' })).toThrow());
        test('illegal firstLogin', () => expect(() => backend.mergeUserData(1, { firstLogin: true })).toThrow());
        test('(legal firstLogin)', () => expect(() => backend.mergeUserData(1, { firstLogin: false })).not.toThrow());
        test('illegal lastLogin object 1', () => expect(() => backend.mergeUserData(1, { lastLogin: null })).toThrow());
        test('illegal lastLogin object 2', () => expect(() => backend.mergeUserData(1, { lastLogin: { ip: '', time: null, cast: '' }})).toThrow());
        test('(legal lastLogin object 1)', () => expect(() => backend.mergeUserData(1, { lastLogin: {} })).not.toThrow());
        test('(legal lastLogin object 2)', () => expect(() => backend.mergeUserData(1, { lastLogin: { time: null }})).not.toThrow());
        test('(legal lastLogin object 3)', () => expect(() => backend.mergeUserData(1, { lastLogin: { time: 5 }})).not.toThrow());
        test('illegal name object 1', () => expect(() => backend.mergeUserData(1, { name: null })).toThrow());
        test('illegal name object 2', () => expect(() => backend.mergeUserData(1, { name: { first: '', last: '', cast: '' }})).toThrow());
        test('(legal name object 1)', () => expect(() => backend.mergeUserData(1, { name: {} })).not.toThrow());
        test('(legal name object 2)', () => expect(() => backend.mergeUserData(1, { name: { first: '' }})).not.toThrow());
        test('illegal elections object 1', () => expect(() => backend.mergeUserData(1, { elections: null })).toThrow());
        test('illegal elections object 2', () => expect(() => backend.mergeUserData(1, { elections: { moderating: [], fake: '' }})).toThrow());
        test('illegal elections object 3', () => expect(() => backend.mergeUserData(1, { elections: { moderating: '' }})).toThrow());
        test('illegal elections object 4', () => expect(() => backend.mergeUserData(1, { elections: { moderating: ['x'] }})).toThrow());
        test('(legal elections object 1)', () => expect(() => backend.mergeUserData(1, { elections: {} })).not.toThrow());
        test('(legal elections object 2)', () => expect(() => backend.mergeUserData(1, { elections: { eligible: [], moderating: [5] }})).not.toThrow());
        test('invalid email 1', () => expect(() => backend.mergeUserData(1, { email: false })).toThrow());
        test('invalid email 2', () => expect(() => backend.mergeUserData(1, { email: 'no@.' })).toThrow());
        test('invalid phone 1', () => expect(() => backend.mergeUserData(1, { phone: false })).toThrow());
        test('invalid phone 2', () => expect(() => backend.mergeUserData(1, { phone: 'a'.repeat(backend.expectedPhoneNumberLength) })).toThrow());
        test('invalid phone 3', () => expect(() => backend.mergeUserData(1, { phone: '123456789' })).toThrow());
        test('non-string address', () => expect(() => backend.mergeUserData(1, { address: null })).toThrow());
        test('non-string city', () => expect(() => backend.mergeUserData(1, { city: true })).toThrow());
        test('non-string state', () => expect(() => backend.mergeUserData(1, { state: 0 })).toThrow());
        test('non-number zip 1', () => expect(() => backend.mergeUserData(1, { zip: false })).toThrow());
        test('non-number zip 2', () => expect(() => backend.mergeUserData(1, { zip: 'a'.repeat(backend.expectedZipLength) })).toThrow());
        test('non-number zip 3', () => expect(() => backend.mergeUserData(1, { zip: '0' })).toThrow());
        test('non-string otp', () => expect(() => backend.mergeUserData(1, { otp: {} })).toThrow());
    });
});

describe('areValidCredentials', () => {
    it('returns `true` when credentials are found', async () => {
        backend.createUser('testuser', 't');
        expect(backend.areValidCredentials('testuser', 't')).toBe(true);
    });

    it('returns `false` when credentials are not found', async () => {
        backend.createUser('testuser', 't');

        expect(backend.areValidCredentials('test', 't')).toBe(false);
        expect(backend.areValidCredentials('testuser', 'u')).toBe(false);
        expect(backend.areValidCredentials('testuser', '')).toBe(false);
        expect(backend.areValidCredentials('', '')).toBe(false);
        expect(backend.areValidCredentials('', 't')).toBe(false);
    });

    it('returns `false` when credentials are deleted', async () => {
        const newId = backend.createUser('testuser', 't');
        expect(backend.areValidCredentials('testuser', 't')).toBe(true);
        backend.mergeUserData(newId, { deleted: true });
        expect(backend.areValidCredentials('testuser', 't')).toBe(false);
    });
});

describe('generateOTPFor', () => {
    it('generates OTP, updates OTP property, adds otp->id mapping, and returns otp for given userId', async () => {
        const newId = backend.createUser('testuser', 't');
        const newOTP = backend.generateOTPFor(newId);

        expect((await getRawDB()).users[newId].otp).toBe(newOTP);
        expect(backend.getUserIdFromOTP(newOTP)).toBe(newId);
    });

    it('removes old OTP from index and user when generating new OTP', async () => {
        const newId = backend.createUser('testuser', 't', { otp: 'stinky-old-otp' });
        const newOTP = backend.generateOTPFor(newId);

        expect(backend.getUserIdFromOTP(newOTP)).toBe(newId);
        expect((await getRawDB()).users[newId].otp).toBe(newOTP);

        const newerOTP = backend.generateOTPFor(newId);

        expect(backend.getUserIdFromOTP(newOTP)).toBeNull();
        expect(backend.getUserIdFromOTP(newerOTP)).toBe(newId);
        expect((await getRawDB()).users[newId].otp).toBe(newerOTP);
    });

    it('returns `null` for invalid ids', async () => {
        expect(backend.generateOTPFor(-1)).toBeNull();
    });

    it('returns `null` when id points to deleted user', async () => {
        const newId = backend.createUser('testuser', 't');
        expect(backend.generateOTPFor(newId)).not.toBeNull();
        backend.mergeUserData(newId, { deleted: true });
        expect(backend.generateOTPFor(newId)).toBeNull();
    });
});

describe('clearOTPFor', () => {
    it('resets OTP property and clears otp->id mapping (only) for given userId', async () => {
        const newId = backend.createUser('testuser', 't');
        const newId2 = backend.createUser('testuser-two', 't');
        const newOTP = backend.generateOTPFor(newId);
        const newOTP2 = backend.generateOTPFor(newId2);

        backend.clearOTPFor(newId);

        expect(backend.getUserIdFromOTP(newOTP)).toBeNull();
        expect(backend.getUserIdFromOTP(newOTP2)).toBe(newId2);
        expect((await getRawDB()).users[newId].otp).toBe('');
        expect((await getRawDB()).users[newId2].otp).toBe(newOTP2);
    });

    it('does not throw on invalid ids', async () => {
        expect(() => backend.clearOTPFor(-1)).not.toThrow();
    });

    it('does not throw if otp already cleared', async () => {
        const newId = backend.createUser('testuser', 't', { otp: 'test-otp' });
        expect(() => backend.clearOTPFor(newId)).not.toThrow();
        expect(() => backend.clearOTPFor(newId)).not.toThrow();
    });

    it('does not throw on deleted user', async () => {
        const newId = backend.createUser('testuser', 't');
        expect(() => backend.clearOTPFor(newId)).not.toThrow();
        backend.mergeUserData(newId, { deleted: true });
        expect(() => backend.clearOTPFor(newId)).not.toThrow();
    });
});
