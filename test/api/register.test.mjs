import path from 'node:path'
import { rm } from 'node:fs/promises'
import crypto from 'node:crypto'
import { readFileSync } from 'node:fs'
import { beforeEach, describe, it } from 'node:test'
import * as assert from 'node:assert'
import supertest from 'supertest'
import ExpressApplication from '../../ExpressApplication.mjs'

describe('GET /api/register', () => {

    let expressApplication

    beforeEach(async () => {
        const dataPath = './test/data'
        await rm(path.resolve(dataPath), { recursive: true })
        expressApplication = new ExpressApplication(
            dataPath,
            './test/html', // htmlPath
            'test_secret', // tokenSecret
        )
    })

    it('Ohne Benutzername wird HTTP Status Code 400 zurückgegeben.', async () => {
        await supertest(expressApplication.app).post('/api/register').send({ password: 'testpassword' }).expect(400)
    })

    it('Ohne Passwort wird HTTP Status Code 400 zurückgegeben.', async () => {
        await supertest(expressApplication.app).post('/api/register').send({ username: 'testusername' }).expect(400)
    })

    it('Wenn bereits ein Benutzer mit dem gegebenen Benutzernamen existiert, wird HTTP Status Code 409 zurückgegeben.', async () => {
        // Benutzer anlegen, sollte funktionieren
        await supertest(expressApplication.app).post('/api/register').send({ username: 'testusername', password: 'testpassword' }).expect(200)
        // Nochmal probieren, sollte fehlschlagen
        await supertest(expressApplication.app).post('/api/register').send({ username: 'testusername', password: 'testpassword' }).expect(409)
    })

    it('Bei Erfolg wird der neue Benutzer in der Benutzerliste gespeichert.', async () => {
        await supertest(expressApplication.app).post('/api/register').send({ username: 'testusername', password: 'testpassword' })
        const benutzerliste = JSON.parse(readFileSync(path.resolve('./test/data/users/users.json')))
        const testbenutzer = benutzerliste.find(benutzer => benutzer.username === 'testusername')
        assert.ok(testbenutzer)
    })

    it('Bei Erfolg bekommt der Benutzer eine Id.', async () => {
        await supertest(expressApplication.app).post('/api/register').send({ username: 'testusername', password: 'testpassword' })
        const benutzerliste = JSON.parse(readFileSync(path.resolve('./test/data/users/users.json')))
        const testbenutzer = benutzerliste.find(benutzer => benutzer.username === 'testusername')
        assert.ok(testbenutzer.id)
    })

    it('Bei Erfolg wird das Passwort verschlüsselt gespeichert.', async () => {
        await supertest(expressApplication.app).post('/api/register').send({ username: 'testusername', password: 'testpassword' })
        const benutzerliste = JSON.parse(readFileSync(path.resolve('./test/data/users/users.json')))
        const testbenutzer = benutzerliste.find(benutzer => benutzer.username === 'testusername')
        assert.strictEqual(testbenutzer.password, crypto.createHash('sha256').update('testpassword').digest('hex'))
    })

    it('Bei Erfolg wird der HTTP Status Code 200 zurückgegeben.', async () => {
        await supertest(expressApplication.app).post('/api/register').send({ username: 'testusername', password: 'testpassword' }).expect(200)
    })

    it('Bei Erfolg wird ein JSON mit dem Benutzernamen und dessen Id zurückgegeben.', async () => {
        const response = await supertest(expressApplication.app).post('/api/register').send({ username: 'testusername', password: 'testpassword' })
        assert.strictEqual(response.body.username, 'testusername')
        assert.ok(response.body.id)
        const benutzerliste = JSON.parse(readFileSync(path.resolve('./test/data/users/users.json')))
        const testbenutzer = benutzerliste.find(benutzer => benutzer.username === 'testusername')
        assert.strictEqual(response.body.id, testbenutzer.id)
    })

    it('Bei Erfolg wird ein Sitzungs-Cookie erstellt.', async () => {
        await supertest(expressApplication.app).post('/api/register').send({ username: 'testusername', password: 'testpassword' })
            .expect(supertest.cookies.set({ name: 'session' }))
    })

})
