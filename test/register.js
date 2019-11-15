const assert = require('assert');
const bcryptjs = require('bcryptjs');
const test = require('./utils/test');

describe('API register', function() {

    beforeEach(async function() {
        await test.server.db('users').remove({}); // Clear all users before test
    });

    it('Responds with error 400 when no username and no password is given', async function() {
        const response = await test.post('/api/arrange/register');
        assert.strictEqual(response.status, 400);
    });

    it('Responds with error 400 when no username but a password is given', async function() {
        const response = await test.post('/api/arrange/register', { password: 'password1' });
        assert.strictEqual(response.status, 400);
    });

    it('Responds with error 400 when an username but no password is given', async function() {
        const response = await test.post('/api/arrange/register', { username: 'username1' });
        assert.strictEqual(response.status, 400);
    });

    it('Responds with error 400 when username is already taken', async function() {
        // Create user correctly
        const response1 = await test.post('/api/arrange/register', { username: 'username1', password: 'password1' });
        assert.strictEqual(response1.status, 200);
        // Try to create another one with the same username
        const response2 = await test.post('/api/arrange/register', { username: 'username1', password: 'password2' });
        assert.strictEqual(response2.status, 400);
    });

    it('Responds with status 200 when username contains \'', async function() {
        const username = 'username with \' in name';
        const response = await test.post('/api/arrange/register', { username: username, password: 'password1' });
        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.body.username, username);
    });

    it('Responds with status 200 when username contains "', async function() {
        const username = 'username with " in name';
        const response = await test.post('/api/arrange/register', { username: username, password: 'password1' });
        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.body.username, username);
    });

    it('Responds with status 200 when password contains \'', async function() {
        const password = 'password with \' in it';
        const response = await test.post('/api/arrange/register', { username: 'username1', password: password });
        assert.strictEqual(response.status, 200);
        const user = await test.server.db('users').findOne({ username: 'username1' }, { projection: { 'password': 1 } });
        assert.ok(bcryptjs.compareSync(password, user.password));
    });

    it('Responds with status 200 when password contains "', async function() {
        const password = 'password with " in it';
        const response = await test.post('/api/arrange/register', { username: 'username1', password: password });
        assert.strictEqual(response.status, 200);
        const user = await test.server.db('users').findOne({ username: 'username1' }, { projection: { 'password': 1 } });
        assert.ok(bcryptjs.compareSync(password, user.password));
    });

    it('Responds only with _id, username and token on success', async function() {
        const response = await test.post('/api/arrange/register', { username: 'username1', password: 'password1' });
        assert.strictEqual(response.status, 200);
        const user = response.body;
        assert.strictEqual(Object.keys(user).length, 3);
        assert.ok(user._id);
        assert.strictEqual(user.username, 'username1');
        assert.ok(user.token);
    });

    it('Responds with _id, username and token of new user when the user was logged in before', async function() {
        // First register a new user
        await test.post('/api/arrange/register', { username: 'username1', password: 'password1' });
        // Login with the new user
        const response1 = await test.post('/api/arrange/login', { username: 'username1', password: 'password1' });
        const user1 = response1.body;
        // Register another user
        const response2 = await test.post('/api/arrange/register', { username: 'username2', password: 'password2' });
        const user2 = response2.body;
        assert.notStrictEqual(user2._id, user1._id);
        assert.notStrictEqual(user2.username, user1.username);
        assert.notStrictEqual(user2.token, user1.token);
    });

});