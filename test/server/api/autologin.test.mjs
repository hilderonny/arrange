import path from 'node:path'
import fs from 'node:fs'
import { beforeEach, describe, it } from 'node:test'
import supertest from 'supertest'
import ExpressApplication from '../../../ExpressApplication.mjs'

describe('GET /api/autologin', () => {

    let expressApplication

    beforeEach(async () => {
        const dataPath = './test/data'
        fs.rmSync(path.resolve(dataPath), { recursive: true })
        expressApplication = new ExpressApplication(
            dataPath,
            './test/html', // htmlPath
            'test_secret', // tokenSecret
        )
    })

    it('Ohne Sitzung wird HTTP Status 401 zurück gegeben.', async () => {
        await supertest(expressApplication.app).get('/api/autologin').expect(401)
    })

    it('Mit Sitzung wird HTTP Status 200 zurück gegeben.', async () => {
        // Agenten senden Cookies automatisch zurück
        const agent = supertest.agent(expressApplication.app)
        // Benutzer anlegen, sollte funktionieren
        await agent.post('/api/register').send({ username: 'testusername', password: 'testpassword' }).expect(200)
        // Auto-Login sollte nun auch gehen
        await agent.get('/api/autologin').expect(200)
    })

})
