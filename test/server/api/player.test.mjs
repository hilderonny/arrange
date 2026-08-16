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

        it('.', async () => {
        })
    
    })

    describe('POST /api/player/addcoins/:userId/:coinsToAdd', () => {

        it('.', async () => {
        })
    
    })

    describe('POST /api/player/addexperience/:userId/:experienceToAdd', () => {

        it('.', async () => {
        })
    
    })

    describe('POST /api/player/removecoins/:userId/:coinsToRemove', () => {

        it('.', async () => {
        })
    
    })

})
