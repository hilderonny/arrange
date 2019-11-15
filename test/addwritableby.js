const assert = require('assert');
const test = require('./utils/test');

describe('API addwritableby', function() {

    beforeEach(async function() {
        await test.server.db('users').remove({}); // Clear all users before test
        const user1id = (await test.post('/api/arrange/register', { username: 'username1', password: 'password1' })).body._id; // Create test user
        await test.post('/api/arrange/register', { username: 'username2', password: 'password2' });
        await test.server.db('testaddwritableby').remove({});
        await test.server.db('testaddwritableby').insert({ key: 'testdata', _ownerid: user1id });
    });

    it('Responds with 401 when not logged in', async function() {
        const entityid = (await test.server.db('testaddwritableby').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const user2id = (await test.server.db('users').findOne({ username: 'username2' }, { projection: { '_id': 1 } }))._id.toString();
        const response = await test.post('/api/arrange/addwritableby/testaddwritableby/' + entityid, { userid: user2id });
        assert.strictEqual(response.status, 401);
    });

    it('Responds with 403 when trying to access users table', async function() {
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const user2id = (await test.server.db('users').findOne({ username: 'username2' }, { projection: { '_id': 1 } }))._id.toString();
        const response = await test.post('/api/arrange/addwritableby/users/' + user2id, { userid: user2id }, user1.token);
        assert.strictEqual(response.status, 403);
        assert.strictEqual(response.body.error, 'Access to users table forbidden');
    });

    it('Responds with 400 when object _id is invalid', async function() {
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const user2id = (await test.server.db('users').findOne({ username: 'username2' }, { projection: { '_id': 1 } }))._id.toString();
        const response = await test.post('/api/arrange/addwritableby/testaddwritableby/wrongformat', { userid: user2id }, user1.token);
        assert.strictEqual(response.status, 400);
        assert.strictEqual(response.body.error, 'Parameter id is no valid id');
    });

    it('Responds with 404 when there is no object with given _id', async function() {
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const user2id = (await test.server.db('users').findOne({ username: 'username2' }, { projection: { '_id': 1 } }))._id.toString();
        const response = await test.post('/api/arrange/addwritableby/testaddwritableby/123456789012345678901234', { userid: user2id }, user1.token);
        assert.strictEqual(response.status, 404);
        assert.strictEqual(response.body.error, 'Entity not found');
    });

    it('Responds with 400 when userid is missing', async function() {
        const entityid = (await test.server.db('testaddwritableby').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/arrange/addwritableby/testaddwritableby/' + entityid, { }, user1.token);
        assert.strictEqual(response.status, 400);
        assert.strictEqual(response.body.error, 'Target userid is missing');
    });

    it('Responds with 400 when userid is invalid', async function() {
        const entityid = (await test.server.db('testaddwritableby').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/arrange/addwritableby/testaddwritableby/' + entityid, { userid: 'wrongformat' }, user1.token);
        assert.strictEqual(response.status, 400);
        assert.strictEqual(response.body.error, 'userid is no valid id');
    });

    it('Responds with 404 when there is no user with given userid', async function() {
        const entityid = (await test.server.db('testaddwritableby').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/arrange/addwritableby/testaddwritableby/' + entityid, { userid: '123456789012345678901234' }, user1.token);
        assert.strictEqual(response.status, 404);
        assert.strictEqual(response.body.error, 'User not found');
    });

    it('Responds with 403 when calling user is not owner', async function() {
        const entityid = (await test.server.db('testaddwritableby').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const user2 = (await test.post('/api/arrange/login', { username: 'username2', password: 'password2' })).body;
        const response = await test.post('/api/arrange/addwritableby/testaddwritableby/' + entityid, { userid: user2._id.toString() }, user2.token);
        assert.strictEqual(response.status, 403);
        assert.strictEqual(response.body.error, 'Only the entity owner can do this');
    });

    it('Responds with 200 on success', async function() {
        const entityid = (await test.server.db('testaddwritableby').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const user2id = (await test.server.db('users').findOne({ username: 'username2' }, { projection: { '_id': 1 } }))._id.toString();
        const response = await test.post('/api/arrange/addwritableby/testaddwritableby/' + entityid, { userid: user2id }, user1.token);
        assert.strictEqual(response.status, 200);
    });

    it('Target user can write on success', async function() {
        const entityid = (await test.server.db('testaddwritableby').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const user2id = (await test.server.db('users').findOne({ username: 'username2' }, { projection: { '_id': 1 } }))._id.toString();
        await test.post('/api/arrange/addwritableby/testaddwritableby/' + entityid, { userid: user2id }, user1.token);
        const entity = await test.server.db('testaddwritableby').findOne(entityid);
        assert.ok(entity._writableby);
        assert.ok(entity._writableby.indexOf(user2id) >= 0);
    });

    it('When target user is already in writable, no double entry is made in array', async function() {
        const entityid = (await test.server.db('testaddwritableby').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const user2id = (await test.server.db('users').findOne({ username: 'username2' }, { projection: { '_id': 1 } }))._id.toString();
        await test.server.db('testaddwritableby').update(entityid, { $set: { _writableby: [ user2id ] } });
        await test.post('/api/arrange/addwritableby/testaddwritableby/' + entityid, { userid: user2id }, user1.token);
        const entity = await test.server.db('testaddwritableby').findOne(entityid);
        assert.ok(entity._writableby);
        assert.ok(entity._writableby.indexOf(user2id) >= 0);
        assert.strictEqual(entity._writableby.length, 1);
    });

});