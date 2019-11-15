const assert = require('assert');
const test = require('./utils/test');

describe('Middleware canwrite', function() {

    before(function() {
        // Define API endpoint for testing
        test.server.app.post('/api/testcanwrite1/:tablename', test.server.canwrite.bind(test.server)('tablename'), function(request, response) {
            response.status(200).send();
        });
    });

    beforeEach(async function() {
        await test.server.db('users').remove({}); // Clear all users before test
        await test.post('/api/arrange/register', { username: 'username1', password: 'password1' });
        await test.post('/api/arrange/register', { username: 'username2', password: 'password2' });
        let user3id = (await test.post('/api/arrange/register', { username: 'username3', password: 'password3' })).body._id;
        // Prepare demo data
        await test.server.db('testcanwrite').remove({});
        await test.server.db('testcanwrite').insert({ key: 'testdata', _ownerid: user3id });
    });

    it('Responds with error 401 when user is not logged in', async function() {
        const response = await test.post('/api/testcanwrite1/testcanwrite', { _id: '123456789012345678901234' });
        assert.strictEqual(response.status, 401);
    });

    it('Responds with error 400 when given tablename parameter is not given', async function() {
        test.server.app.post('/api/testcanwrite2/:tablename', test.server.canwrite.bind(test.server)('invalidparametername'), function(request, response) {
            response.status(200).send();
        });
        let user = (await test.post('/api/arrange/login', { username: 'username3', password: 'password3' })).body;
        const response = await test.post('/api/testcanwrite2/testcanwrite', { key: 'newkey' }, user.token);
        assert.strictEqual(response.status, 400);
        assert.strictEqual(response.body.error, 'Parameter invalidparametername is not given');
    });

    it('Responds with error 400 when parameter _id is not valid', async function() {
        let user = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/testcanwrite1/testcanwrite', { _id: 'wrongformat', key: 'newkey' }, user.token);
        assert.strictEqual(response.status, 400);
        assert.strictEqual(response.body.error, '_id is no valid id');
    });

    it('Responds with error 404 when there is no entity with the given _id', async function() {
        let user = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/testcanwrite1/testcanwrite', { _id: '123456789012345678901234', key: 'newkey' }, user.token);
        assert.strictEqual(response.status, 404);
        assert.strictEqual(response.body.error, 'Entity not found');
    });

    it('Responds with error 403 when user cannot write to the entity', async function() {
        const user2id = (await test.server.db('users').findOne({ username: 'username2' }, { projection: { '_id': 1 } }))._id.toString();
        let user = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const entityid = (await test.server.db('testcanwrite').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const response1 = await test.post('/api/testcanwrite1/testcanwrite', { _id: entityid, key: 'newkey' }, user.token);
        assert.strictEqual(response1.status, 403);
        assert.strictEqual(response1.body.error, 'Writing not allowed');
        // Try again when the _writableby field exists
        await test.server.db('testcanwrite').update(entityid, { $set : { _writableby: [ user2id ] }});
        const response2 = await test.post('/api/testcanwrite1/testcanwrite', { _id: entityid, key: 'newkey' }, user.token);
        assert.strictEqual(response2.status, 403);
        assert.strictEqual(response2.body.error, 'Writing not allowed');
    });

    it('Proceeds when the user is owner', async function() {
        let user3 = (await test.post('/api/arrange/login', { username: 'username3', password: 'password3' })).body;
        const entityid = (await test.server.db('testcanwrite').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const response = await test.post('/api/testcanwrite1/testcanwrite', { _id: entityid, key: 'newkey' }, user3.token);
        assert.strictEqual(response.status, 200);
    });

    it('Proceeds when _id is not given in request body', async function() {
        let user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/testcanwrite1/testcanwrite', { key: 'newkey' }, user1.token);
        assert.strictEqual(response.status, 200);
    });

    it('Proceeds when the object is publicly writable', async function() {
        const entityid = (await test.server.db('testcanwrite').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        await test.server.db('testcanwrite').update(entityid, { $set : { _publiclywritable: true }});
        let user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.post('/api/testcanwrite1/testcanwrite', { _id: entityid, key: 'newkey' }, user1.token);
        assert.strictEqual(response.status, 200);
    });

    it('Proceeds when the user is in writable array', async function() {
        const entityid = (await test.server.db('testcanwrite').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        let user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        await test.server.db('testcanwrite').update(entityid, { $set : { _writableby: [ user1._id.toString() ] }});
        const response = await test.post('/api/testcanwrite1/testcanwrite', { _id: entityid, key: 'newkey' }, user1.token);
        assert.strictEqual(response.status, 200);
    });

});