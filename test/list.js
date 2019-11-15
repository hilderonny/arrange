const assert = require('assert');
const test = require('./utils/test');

describe('API list', function() {

    beforeEach(async function() {
        await test.server.db('users').remove({}); // Clear all users before test
        const user1id = (await test.post('/api/arrange/register', { username: 'username1', password: 'password1' })).body._id; // Create test user
        const user2id = (await test.post('/api/arrange/register', { username: 'username2', password: 'password2' })).body._id;
        await test.server.db('testlist').remove({});
        await test.server.db('testlist').insert({ attribute1: 'value11', attribute2: 'value2', _ownerid: user1id });
        await test.server.db('testlist').insert({ attribute1: 'value12', attribute2: 'value2', _ownerid: user1id });
        await test.server.db('testlist').insert({ attribute1: 'value13', attribute2: 'value2', _ownerid: user2id });
    });

    it('Responds with list containing only publicly readable entities when not logged in', async function() {
        const user2id = (await test.server.db('users').findOne({ username: 'username2' }, { projection: { '_id': 1 } }))._id.toString();
        const e1id = (await test.server.db('testlist').insert({ attribute1: 'pr1', attribute2: 'value2', _ownerid: user2id, _publiclyreadable: true }))._id.toString();
        const e2id = (await test.server.db('testlist').insert({ attribute1: 'pr2', attribute2: 'value2', _ownerid: user2id, _publiclyreadable: true }))._id.toString();
        const response = await test.post('/api/arrange/list/testlist', { result: { _id: true } });
        assert.strictEqual(response.status, 200);
        const list = response.body;
        assert.strictEqual(list.length, 2);
        assert.ok(list.find(function(element) { return element._id === e1id; }));
        assert.ok(list.find(function(element) { return element._id === e2id; }));
    });

    it('Responds with 403 when trying to access users table', async function() {
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        await test.server.db('users').update(user1._id.toString(), { $set : { _ownerid: user1._id.toString() }});
        const response = await test.post('/api/arrange/list/users', { result: { _id: true } }, user1.token);
        assert.strictEqual(response.status, 403);
        assert.strictEqual(response.body.error, 'Access to users table forbidden');
    });

    it('Responds only entities where the user has read access (owner, readableby, publiclyreadable)', async function() {
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const user2id = (await test.server.db('users').findOne({ username: 'username2' }, { projection: { '_id': 1 } }))._id.toString();
        const entity4id = (await test.server.db('testlist').insert({ attribute1: 'value14', attribute2: 'value2', _publiclyreadable: true, _ownerid: user2id }))._id.toString();
        const entity5id = (await test.server.db('testlist').insert({ attribute1: 'value15', attribute2: 'value2', _readableby: [ user1._id.toString()], _ownerid: user2id }))._id.toString();
        const response = await test.post('/api/arrange/list/testlist', { result: { _id: true } }, user1.token);
        assert.strictEqual(response.status, 200);
        const list = response.body;
        assert.strictEqual(list.length, 4);
        assert.ok(list.find(function(element) { return element._id === entity4id; }));
        assert.ok(list.find(function(element) { return element._id === entity5id; }));
    });

    it('Responds all entities when queryfilter is not given', async function() {
        const entity1id = (await test.server.db('testlist').findOne({ attribute1: 'value11' }, { projection: { '_id': 1 } }))._id.toString();
        const entity2id = (await test.server.db('testlist').findOne({ attribute1: 'value12' }, { projection: { '_id': 1 } }))._id.toString();
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/arrange/list/testlist', { result: { _id: true } }, user1.token);
        assert.strictEqual(response.status, 200);
        const list = response.body;
        assert.strictEqual(list.length, 2);
        assert.ok(list.find(function(element) { return element._id === entity1id; }));
        assert.ok(list.find(function(element) { return element._id === entity2id; }));
    });

    it('Responds all entities when queryfilter is an empty object', async function() {
        const entity1id = (await test.server.db('testlist').findOne({ attribute1: 'value11' }, { projection: { '_id': 1 } }))._id.toString();
        const entity2id = (await test.server.db('testlist').findOne({ attribute1: 'value12' }, { projection: { '_id': 1 } }))._id.toString();
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/arrange/list/testlist', { query: {}, result: { _id: true } }, user1.token);
        assert.strictEqual(response.status, 200);
        const list = response.body;
        assert.strictEqual(list.length, 2);
        assert.ok(list.find(function(element) { return element._id === entity1id; }));
        assert.ok(list.find(function(element) { return element._id === entity2id; }));
    });

    it('Responds only objects matching the given queryfilter', async function() {
        const entity1id = (await test.server.db('testlist').findOne({ attribute1: 'value11' }, { projection: { '_id': 1 } }))._id.toString();
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/arrange/list/testlist', { query: { attribute1: 'value11' }, result: { _id: true } }, user1.token);
        assert.strictEqual(response.status, 200);
        const list = response.body;
        assert.strictEqual(list.length, 1);
        assert.ok(list.find(function(element) { return element._id === entity1id; }));
    });

    it('Responds with 400 when the given queryfilter is invalid', async function() {
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/arrange/list/testlist', { query: { $schnulli: 'value11' }, result: { _id: true } }, user1.token);
        assert.strictEqual(response.status, 400);
        assert.strictEqual(response.body.error, 'Filter is invalid');
    });

    it('Responds with 400 when no object was sent in request', async function() {
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/arrange/list/testlist', undefined, user1.token);
        assert.strictEqual(response.status, 400);
        assert.strictEqual(response.body.error, 'No filters sent');
    });

    it('Responds with 400 when sent request object does neither contain query nor result filter', async function() {
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/arrange/list/testlist', { dings: 'da' }, user1.token);
        assert.strictEqual(response.status, 400);
        assert.strictEqual(response.body.error, 'No filters sent');
    });

    it('Responds all attributes when resultfilter is not given', async function() {
        const entity1id = (await test.server.db('testlist').findOne({ attribute1: 'value11' }, { projection: { '_id': 1 } }))._id.toString();
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/arrange/list/testlist', { query: { _id: entity1id } }, user1.token);
        assert.strictEqual(response.status, 200);
        const list = response.body;
        assert.strictEqual(list.length, 1);
        const keys = Object.keys(list[0]);
        assert.ok(keys.indexOf('_id') >= 0);
        assert.ok(keys.indexOf('attribute1') >= 0);
        assert.ok(keys.indexOf('attribute2') >= 0);
        assert.ok(keys.indexOf('_ownerid') >= 0);
    });

    it('Responds all attributes when resultfilter is an empty object', async function() {
        const entity1id = (await test.server.db('testlist').findOne({ attribute1: 'value11' }, { projection: { '_id': 1 } }))._id.toString();
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/arrange/list/testlist', { query: { _id: entity1id }, result: { } }, user1.token);
        assert.strictEqual(response.status, 200);
        const list = response.body;
        assert.strictEqual(list.length, 1);
        const keys = Object.keys(list[0]);
        assert.ok(keys.indexOf('_id') >= 0);
        assert.ok(keys.indexOf('attribute1') >= 0);
        assert.ok(keys.indexOf('attribute2') >= 0);
        assert.ok(keys.indexOf('_ownerid') >= 0);
    });

    it('Responds only attributes matching the given resultfilter', async function() {
        const entity1id = (await test.server.db('testlist').findOne({ attribute1: 'value11' }, { projection: { '_id': 1 } }))._id.toString();
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/arrange/list/testlist', { query: { _id: entity1id }, result: { attribute1: true } }, user1.token);
        assert.strictEqual(response.status, 200);
        const list = response.body;
        assert.strictEqual(list.length, 1);
        const keys = Object.keys(list[0]);
        assert.ok(keys.indexOf('_id') >= 0); // Id is returned in every case
        assert.ok(keys.indexOf('attribute1') >= 0);
        assert.ok(keys.indexOf('attribute2') < 0);
        assert.ok(keys.indexOf('_ownerid') < 0);
    });

    it('Responds with valid attributes only when the given resultfilter is invalid', async function() {
        const entity1id = (await test.server.db('testlist').findOne({ attribute1: 'value11' }, { projection: { '_id': 1 } }))._id.toString();
        const user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/arrange/list/testlist', { query: { _id: entity1id }, result: { attribute1: true, $schnulli: 'value11' } }, user1.token);
        assert.strictEqual(response.status, 200);
        const list = response.body;
        assert.strictEqual(list.length, 1);
        const keys = Object.keys(list[0]);
        assert.ok(keys.indexOf('_id') >= 0); // Id is returned in every case
        assert.ok(keys.indexOf('attribute1') >= 0);
        assert.ok(keys.indexOf('$schnulli') < 0);
    });

});