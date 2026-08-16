import { beforeEach, describe, it } from 'node:test'
import supertest from 'supertest'

import config from '../../../config.mjs'
config.databasesPath = './test/data/databases'
config.usersJsonPath = './test/data/users/users.json'

import serverUtils from '../../../utils/serverUtils.mjs'
import userUtils from '../../../utils/userUtils.mjs'

const expressApplication = await serverUtils.createExpressApplication()

describe('GET /api/logout', () => {

    beforeEach(async () => {
        userUtils.deleteUser(userUtils.getUserForUsername('testusername'))
    })

    it('Es wird der HTTP Status Code 200 zurückgegeben.', async () => {
        // Erst mal Benutzer registrieren und anmelden
        await supertest(expressApplication).post('/api/register').send({ username: 'testusername', password: 'testpassword' }).expect(200)
        // Abmelden
        await supertest(expressApplication).get('/api/logout').expect(200)
    })

    it('Bei Erfolg wird das Sitzungs-Cookie entfernt.', async () => {
        // Erst mal Benutzer registrieren und anmelden
        const registerResponse = await supertest(expressApplication).post('/api/register').send({ username: 'testusername', password: 'testpassword' }).expect(200)
        // Abmelden muss Sitzungscookie leer machen und ablaufen lassen
        const response = await supertest(expressApplication).get('/api/logout')
            .expect(supertest.cookies.contain({ name: 'session', value: '', options: { expires: 'Thu, 01 Jan 1970 00:00:00 GMT' } }))
    })

})
