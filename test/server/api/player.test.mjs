import path from 'node:path/posix'
import fs from 'node:fs'
import { beforeEach, describe, it } from 'node:test'
import supertest from 'supertest'
import assert from 'node:assert'

import config from '../../../config.mjs'
config.databasesPath = './test/data/databases'
config.filesPath = './test/data/files'
config.usersJsonPath = './test/data/users/users.json'

import serverUtils from '../../../utils/serverUtils.mjs'
import userUtils from '../../../utils/userUtils.mjs'

const expressApplication = await serverUtils.createExpressApplication()

describe('API /api/player', () => {

    let userId

    beforeEach(async () => {
        userUtils.deleteUser(userUtils.getUserForUsername('testusername'))
        fs.rmSync(path.resolve(config.filesPath), { recursive: true, force: true })
        // Benutzer anlegen
        const response = await supertest(expressApplication).post('/api/register').send({ username: 'testusername', password: 'testpassword' }).expect(200)
        userId = response.body.id
    })

    describe('GET /api/player/status/:userId', () => {

        it('Wenn es noch keinen Players-Datensatz für einen Benutzer gibt, wird einer mit 0 Coins und 0 EPs angelegt.', async () => {
            assert.ok(false) // TODO: Implementieren
        })

        it('Wenn es keinen Benutzer mit der angegebenen userId gibt, kommt 404 zurück.', async () => {
            assert.ok(false) // TODO: Implementieren
        })

        it('Rückgabe enthält Coins.', async () => {
            assert.ok(false) // TODO: Implementieren
        })

        it('Rückgabe enthält Experience.', async () => {
            assert.ok(false) // TODO: Implementieren
        })

        it('Rückgabe enthält Level.', async () => {
            assert.ok(false) // TODO: Implementieren
        })
    
    })

    describe('POST /api/player/addcoins/:userId/:coinsToAdd', () => {

        it('Wenn es keinen Benutzer mit der angegebenen userId gibt, kommt 404 zurück.', async () => {
            assert.ok(false) // TODO: Implementieren
        })

        it('Negative Zahlen werden ignoriert.', async () => {
            assert.ok(false) // TODO: Implementieren
        })

        it('Coins werden zu bestehenden hinzu addiert und Ergebnis wird zurück gegeben.', async () => {
            assert.ok(false) // TODO: Implementieren
        })
    
    })

    describe('POST /api/player/addexperience/:userId/:experienceToAdd', () => {

        it('Wenn es keinen Benutzer mit der angegebenen userId gibt, kommt 404 zurück.', async () => {
            assert.ok(false) // TODO: Implementieren
        })

        it('Negative Zahlen werden ignoriert.', async () => {
            assert.ok(false) // TODO: Implementieren
        })

        it('Experience werden zu bestehenden hinzu addiert und Ergebnis wird zurück gegeben.', async () => {
            assert.ok(false) // TODO: Implementieren
        })

        it('Rückgabe enthält Level.', async () => {
            assert.ok(false) // TODO: Implementieren
        })

        it('Rückgabe enthält LevelBefore.', async () => {
            assert.ok(false) // TODO: Implementieren
        })

        it('Bei Levelwechsel durch Erfahrungspunkte unterscheiden sich LevelBefore und Level', async () => {
            assert.ok(false) // TODO: Implementieren
        })
    
    })

    describe('POST /api/player/removecoins/:userId/:coinsToRemove', () => {

        it('Wenn es keinen Benutzer mit der angegebenen userId gibt, kommt 404 zurück.', async () => {
            assert.ok(false) // TODO: Implementieren
        })

        it('Negative Zahlen werden ignoriert.', async () => {
            assert.ok(false) // TODO: Implementieren
        })

        it('Coins werden von bestehenden abgezogen und Ergebnis wird zurück gegeben.', async () => {
            assert.ok(false) // TODO: Implementieren
        })

        it('Wenn mehr Coins abgezogen werden, als vorhanden sind, werden diese auf 0 gesetzt und 0 zurück gegeben.', async () => {
            assert.ok(false) // TODO: Implementieren
        })
    
    })

})
