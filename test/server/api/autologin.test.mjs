import { beforeEach, describe, it } from 'node:test'
import supertest from 'supertest'

import config from '../../../config.mjs'
config.usersJsonPath = './test/data/users/users.json'

import serverUtils from '../../../utils/serverUtils.mjs'
import userUtils from '../../../utils/userUtils.mjs'

const expressApplication = await serverUtils.createExpressApplication()

describe('GET /api/autologin', () => {

    beforeEach(async () => {
        userUtils.deleteUser(userUtils.getUserForUsername('testusername'))
    })

    it('Ohne Sitzung wird HTTP Status 401 zurück gegeben.', async () => {
        await supertest(expressApplication).get('/api/autologin').expect(401)
    })

    it('Mit Sitzung wird HTTP Status 200 zurück gegeben.', async () => {
        // Agenten senden Cookies automatisch zurück
        const agent = supertest.agent(expressApplication)
        // Benutzer anlegen, sollte funktionieren
        await agent.post('/api/register').send({ username: 'testusername', password: 'testpassword' }).expect(200)
        // Auto-Login sollte nun auch gehen
        await agent.get('/api/autologin').expect(200)
    })

})
