const assert = require('assert');
const test = require('./utils/test');

describe('API delete', function() {

    beforeEach(async function() {
        await test.server.db('users').remove({}); // Clear all users before test
        const user1id = (await test.post('/api/arrange/register', { username: 'username1', password: 'password1' })).body._id; // Create test user
        await test.post('/api/arrange/register', { username: 'username2', password: 'password2' });
        await test.server.db('testdelete').remove({});
        await test.server.db('testdelete').insert({ key: 'testdata', attribute1: 'value1', _ownerid: user1id });
    });

    it('Responds with error 401 when not logged in', async function() {
        const entityid = (await test.server.db('testdelete').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const response = await test.del('/api/arrange/delete/testdelete/' + entityid);
        assert.strictEqual(response.status, 401);
    });

    it('Responds with error 400 when _id is not valid', async function() {
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.del('/api/arrange/delete/testdelete/wrongformat', user1.token);
        assert.strictEqual(response.status, 400);
        assert.strictEqual(response.body.error, 'Parameter id is no valid id');
    });

    it('Responds with 403 when trying to access users table', async function() {
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.del('/api/arrange/delete/users/' + user1._id, user1.token);
        assert.strictEqual(response.status, 403);
        assert.strictEqual(response.body.error, 'Access to users table forbidden');
    });

    it('Responds with 403 when user is not owner and not in _writableby and entity is not _publiclywritable', async function() {
        const entityid = (await test.server.db('testdelete').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const user2 = (await test.post('/api/arrange/login', { username: 'username2', password: 'password2' })).body;
        const response = await test.del('/api/arrange/delete/testdelete/' + entityid, user2.token);
        assert.strictEqual(response.status, 403);
        assert.strictEqual(response.body.error, 'Only the owner can delete the entity');
    });

    it('Responds with 403 when user is not owner but in _writableby', async function() {
        const entityid = (await test.server.db('testdelete').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const user2 = (await test.post('/api/arrange/login', { username: 'username2', password: 'password2' })).body;
        await test.server.db('testdelete').update(entityid, { $set : { _writableby: [ user2._id.toString() ] }});
        const response = await test.del('/api/arrange/delete/testdelete/' + entityid, user2.token);
        assert.strictEqual(response.status, 403);
        assert.strictEqual(response.body.error, 'Only the owner can delete the entity');
    });

    it('Responds with 403 when user is not owner but entity is _publiclywritable', async function() {
        const entityid = (await test.server.db('testdelete').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const user2 = (await test.post('/api/arrange/login', { username: 'username2', password: 'password2' })).body;
        await test.server.db('testdelete').update(entityid, { $set : { _publiclywritable: true }});
        const response = await test.del('/api/arrange/delete/testdelete/' + entityid, user2.token);
        assert.strictEqual(response.status, 403);
        assert.strictEqual(response.body.error, 'Only the owner can delete the entity');
    });

    it('Returns 404 when _id is set but there is no entity with this id in the target table', async function() {
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.del('/api/arrange/delete/testdelete/123456789012345678901234', user1.token);
        assert.strictEqual(response.status, 404);
        assert.strictEqual(response.body.error, 'Entity not found');
    });

    it('Returns 200 and deletes the entity on success', async function() {
        const entityid = (await test.server.db('testdelete').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.del('/api/arrange/delete/testdelete/' + entityid, user1.token);
        assert.strictEqual(response.status, 200);
        const entityAfterDelete = await test.server.db('testdelete').findOne(entityid, { projection: { '_id': 1 } });
        assert.ok(!entityAfterDelete);
    });

});