import fs from 'node:fs'
import path from 'node:path/posix'
import { afterEach, describe, it } from 'node:test'
import supertest from 'supertest'
import assert from 'node:assert'

import config from '../../../config.mjs'
config.databasesPath = './test/data/databases'
config.htmlPaths['/'] = './test/html/root'
config.htmlPaths['/subfolder1'] = './test/html/subfolder1'
config.htmlPaths['/subfolder2'] = './test/html/subfolder2'

import databaseUtils from '../../../utils/databaseUtils.mjs'
import serverUtils from '../../../utils/serverUtils.mjs'

databaseUtils.deleteDatabase('Player')

const expressApplication = await serverUtils.createExpressApplication()

describe('serverUtils', () => {

    describe('createExpressApplication()', () => {

        describe('Statischer Webserver', () => {

            it('Liefert /client/arrange/js/arrange.mjs aus', async () => {
                const fileContent = fs.readFileSync(path.resolve(`./client/arrange/js/arrange.mjs`)).toString()
                const response = await supertest(expressApplication).get('/arrange/js/arrange.mjs')
                assert.strictEqual(fileContent, response.text)
            })

            it('Liefert /client/arrange/js/types/DatabaseObject.mjs aus', async () => {
                const fileContent = fs.readFileSync(path.resolve(`./client/arrange/js/types/DatabaseObject.mjs`)).toString()
                const response = await supertest(expressApplication).get('/arrange/js/types/DatabaseObject.mjs')
                assert.strictEqual(fileContent, response.text)
            })

            it('Liefert /client/arrange/login.html aus', async () => {
                const fileContent = fs.readFileSync(path.resolve(`./client/arrange/login.html`)).toString()
                const response = await supertest(expressApplication).get('/arrange/login.html')
                assert.strictEqual(fileContent, response.text)
            })

            it('Liefert /client/arrange/register.html aus', async () => {
                const fileContent = fs.readFileSync(path.resolve(`./client/arrange/register.html`)).toString()
                const response = await supertest(expressApplication).get('/arrange/register.html')
                assert.strictEqual(fileContent, response.text)
            })

            it('Liefert /index.html aus', async () => {
                const fileContent = fs.readFileSync(path.resolve(`./test/html/root/index.html`)).toString()
                const response = await supertest(expressApplication).get('/')
                assert.strictEqual(fileContent, response.text)
            })

            it('Liefert /subfolder1/index.html aus', async() => {
                const fileContent = fs.readFileSync(path.resolve(`./test/html/subfolder1/index.html`)).toString()
                const response = await supertest(expressApplication).get('/subfolder1/')
                assert.strictEqual(fileContent, response.text)
            })

            it('Liefert /subfolder2/index.html aus', async() => {
                const fileContent = fs.readFileSync(path.resolve(`./test/html/subfolder2/index.html`)).toString()
                const response = await supertest(expressApplication).get('/subfolder2/')
                assert.strictEqual(fileContent, response.text)
            })

        })

        describe('Datenbankschema', () => {

            it('Standarddatenbank "Player" wird mit Standardinhalt angelegt', async() => {
                // Standarddatenbank prüfen
                const playerDatabase = await databaseUtils.loadDatabase('Player')
                assert.ok(playerDatabase)
                // Tabelle auf Vorhandensein prüfen
                assert.strictEqual(playerDatabase.prepare(`SELECT COUNT(*) AS tableCount FROM sqlite_schema WHERE type = 'table' AND name = 'PlayerStatus';`).get().tableCount, 1, 'Table "PlayerStatus" does not exist')
                // Spalten auf Vorhandensein prüfen
                assert.strictEqual(playerDatabase.prepare(`SELECT COUNT(*) AS columnCount FROM pragma_table_info('PlayerStatus') WHERE name='Id';`).get().columnCount, 1, 'Column "Id" does not exist')
                assert.strictEqual(playerDatabase.prepare(`SELECT COUNT(*) AS columnCount FROM pragma_table_info('PlayerStatus') WHERE name='Coins';`).get().columnCount, 1, 'Column "Coins" does not exist')
                assert.strictEqual(playerDatabase.prepare(`SELECT COUNT(*) AS columnCount FROM pragma_table_info('PlayerStatus') WHERE name='Experience';`).get().columnCount, 1, 'Column "Experience" does not exist')
                assert.strictEqual(playerDatabase.prepare(`SELECT COUNT(*) AS columnCount FROM pragma_table_info('PlayerStatus') WHERE name='UserId';`).get().columnCount, 1, 'Column "UserId" does not exist')
            })

        })

    })

})