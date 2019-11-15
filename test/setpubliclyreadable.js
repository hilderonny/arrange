const assert = require('assert');
const test = require('./utils/test');

describe('API setpubliclyreadable', function() {

    beforeEach(async function() {
        await test.server.db('users').remove({}); // Clear all users before test
        const user1id = (await test.post('/api/arrange/register', { username: 'username1', password: 'password1' })).body._id; // Create test user
        await test.post('/api/arrange/register', { username: 'username2', password: 'password2' });
        await test.server.db('testsetpubliclyreadable').remove({});
        await test.server.db('testsetpubliclyreadable').insert({ key: 'testdata', _ownerid: user1id });
    });

    it('Responds with 401 when not logged in', async function() {
        const entityid = (await test.server.db('testsetpubliclyreadable').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const response = await test.post('/api/arrange/setpubliclyreadable/testsetpubliclyreadable/' + entityid + '/true', { });
        assert.strictEqual(response.status, 401);
    });

    it('Responds with 403 when trying to access users table', async function() {
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const user2id = (await test.server.db('users').findOne({ username: 'username2' }, { projection: { '_id': 1 } }))._id.toString();
        const response = await test.post('/api/arrange/setpubliclyreadable/users/' + user2id + '/true', { }, user1.token);
        assert.strictEqual(response.status, 403);
        assert.strictEqual(response.body.error, 'Access to users table forbidden');
    });

    it('Responds with 400 when object _id is invalid', async function() {
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const user2id = (await test.server.db('users').findOne({ username: 'username2' }, { projection: { '_id': 1 } }))._id.toString();
        const response = await test.post('/api/arrange/setpubliclyreadable/testsetpubliclyreadable/wrongformat/true', { }, user1.token);
        assert.strictEqual(response.status, 400);
        assert.strictEqual(response.body.error, 'Parameter id is no valid id');
    });

    it('Responds with 404 when there is no object with given _id', async function() {
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/arrange/setpubliclyreadable/testsetpubliclyreadable/123456789012345678901234/true', { }, user1.token);
        assert.strictEqual(response.status, 404);
        assert.strictEqual(response.body.error, 'Entity not found');
    });

    it('Responds with 400 when value parameter is not "true" or "false"', async function() {
        const entityid = (await test.server.db('testsetpubliclyreadable').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/arrange/setpubliclyreadable/testsetpubliclyreadable/' + entityid + '/invalidvalue', { }, user1.token);
        assert.strictEqual(response.status, 400);
        assert.strictEqual(response.body.error, 'Invalid value');
    });

    it('Responds with 403 when calling user is not owner', async function() {
        const entityid = (await test.server.db('testsetpubliclyreadable').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const user2 = (await test.post('/api/arrange/login', { username: 'username2', password: 'password2' })).body;
        const response = await test.post('/api/arrange/setpubliclyreadable/testsetpubliclyreadable/' + entityid + '/true', { }, user2.token);
        assert.strictEqual(response.status, 403);
        assert.strictEqual(response.body.error, 'Only the entity owner can do this');
    });

    it('Responds with 200 on success', async function() {
        const entityid = (await test.server.db('testsetpubliclyreadable').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/arrange/setpubliclyreadable/testsetpubliclyreadable/' + entityid + '/true', { }, user1.token);
        assert.strictEqual(response.status, 200);
    });

    it('All users can read when set to true', async function() {
        const entityid = (await test.server.db('testsetpubliclyreadable').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        await test.post('/api/arrange/setpubliclyreadable/testsetpubliclyreadable/' + entityid + '/true', { }, user1.token);
        const entity = await test.server.db('testsetpubliclyreadable').findOne(entityid);
        assert.strictEqual(entity._publiclyreadable, true);
    });

    it('Only specific users can read when set to false', async function() {
        const entityid = (await test.server.db('testsetpubliclyreadable').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        await test.post('/api/arrange/setpubliclyreadable/testsetpubliclyreadable/' + entityid + '/false', { }, user1.token);
        const entity = await test.server.db('testsetpubliclyreadable').findOne(entityid);
        assert.strictEqual(entity._publiclyreadable, false);
    });

    it('When already set to true, setting to true again has no effect', async function() {
        const entityid = (await test.server.db('testsetpubliclyreadable').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        await test.server.db('testsetpubliclyreadable').update(entityid, { $set: { _publiclyreadable: true } });
        const response = await test.post('/api/arrange/setpubliclyreadable/testsetpubliclyreadable/' + entityid + '/true', { }, user1.token);
        assert.strictEqual(response.status, 200);
        const entity = await test.server.db('testsetpubliclyreadable').findOne(entityid);
        assert.strictEqual(entity._publiclyreadable, true);
    });

    it('When already set to false, setting to false again has no effect', async function() {
        const entityid = (await test.server.db('testsetpubliclyreadable').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        await test.server.db('testsetpubliclyreadable').update(entityid, { $set: { _publiclyreadable: false } });
        const response = await test.post('/api/arrange/setpubliclyreadable/testsetpubliclyreadable/' + entityid + '/false', { }, user1.token);
        assert.strictEqual(response.status, 200);
        const entity = await test.server.db('testsetpubliclyreadable').findOne(entityid);
        assert.strictEqual(entity._publiclyreadable, false);
    });

});