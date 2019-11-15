const assert = require('assert');
const test = require('./utils/test');

describe('API save', function() {

    beforeEach(async function() {
        await test.server.db('users').remove({}); // Clear all users before test
        const user1id = (await test.post('/api/arrange/register', { username: 'username1', password: 'password1' })).body._id; // Create test user
        await test.post('/api/arrange/register', { username: 'username2', password: 'password2' });
        await test.server.db('testsave').remove({});
        await test.server.db('testsave').insert({ key: 'testdata', attribute1: 'value1', _ownerid: user1id });
    });

    it('Responds with error 401 when not logged in', async function() {
        const response = await test.post('/api/arrange/save/testsave', { key: 'newkey' });
        assert.strictEqual(response.status, 401);
    });

    it('Responds with error 400 when _id is sent but not valid', async function() {
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/arrange/save/testsave', { _id: 'wrongformat', key: 'newkey' }, user1.token);
        assert.strictEqual(response.status, 400);
        assert.strictEqual(response.body.error, '_id is no valid id');
    });

    it('Responds with 403 when trying to access users table', async function() {
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/arrange/save/users', { key: 'newkey' }, user1.token);
        assert.strictEqual(response.status, 403);
        assert.strictEqual(response.body.error, 'Access to users table forbidden');
    });

    it('Responds with 403 when user is not owner and not in _writableby and entity is not _publiclywritable', async function() {
        const entityid = (await test.server.db('testsave').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const user2 = (await test.post('/api/arrange/login', { username: 'username2', password: 'password2' })).body;
        const response = await test.post('/api/arrange/save/testsave', { _id: entityid, key: 'newkey' }, user2.token);
        assert.strictEqual(response.status, 403);
        assert.strictEqual(response.body.error, 'Writing not allowed');
    });

    it('Does not overwrite underscore attributes when sent (_ownerid, _publiclyreadably, _publiclywritable, _readableby, _writableby)', async function() {
        const entityid = (await test.server.db('testsave').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/arrange/save/testsave', { _id: entityid, key: 'newkey', _ownerid: 'newownerid', _publiclyreadable: true, _publiclywritable: true, _writableby: [ user1._id ], _readableby: [ user1._id ] }, user1.token);
        assert.strictEqual(response.status, 200);
        const entity = await test.server.db('testsave').findOne(entityid);
        assert.strictEqual(entity.key, 'newkey');
        assert.notStrictEqual(entity._ownerid, 'newownerid');
        assert.notStrictEqual(entity._publiclyreadable, true);
        assert.notStrictEqual(entity._publiclywritable, true);
        assert.ok(!entity._readableby);
        assert.ok(!entity._writableby);
    });

    it('Creates an entity when no _id is given and assigns the logged in user as _owner', async function() {
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/arrange/save/testsave', { key: 'newkey' }, user1.token);
        assert.strictEqual(response.status, 200);
        const entityid = response.body._id;
        assert.ok(entityid);
        const entity = await test.server.db('testsave').findOne(entityid);
        assert.ok(entity);
        assert.strictEqual(entity.key, 'newkey');
        assert.strictEqual(entity._ownerid, user1._id);
    });

    it('Returns 404 when _id is set but there is no entity with this id in the target table', async function() {
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/arrange/save/testsave', { _id: '123456789012345678901234', key: 'newkey' }, user1.token);
        assert.strictEqual(response.status, 404);
        assert.strictEqual(response.body.error, 'Entity not found');
    });

    it('Overwrites only given attributes, others keep untouched', async function() {
        const entityid = (await test.server.db('testsave').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/arrange/save/testsave', { _id: entityid, key: 'newkey', attribute2: 'value2' }, user1.token);
        assert.strictEqual(response.status, 200);
        const entity = await test.server.db('testsave').findOne(entityid);
        assert.strictEqual(entity.key, 'newkey');
        assert.strictEqual(entity.attribute1, 'value1'); // Not overwritten
        assert.strictEqual(entity.attribute2, 'value2'); // Newly created
    });

    it('Returns 200 and the _id of the entity on creation success', async function() {
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/arrange/save/testsave', { key: 'newkey' }, user1.token);
        assert.strictEqual(response.status, 200);
        assert.strictEqual(Object.keys(response.body).length, 1);
        assert.ok(response.body._id);
    });

    it('Returns 200 and the _id of the entity on update success', async function() {
        const entityid = (await test.server.db('testsave').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/arrange/save/testsave', { _id: entityid, key: 'newkey' }, user1.token);
        assert.strictEqual(response.status, 200);
        assert.strictEqual(Object.keys(response.body).length, 1);
        assert.ok(response.body._id);
    });

    it('Returns 200 and the _id of the entity when the given object is empty', async function() {
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/arrange/save/testsave', { }, user1.token);
        assert.strictEqual(response.status, 200);
        assert.strictEqual(Object.keys(response.body).length, 1);
        assert.ok(response.body._id);
    });

    it('Returns 200 when the user is the owner', async function() {
        const user2 = (await test.post('/api/arrange/login', { username: 'username2', password: 'password2' })).body;
        const entityid = (await test.server.db('testsave').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        await test.server.db('testsave').update(entityid, { $set : { _ownerid: user2._id.toString() }});
        const response = await test.post('/api/arrange/save/testsave', { _id: entityid, key: 'newkey' }, user2.token);
        assert.strictEqual(response.status, 200);
    });

    it('Returns 200 when the object is publiclywritable', async function() {
        const user2 = (await test.post('/api/arrange/login', { username: 'username2', password: 'password2' })).body;
        const entityid = (await test.server.db('testsave').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        await test.server.db('testsave').update(entityid, { $set : { _publiclywritable: true }});
        const response = await test.post('/api/arrange/save/testsave', { _id: entityid, key: 'newkey' }, user2.token);
        assert.strictEqual(response.status, 200);
    });

    it('Returns 200 when the user is in writableby', async function() {
        const user2 = (await test.post('/api/arrange/login', { username: 'username2', password: 'password2' })).body;
        const entityid = (await test.server.db('testsave').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        await test.server.db('testsave').update(entityid, { $set : { _writableby: [ user2._id.toString() ] }});
        const response = await test.post('/api/arrange/save/testsave', { _id: entityid, key: 'newkey' }, user2.token);
        assert.strictEqual(response.status, 200);
    });

});