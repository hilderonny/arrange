import path from 'node:path'
import fs from 'node:fs'
import { afterEach, beforeEach, describe, it } from 'node:test'
import supertest from 'supertest'
import ExpressApplication from '../../ExpressApplication.mjs'
import assert from 'node:assert'

describe('ExpressApplication', () => {

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

    afterEach(() => {
        expressApplication.shutDown()
    })

    describe('Statischer Webserver', () => {
    
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

    describe('Funktion shutDown()', () => {

        it('Mehrfachaufrufe erzeugen keine Fehler.', async() => {
            // Datenbanken anlegen
            await supertest(expressApplication.app).patch(`/api/database/testdatabase1`).send({ schema: { Table1: {} } }).expect(200)
            await supertest(expressApplication.app).patch(`/api/database/testdatabase2`).send({ schema: { Table1: {} } }).expect(200)
            // Anwendung schließen
            expressApplication.shutDown()
            // Anwendung erneut schließen, es sollten keine Fehler auftreten
            expressApplication.shutDown()
        })

        it('Schließt alle Datenbank-Handles, sodass die .sqlite-Dateien freigegeben werden.', async() => {
            // Datenbanken anlegen
            await supertest(expressApplication.app).patch(`/api/database/testdatabase1`).send({ schema: { Table1: {} } }).expect(200)
            await supertest(expressApplication.app).patch(`/api/database/testdatabase2`).send({ schema: { Table1: {} } }).expect(200)
            expressApplication.shutDown()
            const testDatabase1Path = path.resolve('./test/data/databases/testdatabase1.sqlite')
            const testDatabase2Path = path.resolve('./test/data/databases/testdatabase2.sqlite')
            assert.ok(fs.existsSync(testDatabase1Path))
            assert.ok(fs.existsSync(testDatabase2Path))
            fs.rmSync(testDatabase1Path)
            fs.rmSync(testDatabase2Path)
            // Wenn wir bis hier kommen, sind die Dateien freigegeben und konnten gelöscht werden
        })

    })

})
