import path from 'node:path'
import fs from 'fs'
import { readFileSync } from 'node:fs'
import { beforeEach, describe, it } from 'node:test'
import * as assert from 'node:assert'
import supertest from 'supertest'
import ExpressApplication from '../../ExpressApplication.mjs'

describe('GET /api/login', () => {

    let expressApplication

    beforeEach(async () => {
        const dataPath = './test/data'
        const fullPath = path.resolve(dataPath)
        if (fs.existsSync(fullPath)) {
            fs.rmSync(fullPath, { recursive: true })
        }
        expressApplication = new ExpressApplication(
            dataPath,
            './test/html', // htmlPath
            'test_secret', // tokenSecret
        )
    })

    it('Ohne Benutzername wird HTTP Status Code 400 zurückgegeben.', async () => {
        await supertest(expressApplication.app).post('/api/login').send({ password: 'testpassword' }).expect(400)
    })

    it('Ohne Passwort wird HTTP Status Code 400 zurückgegeben.', async () => {
        await supertest(expressApplication.app).post('/api/login').send({ username: 'testusername' }).expect(400)
    })

    it('Wenn kein Benutzer mit dem gegebenen Benutzernamen existiert, wird HTTP Status Code 401 zurückgegeben.', async () => {
        await supertest(expressApplication.app).post('/api/login').send({ username: 'testusername', password: 'testpassword' }).expect(401)
    })

    it('Wenn das Passwort falsch ist, wird HTTP Status Code 401 zurückgegeben.', async () => {
        // Benutzer anlegen, sollte funktionieren
        await supertest(expressApplication.app).post('/api/register').send({ username: 'testusername', password: 'testpassword' }).expect(200)
        // Falsches Passwort übermitteln
        await supertest(expressApplication.app).post('/api/login').send({ username: 'testusername', password: 'wrongpassword' }).expect(401)
    })

    it('Bei Erfolg wird der HTTP Status Code 200 zurückgegeben.', async () => {
        // Registrieren
        await supertest(expressApplication.app).post('/api/register').send({ username: 'testusername', password: 'testpassword' }).expect(200)
        // Abmelden
        await supertest(expressApplication.app).get('/api/logout').expect(200)
        // Anmelden
        await supertest(expressApplication.app).post('/api/login').send({ username: 'testusername', password: 'testpassword' }).expect(200)
    })

    it('Bei Erfolg wird ein JSON mit dem Benutzernamen und dessen Id zurückgegeben.', async () => {
        // Registrieren
        await supertest(expressApplication.app).post('/api/register').send({ username: 'testusername', password: 'testpassword' }).expect(200)
        // Abmelden
        await supertest(expressApplication.app).get('/api/logout').expect(200)
        // Anmelden
        const response = await supertest(expressApplication.app).post('/api/login').send({ username: 'testusername', password: 'testpassword' }).expect(200)
        assert.strictEqual(response.body.username, 'testusername')
        assert.ok(response.body.id)
        const benutzerliste = JSON.parse(readFileSync(path.resolve('./test/data/users/users.json')))
        const testbenutzer = benutzerliste.find(benutzer => benutzer.username === 'testusername')
        assert.strictEqual(response.body.id, testbenutzer.id)
    })

    it('Bei Erfolg wird ein Sitzungs-Cookie erstellt.', async () => {
        // Registrieren
        await supertest(expressApplication.app).post('/api/register').send({ username: 'testusername', password: 'testpassword' }).expect(200)
        // Abmelden
        await supertest(expressApplication.app).get('/api/logout').expect(200)
        // Anmelden
        await supertest(expressApplication.app).post('/api/login').send({ username: 'testusername', password: 'testpassword' })
            .expect(supertest.cookies.set({ name: 'session' }))
    })

})
