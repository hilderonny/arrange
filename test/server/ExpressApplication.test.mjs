import path from 'node:path'
import fs from 'node:fs'
import { afterEach, beforeEach, describe, it } from 'node:test'
import supertest from 'supertest'
import ExpressApplication from '../../ExpressApplication.mjs'
import assert from 'node:assert'

describe('ExpressApplication', () => {

    let expressApplication
    let userId
    let websocketMock

    beforeEach(async () => {
        const dataPath = './test/data'
        const fullPath = path.resolve(dataPath)
        if (fs.existsSync(fullPath)) {
            fs.rmSync(fullPath, { recursive: true })
        }
        websocketMock = { // Immer wieder neu aufbauen, anstatt zentral zu verwenden. Ist sauberer.
            eventListeners: {},
            on: function (eventName, callback) {
                if (!this.eventListeners[eventName]) {
                    this.eventListeners[eventName] = []
                }
                this.eventListeners[eventName].push(callback)
            },
            send: () => {},
            sendEvent: async function (eventName, message) {
                if (this.eventListeners[eventName]) {
                    for (const callback of this.eventListeners[eventName]) {
                        await callback(message)
                    }
                }
            },
        }
        expressApplication = new ExpressApplication(
            dataPath,
            { // htmlPaths
                '/': './test/html/root',
                '/subfolder1': './test/html/subfolder1',
                '/subfolder2': './test/html/subfolder2',
            },
            'test_secret', // tokenSecret
        )
        // Benutzer anlegen
        const response = await supertest(expressApplication.app).post('/api/register').send({ username: 'testusername', password: 'testpassword' }).expect(200)
        userId = response.body.id
    })

    afterEach(() => {
        expressApplication.shutDown()
        websocketMock.sendEvent('close')
    })

    describe('Instanz', () => {

        it('Enthält loadDatabase() - Funktion', () => {
            assert.ok(expressApplication.loadDatabase)
        })
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
            const fileContent = fs.readFileSync(path.resolve(`./test/html/root/index.html`)).toString()
            const response = await supertest(expressApplication.app).get('/')
            assert.strictEqual(fileContent, response.text)
        })

        it('Liefert /subfolder1/index.html aus', async() => {
            const fileContent = fs.readFileSync(path.resolve(`./test/html/subfolder1/index.html`)).toString()
            const response = await supertest(expressApplication.app).get('/subfolder1/')
            assert.strictEqual(fileContent, response.text)
        })

        it('Liefert /subfolder2/index.html aus', async() => {
            const fileContent = fs.readFileSync(path.resolve(`./test/html/subfolder2/index.html`)).toString()
            const response = await supertest(expressApplication.app).get('/subfolder2/')
            assert.strictEqual(fileContent, response.text)
        })

    })

    describe('Funktion handleWebsocketConnection()', () => {

        it('Bei Verbindung wird eine 0x01-Nachricht mit einer vom Server generierten Wobsocket-Id erhalten', () => {
            let websocketIdReceived = false
            websocketMock.send = (message) => {
                assert.ok(message)
                assert.ok(message.byteLength > 1)
                const buffer = Buffer.from(message)
                assert.strictEqual(buffer[0], 0x01)
                websocketIdReceived = true
            }
            expressApplication.handleWebsocketConnection(websocketMock)
            assert.strictEqual(websocketIdReceived, true)
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

    describe('APIs', () => {

        it('Custom APIs werden aus config.json ausgelesen.', async() => {})

        it('Methode DELETE ist verfügbar.', async() => {})

        it('Methode GET ist verfügbar.', async() => {})

        it('Methode HEAD ist verfügbar.', async() => {})

        it('Methode POST ist verfügbar.', async() => {})

        it('Methode PUT ist verfügbar.', async() => {})

        it('Standard-API /api/autologin kann nicht überschrieben werden.', async() => {})

        it('Standard-API /api/database kann nicht überschrieben werden.', async() => {})

        it('Standard-API /api/files kann nicht überschrieben werden.', async() => {})

        it('Standard-API /api/login kann nicht überschrieben werden.', async() => {})

        it('Standard-API /api/logout kann nicht überschrieben werden.', async() => {})

        it('Standard-API /api/register kann nicht überschrieben werden.', async() => {})

        it('Fehlendes Javascript-Modul erzeugt Programmabbruch', async() => {})

        it('Fehlerhaftes Javascript-Modul erzeugt Programmabbruch', async() => {})

        it('Fehlerhafte API-URL-Definition erzeugt Programmabbruch', async() => {})

    })

})
