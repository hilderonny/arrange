const assert = require('assert');
const test = require('./utils/test');

describe('Middleware canread', function() {

    before(function() {
        // Define API endpoint for testing
        test.server.app.get('/api/testcanread1/:tablename/:id', test.server.canread.bind(test.server)('tablename', 'id'), function(request, response) {
            response.status(200).send();
        });
    });

    beforeEach(async function() {
        await test.server.db('users').remove({}); // Clear all users before test
        await test.post('/api/arrange/register', { username: 'username1', password: 'password1' });
        await test.post('/api/arrange/register', { username: 'username2', password: 'password2' });
        let user3id = (await test.post('/api/arrange/register', { username: 'username3', password: 'password3' })).body._id;
        // Prepare demo data
        await test.server.db('testcanread').remove({});
        await test.server.db('testcanread').insert({ key: 'testdata', _ownerid: user3id });
    });

    it('Responds with error 401 when user is not logged in', async function() {
        const entityid = (await test.server.db('testcanread').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const response = await test.get('/api/testcanread1/testcanread/' + entityid);
        assert.strictEqual(response.status, 401);
    });

    it('Responds with error 400 when given tablename parameter is not given', async function() {
        test.server.app.get('/api/testcanread2/:tablename/:id', test.server.canread.bind(test.server)('invalidtableparametername', 'id'), function(request, response) {
            response.status(200).send();
        });
        const entityid = (await test.server.db('testcanread').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        let user = (await test.post('/api/arrange/login', { username: 'username3', password: 'password3' })).body;
        const response = await test.get('/api/testcanread2/testcanread/' + entityid, user.token);
        assert.strictEqual(response.status, 400);
        assert.strictEqual(response.body.error, 'Parameter invalidtableparametername is not given');
    });

    it('Responds with error 400 when given entity id parameter is not given', async function() {
        test.server.app.get('/api/testcanread3/:tablename/:id', test.server.canread.bind(test.server)('tablename', 'invalididparametername'), function(request, response) {
            response.status(200).send();
        });
        const entityid = (await test.server.db('testcanread').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        let user = (await test.post('/api/arrange/login', { username: 'username3', password: 'password3' })).body;
        const response = await test.get('/api/testcanread3/testcanread/' + entityid, user.token);
        assert.strictEqual(response.status, 400);
        assert.strictEqual(response.body.error, 'Parameter invalididparametername is not given');
    });

    it('Responds with error 400 when parameter _id is not valid', async function() {
        let user = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.get('/api/testcanread1/testcanread/wrongformat', user.token);
        assert.strictEqual(response.status, 400);
        assert.strictEqual(response.body.error, 'Parameter id is no valid id');
    });

    it('Responds with error 404 when there is no entity with the given _id', async function() {
        let user = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.get('/api/testcanread1/testcanread/123456789012345678901234', user.token);
        assert.strictEqual(response.status, 404);
        assert.strictEqual(response.body.error, 'Entity not found');
    });

    it('Responds with error 403 when user cannot read the entity', async function() {
        const user2id = (await test.server.db('users').findOne({ username: 'username2' }, { projection: { '_id': 1 } }))._id.toString();
        let user = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const entityid = (await test.server.db('testcanread').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const response1 = await test.get('/api/testcanread1/testcanread/' + entityid, user.token);
        assert.strictEqual(response1.status, 403);
        assert.strictEqual(response1.body.error, 'Reading not allowed');
        // Try again when the _readableby field exists
        await test.server.db('testcanread').update(entityid, { $set : { _readableby: [ user2id ] }});
        const response2 = await test.get('/api/testcanread1/testcanread/' + entityid, user.token);
        assert.strictEqual(response2.status, 403);
        assert.strictEqual(response2.body.error, 'Reading not allowed');
    });

    it('Proceeds when the user is owner', async function() {
        let user3 = (await test.post('/api/arrange/login', { username: 'username3', password: 'password3' })).body;
        const entityid = (await test.server.db('testcanread').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        const response = await test.get('/api/testcanread1/testcanread/' + entityid, user3.token);
        assert.strictEqual(response.status, 200);
    });

    it('Proceeds when the object is publicly readable', async function() {
        const entityid = (await test.server.db('testcanread').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        await test.server.db('testcanread').update(entityid, { $set : { _publiclyreadable: true }});
        let user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        const response = await test.get('/api/testcanread1/testcanread/' + entityid, user1.token);
        assert.strictEqual(response.status, 200);
    });

    it('Proceeds when the user is in readable array', async function() {
        const entityid = (await test.server.db('testcanread').findOne({ key: 'testdata' }, { projection: { '_id': 1 } }))._id.toString();
        let user1 = (await test.post('/api/arrange/login', { username: 'username1', password: 'password1' })).body;
        await test.server.db('testcanread').update(entityid, { $set : { _readableby: [ user1._id.toString() ] }});
        const response = await test.get('/api/testcanread1/testcanread/' + entityid, user1.token);
        assert.strictEqual(response.status, 200);
    });

});