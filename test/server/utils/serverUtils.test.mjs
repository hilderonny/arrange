import fs from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'
import supertest from 'supertest'
import assert from 'node:assert'

import config from '../../../config.mjs'
config.htmlPaths['/'] = './test/html/root'
config.htmlPaths['/subfolder1'] = './test/html/subfolder1'
config.htmlPaths['/subfolder2'] = './test/html/subfolder2'

import serverUtils from '../../../utils/serverUtils.mjs'

const expressApplication = await serverUtils.createExpressApplication()

describe('serverUtils', () => {

    describe('createExpressApplication()', () => {
    
        it('Statischer Webserver liefert /client/arrange/js/arrange.mjs aus', async () => {
            const fileContent = fs.readFileSync(path.resolve(`./client/arrange/js/arrange.mjs`)).toString()
            const response = await supertest(expressApplication).get('/arrange/js/arrange.mjs')
            assert.strictEqual(fileContent, response.text)
        })

        it('Statischer Webserver liefert /client/arrange/js/types/DatabaseObject.mjs aus', async () => {
            const fileContent = fs.readFileSync(path.resolve(`./client/arrange/js/types/DatabaseObject.mjs`)).toString()
            const response = await supertest(expressApplication).get('/arrange/js/types/DatabaseObject.mjs')
            assert.strictEqual(fileContent, response.text)
        })

        it('Statischer Webserver liefert /client/arrange/login.html aus', async () => {
            const fileContent = fs.readFileSync(path.resolve(`./client/arrange/login.html`)).toString()
            const response = await supertest(expressApplication).get('/arrange/login.html')
            assert.strictEqual(fileContent, response.text)
        })

        it('Statischer Webserver liefert /client/arrange/register.html aus', async () => {
            const fileContent = fs.readFileSync(path.resolve(`./client/arrange/register.html`)).toString()
            const response = await supertest(expressApplication).get('/arrange/register.html')
            assert.strictEqual(fileContent, response.text)
        })

        it('Statischer Webserver liefert /index.html aus', async () => {
            const fileContent = fs.readFileSync(path.resolve(`./test/html/root/index.html`)).toString()
            const response = await supertest(expressApplication).get('/')
            assert.strictEqual(fileContent, response.text)
        })

        it('Statischer Webserver liefert /subfolder1/index.html aus', async() => {
            const fileContent = fs.readFileSync(path.resolve(`./test/html/subfolder1/index.html`)).toString()
            const response = await supertest(expressApplication).get('/subfolder1/')
            assert.strictEqual(fileContent, response.text)
        })

        it('Statischer Webserver liefert /subfolder2/index.html aus', async() => {
            const fileContent = fs.readFileSync(path.resolve(`./test/html/subfolder2/index.html`)).toString()
            const response = await supertest(expressApplication).get('/subfolder2/')
            assert.strictEqual(fileContent, response.text)
        })

    })

})