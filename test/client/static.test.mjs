import path from 'node:path'
import fs from 'node:fs'
import { beforeEach, describe, it } from 'node:test'
import supertest from 'supertest'
import ExpressApplication from '../../ExpressApplication.mjs'
import assert from 'node:assert'

describe('Statischer Webserver', () => {

    let expressApplication
    let userId

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
        // Benutzer anlegen
        const response = await supertest(expressApplication.app).post('/api/register').send({ username: 'testusername', password: 'testpassword' }).expect(200)
        userId = response.body.id
    })

    it('Liefert /client/arrange/js/arrange.mjs aus', async () => {
        const fileContent = fs.readFileSync(path.resolve(`./client/arrange/js/arrange.mjs`)).toString()
        const response = await supertest(expressApplication.app).get('/arrange/js/arrange.mjs')
        assert.strictEqual(fileContent, response.text)
    })

    it('Liefert /client/arrange/js/types/DatabaseObject.mjs aus', async () => {
        const fileContent = fs.readFileSync(path.resolve(`./client/arrange/js/types/DatabaseObject.mjs`)).toString()
        const response = await supertest(expressApplication.app).get('/arrange/js/types/DatabaseObject.mjs')
        assert.strictEqual(fileContent, response.text)
    })

    it('Liefert /client/arrange/login.html aus', async () => {
        const fileContent = fs.readFileSync(path.resolve(`./client/arrange/login.html`)).toString()
        const response = await supertest(expressApplication.app).get('/arrange/login.html')
        assert.strictEqual(fileContent, response.text)
    })

    it('Liefert /client/arrange/register.html aus', async () => {
        const fileContent = fs.readFileSync(path.resolve(`./client/arrange/register.html`)).toString()
        const response = await supertest(expressApplication.app).get('/arrange/register.html')
        assert.strictEqual(fileContent, response.text)
    })

    it('Liefert /index.html aus', async () => {
        const fileContent = fs.readFileSync(path.resolve(`./test/html/index.html`)).toString()
        const response = await supertest(expressApplication.app).get('/')
        assert.strictEqual(fileContent, response.text)
    })

})
