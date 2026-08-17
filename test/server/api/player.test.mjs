import path from 'node:path/posix'
import fs from 'node:fs'
import { beforeEach, describe, it } from 'node:test'
import supertest from 'supertest'
import assert from 'node:assert'

import config from '../../../config.mjs'
config.databasesPath = './test/data/databases'
config.filesPath = './test/data/files'
config.usersJsonPath = './test/data/users/users.json'

import databaseUtils from '../../../utils/databaseUtils.mjs'
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

        it('Wenn es noch keinen Players-Datensatz für einen Benutzer gibt, wird einer mit 0 Coins und 0 EPs angelegt, der auf Level 1 ist.', async () => {
            // Benutzer anlegen
            userUtils.deleteUser(userUtils.getUserForUsername('userWithoutPlayer'))
            const registerResponse = await supertest(expressApplication).post('/api/register').send({ username: 'userWithoutPlayer', password: 'testpassword' }).expect(200)
            const userWithoutPlayerId = registerResponse.body.id
            // API abfragen
            const playerStatusResponse = await supertest(expressApplication).get(`/api/player/status/${userWithoutPlayerId}`).send().expect(200)
            // Rückgaben prüfen
            assert.strictEqual(playerStatusResponse.body.Coins, 0)
            assert.strictEqual(playerStatusResponse.body.Experience, 0)
            assert.strictEqual(playerStatusResponse.body.Level, 1)
            assert.strictEqual(playerStatusResponse.body.NextLevelExperience, 25)
        })

        it('Wenn es keinen Benutzer mit der angegebenen userId gibt, kommt 404 zurück.', async () => {
            // API abfragen
            await supertest(expressApplication).get(`/api/player/status/unknownUserId`).send().expect(404)
        })

        it('Rückgabe enthält Coins.', async () => {
            // Player anlegen
            const playerDatabase = await databaseUtils.loadDatabase('Player')
            playerDatabase.prepare(`INSERT INTO PlayerStatus (Id, UserId, Coins, Experience, Level) VALUES('${userId}', '${userId}', 987, 876, 123);`).run()
            // API abfragen
            const playerStatusResponse = await supertest(expressApplication).get(`/api/player/status/${userId}`).send().expect(200)
            // Rückgaben prüfen
            assert.strictEqual(playerStatusResponse.body.Coins, 987)
        })

        it('Rückgabe enthält Experience.', async () => {
            // Player anlegen
            const playerDatabase = await databaseUtils.loadDatabase('Player')
            playerDatabase.prepare(`INSERT INTO PlayerStatus (Id, UserId, Coins, Experience, Level) VALUES('${userId}', '${userId}', 987, 876, 123);`).run()
            // API abfragen
            const playerStatusResponse = await supertest(expressApplication).get(`/api/player/status/${userId}`).send().expect(200)
            // Rückgaben prüfen
            assert.strictEqual(playerStatusResponse.body.Experience, 876)
        })

        it('Rückgabe enthält Level.', async () => {
            // Player anlegen
            const playerDatabase = await databaseUtils.loadDatabase('Player')
            playerDatabase.prepare(`INSERT INTO PlayerStatus (Id, UserId, Coins, Experience, Level) VALUES('${userId}', '${userId}', 987, 876, 123);`).run()
            // API abfragen
            const playerStatusResponse = await supertest(expressApplication).get(`/api/player/status/${userId}`).send().expect(200)
            // Rückgaben prüfen
            assert.strictEqual(playerStatusResponse.body.Level, 123)
        })

        it('Rückgabe enthält NextLevelExperience.', async () => {
            // Player anlegen
            const playerDatabase = await databaseUtils.loadDatabase('Player')
            playerDatabase.prepare(`INSERT INTO PlayerStatus (Id, UserId, Coins, Experience, Level) VALUES('${userId}', '${userId}', 987, 876, 123);`).run()
            // API abfragen
            const playerStatusResponse = await supertest(expressApplication).get(`/api/player/status/${userId}`).send().expect(200)
            // Rückgaben prüfen
            assert.strictEqual(playerStatusResponse.body.NextLevelExperience, 123 * 25)
        })
    
    })

    describe('POST /api/player/addcoins/:userId/:coinsToAdd', () => {

        it('Wenn es keinen Benutzer mit der angegebenen userId gibt, kommt 404 zurück.', async () => {
            // API abfragen
            await supertest(expressApplication).post(`/api/player/addcoins/unknownUserId/123`).send().expect(404)
        })

        it('Negative Zahlen werden ignoriert.', async () => {
            // Player anlegen
            const playerDatabase = await databaseUtils.loadDatabase('Player')
            playerDatabase.prepare(`INSERT INTO PlayerStatus (Id, UserId, Coins, Experience, Level) VALUES('${userId}', '${userId}', 987, 876, 123);`).run()
            // API abfragen
            const addCoinsResponse = await supertest(expressApplication).post(`/api/player/addcoins/${userId}/-12`).send().expect(200)
            // Rückgaben prüfen
            assert.strictEqual(addCoinsResponse.body.Coins, 987)
        })

        it('Text als Coins wird ignoriert.', async () => {
            // Player anlegen
            const playerDatabase = await databaseUtils.loadDatabase('Player')
            playerDatabase.prepare(`INSERT INTO PlayerStatus (Id, UserId, Coins, Experience, Level) VALUES('${userId}', '${userId}', 987, 876, 123);`).run()
            // API abfragen
            const addCoinsResponse = await supertest(expressApplication).post(`/api/player/addcoins/${userId}/humbug`).send().expect(200)
            // Rückgaben prüfen
            assert.strictEqual(addCoinsResponse.body.Coins, 987)
        })

        it('Coins werden zu bestehenden hinzu addiert und Ergebnis wird zurück gegeben.', async () => {
            // Player anlegen
            const playerDatabase = await databaseUtils.loadDatabase('Player')
            playerDatabase.prepare(`INSERT INTO PlayerStatus (Id, UserId, Coins, Experience, Level) VALUES('${userId}', '${userId}', 987, 876, 123);`).run()
            // API abfragen
            const addCoinsResponse = await supertest(expressApplication).post(`/api/player/addcoins/${userId}/10`).send().expect(200)
            // Rückgaben prüfen
            assert.strictEqual(addCoinsResponse.body.Coins, 997)
            assert.strictEqual(addCoinsResponse.body.Experience, 876)
            assert.strictEqual(addCoinsResponse.body.Level, 123)
            assert.strictEqual(addCoinsResponse.body.NextLevelExperience, 3075)
        })
    
    })

    describe('POST /api/player/addexperience/:userId/:experienceToAdd', () => {

        it('Wenn es keinen Benutzer mit der angegebenen userId gibt, kommt 404 zurück.', async () => {
            // API abfragen
            await supertest(expressApplication).post(`/api/player/addexperience/unknownUserId/123`).send().expect(404)
        })

        it('Negative Zahlen werden ignoriert.', async () => {
            // Player anlegen
            const playerDatabase = await databaseUtils.loadDatabase('Player')
            playerDatabase.prepare(`INSERT INTO PlayerStatus (Id, UserId, Coins, Experience, Level) VALUES('${userId}', '${userId}', 987, 876, 123);`).run()
            // API abfragen
            const addExperienceResponse = await supertest(expressApplication).post(`/api/player/addexperience/${userId}/-12`).send().expect(200)
            // Rückgaben prüfen
            assert.strictEqual(addExperienceResponse.body.Experience, 876)
        })

        it('Text als Erfahrungspunkte wird ignoriert.', async () => {
            // Player anlegen
            const playerDatabase = await databaseUtils.loadDatabase('Player')
            playerDatabase.prepare(`INSERT INTO PlayerStatus (Id, UserId, Coins, Experience, Level) VALUES('${userId}', '${userId}', 987, 876, 123);`).run()
            // API abfragen
            const addExperienceResponse = await supertest(expressApplication).post(`/api/player/addexperience/${userId}/humbug`).send().expect(200)
            // Rückgaben prüfen
            assert.strictEqual(addExperienceResponse.body.Experience, 876)
        })

        it('Experience werden zu bestehenden hinzu addiert und Ergebnis wird zurück gegeben.', async () => {
            // Player anlegen
            const playerDatabase = await databaseUtils.loadDatabase('Player')
            playerDatabase.prepare(`INSERT INTO PlayerStatus (Id, UserId, Coins, Experience, Level) VALUES('${userId}', '${userId}', 987, 876, 123);`).run()
            // API abfragen
            const addExperienceResponse = await supertest(expressApplication).post(`/api/player/addexperience/${userId}/10`).send().expect(200)
            // Rückgaben prüfen
            assert.strictEqual(addExperienceResponse.body.Coins, 987)
            assert.strictEqual(addExperienceResponse.body.Experience, 886)
            assert.strictEqual(addExperienceResponse.body.Level, 123)
            assert.strictEqual(addExperienceResponse.body.LevelBefore, 123)
            assert.strictEqual(addExperienceResponse.body.NextLevelExperience, 3075)
        })

        it('Bei Levelwechsel durch Erfahrungspunkte unterscheiden sich LevelBefore und Level.', async () => {
            // Player anlegen
            const playerDatabase = await databaseUtils.loadDatabase('Player')
            playerDatabase.prepare(`INSERT INTO PlayerStatus (Id, UserId, Coins, Experience, Level) VALUES('${userId}', '${userId}', 987, 876, 122);`).run()
            // API abfragen
            const addExperienceResponse = await supertest(expressApplication).post(`/api/player/addexperience/${userId}/3000`).send().expect(200)
            // Rückgaben prüfen
            assert.strictEqual(addExperienceResponse.body.Coins, 987)
            assert.strictEqual(addExperienceResponse.body.Level, 123)
            assert.strictEqual(addExperienceResponse.body.LevelBefore, 122)
            assert.strictEqual(addExperienceResponse.body.NextLevelExperience, 3075)
        })

        it('Bei Levelwechsel werden die Erfahrungspunkte basierend auf dem neuen Level als Differenz berechnet.', async () => {
            // Player anlegen
            const playerDatabase = await databaseUtils.loadDatabase('Player')
            playerDatabase.prepare(`INSERT INTO PlayerStatus (Id, UserId, Coins, Experience, Level) VALUES('${userId}', '${userId}', 987, 876, 122);`).run()
            // API abfragen
            const addExperienceResponse = await supertest(expressApplication).post(`/api/player/addexperience/${userId}/3000`).send().expect(200)
            // Rückgaben prüfen
            assert.strictEqual(addExperienceResponse.body.Experience, 826)
            assert.strictEqual(addExperienceResponse.body.Level, 123)
            assert.strictEqual(addExperienceResponse.body.LevelBefore, 122)
            assert.strictEqual(addExperienceResponse.body.NextLevelExperience, 3075)
        })

        it('Großen Mengen an Erfahrungspunkten bringen Aufstiege über mehrere Level.', async () => {
            // Player anlegen
            const playerDatabase = await databaseUtils.loadDatabase('Player')
            playerDatabase.prepare(`INSERT INTO PlayerStatus (Id, UserId, Coins, Experience, Level) VALUES('${userId}', '${userId}', 987, 10, 5);`).run()
            // API abfragen
            const addExperienceResponse = await supertest(expressApplication).post(`/api/player/addexperience/${userId}/1000`).send().expect(200)
            // Rückgaben prüfen
            assert.strictEqual(addExperienceResponse.body.Experience, 135)
            assert.strictEqual(addExperienceResponse.body.Level, 10)
            assert.strictEqual(addExperienceResponse.body.LevelBefore, 5)
            assert.strictEqual(addExperienceResponse.body.NextLevelExperience, 250)
        })
    
    })

    describe('POST /api/player/removecoins/:userId/:coinsToRemove', () => {

        it('Wenn es keinen Benutzer mit der angegebenen userId gibt, kommt 404 zurück.', async () => {
            // API abfragen
            await supertest(expressApplication).post(`/api/player/removecoins/unknownUserId/123`).send().expect(404)
        })

        it('Negative Zahlen werden ignoriert.', async () => {
            // Player anlegen
            const playerDatabase = await databaseUtils.loadDatabase('Player')
            playerDatabase.prepare(`INSERT INTO PlayerStatus (Id, UserId, Coins, Experience, Level) VALUES('${userId}', '${userId}', 987, 876, 123);`).run()
            // API abfragen
            const addCoinsResponse = await supertest(expressApplication).post(`/api/player/removecoins/${userId}/-12`).send().expect(200)
            // Rückgaben prüfen
            assert.strictEqual(addCoinsResponse.body.Coins, 987)
        })

        it('Text als Coins wird ignoriert.', async () => {
            // Player anlegen
            const playerDatabase = await databaseUtils.loadDatabase('Player')
            playerDatabase.prepare(`INSERT INTO PlayerStatus (Id, UserId, Coins, Experience, Level) VALUES('${userId}', '${userId}', 987, 876, 123);`).run()
            // API abfragen
            const addCoinsResponse = await supertest(expressApplication).post(`/api/player/removecoins/${userId}/humbug`).send().expect(200)
            // Rückgaben prüfen
            assert.strictEqual(addCoinsResponse.body.Coins, 987)
        })

        it('Coins werden von bestehenden abgezogen und Ergebnis wird zurück gegeben.', async () => {
            // Player anlegen
            const playerDatabase = await databaseUtils.loadDatabase('Player')
            playerDatabase.prepare(`INSERT INTO PlayerStatus (Id, UserId, Coins, Experience, Level) VALUES('${userId}', '${userId}', 987, 876, 123);`).run()
            // API abfragen
            const addCoinsResponse = await supertest(expressApplication).post(`/api/player/removecoins/${userId}/10`).send().expect(200)
            // Rückgaben prüfen
            assert.strictEqual(addCoinsResponse.body.Coins, 977)
            assert.strictEqual(addCoinsResponse.body.Experience, 876)
            assert.strictEqual(addCoinsResponse.body.Level, 123)
            assert.strictEqual(addCoinsResponse.body.NextLevelExperience, 3075)
        })

        it('Wenn mehr Coins abgezogen werden, als vorhanden sind, werden diese auf 0 gesetzt und 0 zurück gegeben.', async () => {
            // Player anlegen
            const playerDatabase = await databaseUtils.loadDatabase('Player')
            playerDatabase.prepare(`INSERT INTO PlayerStatus (Id, UserId, Coins, Experience, Level) VALUES('${userId}', '${userId}', 987, 876, 123);`).run()
            // API abfragen
            const addCoinsResponse = await supertest(expressApplication).post(`/api/player/removecoins/${userId}/1000`).send().expect(200)
            // Rückgaben prüfen
            assert.strictEqual(addCoinsResponse.body.Coins, 0)
            assert.strictEqual(addCoinsResponse.body.Experience, 876)
            assert.strictEqual(addCoinsResponse.body.Level, 123)
            assert.strictEqual(addCoinsResponse.body.NextLevelExperience, 3075)
        })
    
    })

})
