import { beforeEach, describe, it } from 'node:test'
import * as assert from 'node:assert'
import supertest from 'supertest'

import config from '../../../config.mjs'
config.usersJsonPath = './test/data/users/users.json'

import serverUtils from '../../../utils/serverUtils.mjs'
import userUtils from '../../../utils/userUtils.mjs'

const expressApplication = await serverUtils.createExpressApplication()

describe('GET /api/login', () => {

    beforeEach(async () => {
        userUtils.deleteUser(userUtils.getUserForUsername('testusername'))
    })

    it('Ohne Benutzername wird HTTP Status Code 400 zurückgegeben.', async () => {
        await supertest(expressApplication).post('/api/login').send({ password: 'testpassword' }).expect(400)
    })

    it('Ohne Passwort wird HTTP Status Code 400 zurückgegeben.', async () => {
        await supertest(expressApplication).post('/api/login').send({ username: 'testusername' }).expect(400)
    })

    it('Wenn kein Benutzer mit dem gegebenen Benutzernamen existiert, wird HTTP Status Code 401 zurückgegeben.', async () => {
        await supertest(expressApplication).post('/api/login').send({ username: 'testusername', password: 'testpassword' }).expect(401)
    })

    it('Wenn das Passwort falsch ist, wird HTTP Status Code 401 zurückgegeben.', async () => {
        // Benutzer anlegen, sollte funktionieren
        await supertest(expressApplication).post('/api/register').send({ username: 'testusername', password: 'testpassword' }).expect(200)
        // Falsches Passwort übermitteln
        await supertest(expressApplication).post('/api/login').send({ username: 'testusername', password: 'wrongpassword' }).expect(401)
    })

    it('Bei Erfolg wird der HTTP Status Code 200 zurückgegeben.', async () => {
        // Registrieren
        await supertest(expressApplication).post('/api/register').send({ username: 'testusername', password: 'testpassword' }).expect(200)
        // Abmelden
        await supertest(expressApplication).get('/api/logout').expect(200)
        // Anmelden
        await supertest(expressApplication).post('/api/login').send({ username: 'testusername', password: 'testpassword' }).expect(200)
    })

    it('Bei Erfolg wird ein JSON mit dem Benutzernamen und dessen Id zurückgegeben.', async () => {
        // Registrieren
        await supertest(expressApplication).post('/api/register').send({ username: 'testusername', password: 'testpassword' }).expect(200)
        // Abmelden
        await supertest(expressApplication).get('/api/logout').expect(200)
        // Anmelden
        const response = await supertest(expressApplication).post('/api/login').send({ username: 'testusername', password: 'testpassword' }).expect(200)
        assert.strictEqual(response.body.username, 'testusername')
        assert.ok(response.body.id)
        const testbenutzer = userUtils.getUserForUsername('testusername')
        assert.strictEqual(response.body.id, testbenutzer.id)
    })

    it('Bei Erfolg wird ein Sitzungs-Cookie erstellt.', async () => {
        // Registrieren
        await supertest(expressApplication).post('/api/register').send({ username: 'testusername', password: 'testpassword' }).expect(200)
        // Abmelden
        await supertest(expressApplication).get('/api/logout').expect(200)
        // Anmelden
        await supertest(expressApplication).post('/api/login').send({ username: 'testusername', password: 'testpassword' })
            .expect(supertest.cookies.set({ name: 'session' }))
    })

})
