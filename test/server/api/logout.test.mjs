import path from 'node:path'
import fs from 'fs'
import { beforeEach, describe, it } from 'node:test'
import supertest from 'supertest'
import ExpressApplication from '../../../ExpressApplication.mjs'

describe('GET /api/logout', () => {

    let expressApplication

    beforeEach(async () => {
        const dataPath = './test/data'
        const fullPath = path.resolve(dataPath)
        if (fs.existsSync(fullPath)) {
            fs.rmSync(fullPath, { recursive: true })
        }
        expressApplication = new ExpressApplication(
            dataPath,
            { '/': './test/html/root' }, // htmlPaths
            'test_secret', // tokenSecret
        )
    })

    it('Es wird der HTTP Status Code 200 zurückgegeben.', async () => {
        // Erst mal Benutzer registrieren und anmelden
        await supertest(expressApplication.app).post('/api/register').send({ username: 'testusername', password: 'testpassword' }).expect(200)
        // Abmelden
        await supertest(expressApplication.app).get('/api/logout').expect(200)
    })

    it('Bei Erfolg wird das Sitzungs-Cookie entfernt.', async () => {
        // Erst mal Benutzer registrieren und anmelden
        const registerResponse = await supertest(expressApplication.app).post('/api/register').send({ username: 'testusername', password: 'testpassword' }).expect(200)
        // Abmelden muss Sitzungscookie leer machen und ablaufen lassen
        const response = await supertest(expressApplication.app).get('/api/logout')
            .expect(supertest.cookies.contain({ name: 'session', value: '', options: { expires: 'Thu, 01 Jan 1970 00:00:00 GMT' } }))
    })

})
