import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert'

import path from 'node:path'
import fs from 'node:fs'
import http from 'node:http'
import https from 'node:https'

import ArrangeServer from '../../ArrangeServer.mjs'

const originalHttpCreateServer = http.createServer
const originalHttpsCreateServer = https.createServer
const originalFsReadFileSync = fs.readFileSync
const originalPathJoin = path.join
const originalObjectEntries = Object.entries

describe('ArrangeServer', () => {

    afterEach(() => {
        http.createServer = originalHttpCreateServer
        https.createServer = originalHttpsCreateServer
        fs.readFileSync = originalFsReadFileSync
        path.join = originalPathJoin
        Object.entries = originalObjectEntries
    })

    beforeEach(() => {
        // Damit nicht wirklich Port belegt werden, was zu einem Lock führen würde
        const serverCreatorMock = () => {
            return {
                listen(_, callback) {
                    callback()
                }
            }
        }
        http.createServer = serverCreatorMock
        https.createServer = serverCreatorMock
    })

    describe('createServer', () => {

        it('Erstellt einen Server, wenn keine Optionen angegeben sind', () => {
            const arrangeServer = new ArrangeServer()
            assert.ok(arrangeServer)
        })

        it('Rückgabeobjekt enthält start() - Funktion', () => {
            const arrangeServer = new ArrangeServer()
            assert.ok(arrangeServer.start)
        })

        it('Wenn Option crtFile fehlt, wird undefined angenommen', () => {
            let crtFileWasSetCorrectly = false
            fs.readFileSync = (filePath) => {
                // Beim ersten Aufruf wird users.json gelesen
                if (filePath && filePath.endsWith('users.json')) {
                    return '[]'
                }
                // Der zweite Aufruf enthält das keyFile
                if (filePath === 'keyFile') { // keyFile soll durchgelassen werden
                    return ''
                }
                // Der dritte Aufruf enthält das crtFile
                if (filePath === undefined) {
                    crtFileWasSetCorrectly = true
                }
            }
            new ArrangeServer({
                keyFile: 'keyFile',
                useSSL: true,
            })
            assert.ok(crtFileWasSetCorrectly)
        })

        it('Wenn Option dataPath fehlt, wird "./data" angenommen', () => {
            let dataPathSetCorrectly = false
            path.join = (...paths) => {
                if (paths.length > 0 && paths[0] === './data') {
                    dataPathSetCorrectly = true
                }
                return originalPathJoin(...paths)
            }
            new ArrangeServer()
            assert.ok(dataPathSetCorrectly)
        })

        it('Wenn Option htmlPaths fehlt, wird {} (leeres Objekt) angenommen', () => {
            let htmlPathsSetCorrectly = false
            Object.entries = (obj) => {
                if (JSON.stringify(obj) === '{}') {
                    htmlPathsSetCorrectly = true
                }
                return []
            }
            new ArrangeServer()
            assert.ok(htmlPathsSetCorrectly)
        })

        it('Wenn Option keyFile fehlt, wird undefined angenommen', () => {
            let keyFileWasSetCorrectly = false
            fs.readFileSync = (filePath) => {
                // Beim ersten Aufruf wird users.json gelesen
                if (filePath && filePath.endsWith('users.json')) {
                    return '[]'
                }
                // Der zweite Aufruf enthält das keyFile
                if (filePath === undefined) {
                    keyFileWasSetCorrectly = true
                }
                // Der dritte Aufruf enthält das crtFile
                if (filePath === 'crtFile') { // crtFile soll durchgelassen werden
                    return ''
                }
            }
            new ArrangeServer({
                crtFile: 'crtFile',
                useSSL: true,
            })
            assert.ok(keyFileWasSetCorrectly)
        })

        it('Wenn Option name fehlt, wird "Arrange" angenommen', () => {
            const options = {}
            const arrangeServer = new ArrangeServer(options)
            arrangeServer.start()
            assert.strictEqual(options.name, 'Arrange')
        })

        it('Wenn Option port fehlt, wird 8080 angenommen', () => {
            const options = {}
            const arrangeServer = new ArrangeServer(options)
            arrangeServer.start()
            assert.strictEqual(options.port, 8080)
        })

        it('Wenn Option tokenSecret fehlt, wird eine Zeichenkette generiert', () => {
            const options = {}
            const arrangeServer = new ArrangeServer(options)
            arrangeServer.start()
            assert.ok(options.tokenSecret)
        })

        it('Wenn Option useSSL fehlt, wird false angenommen', () => {
            let httpCreateServerCalled = false
            http.createServer = () => {
                httpCreateServerCalled = true
            }
            const options = {}
            const arrangeServer = new ArrangeServer(options)
            assert.ok(arrangeServer)
            assert.ok(httpCreateServerCalled)
        })

        it('Wenn Option useSSL=true ist und crtFile fehlt, wird Fehler geworfen', () => {
            fs.readFileSync = (filePath) => {
                if (filePath) {
                    return '[]'
                } else {
                    throw new Error()
                }
            }
            const options = { useSSL: true, keyFile: 'keyFile' }
            assert.throws( function() { 
                new ArrangeServer(options)
            }, Error )
        })

        it('Wenn Option useSSL=true ist und keyFile fehlt, wird Fehler geworfen', () => {
            fs.readFileSync = (filePath) => {
                if (filePath) {
                    return '[]'
                } else {
                    throw new Error()
                }
            }
            const options = { useSSL: true, crtFile: 'crtFile' }
            assert.throws( function() { 
                new ArrangeServer(options)
            }, Error )
        })

        it('Wenn Option useSSL=true ist, wird HTTPS-Server erstellt', () => {
            let httpsCreateServerCalled = false
            https.createServer = () => {
                httpsCreateServerCalled = true
            }
            fs.readFileSync = () => { // Für Zertifikatdateien, damit die keine Fehler werfen
                return '[]'
            }
            const options = { useSSL: true, crtFile: 'crtFile', keyFile: 'keyFile' }
            const arrangeServer = new ArrangeServer(options)
            assert.ok(arrangeServer)
            assert.ok(httpsCreateServerCalled)
        })

        it('Wenn Option useSSL=false ist, wird HTTP-Server erstellt', () => {
            let httpCreateServerCalled = false
            http.createServer = () => {
                httpCreateServerCalled = true
            }
            const options = { useSSL: false }
            const arrangeServer = new ArrangeServer(options)
            assert.ok(arrangeServer)
            assert.ok(httpCreateServerCalled)
        })

        it('Wenn Option useWebsockets=true ist, wird ein Websocket Server gestartet', () => {
            let httpServerOnCalled = false
            http.createServer = () => {
                return {
                    on() {
                        httpServerOnCalled = true
                    }
                }
            }
            const options = { useWebsockets: true }
            new ArrangeServer(options)
            assert.ok(httpServerOnCalled)
        })

    })

    describe('start', () => {

        it('Startet HTTP-Server, wenn bei createServer useSSL=false angegeben wurde', () => {
            let httpListenCalled = false
            http.createServer = () => {
                return {
                    listen () {
                        httpListenCalled = true
                    }
                }
            }
            const options = { useSSL: false }
            const arrangeServer = new ArrangeServer(options)
            arrangeServer.start()
            assert.ok(httpListenCalled)
        })

        it('Startet HTTPS-Server, wenn bei createServer useSSL=true angegeben wurde', () => {
            let httpsListenCalled = false
            https.createServer = () => {
                return {
                    listen () {
                        httpsListenCalled = true
                    }
                }
            }
            fs.readFileSync = () => { // Für Zertifikatdateien, damit die keine Fehler werfen
                return '[]'
            }
            const options = { useSSL: true, crtFile: 'crtFile', keyFile: 'keyFile' }
            const arrangeServer = new ArrangeServer(options)
            arrangeServer.start()
            assert.ok(httpsListenCalled)
        })

    })

})