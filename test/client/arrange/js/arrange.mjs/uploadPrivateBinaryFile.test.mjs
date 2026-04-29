import assert from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'

describe('arrange.mjs uploadPrivateBinaryFile()', () => {

    let originalFetch
    let originalLocalStorage
    let originalXMLHttpRequest
    const arrangeLocation = '../../../../../client/arrange/js/arrange.mjs?'

    afterEach(() => {
        global.fetch = originalFetch
        global.localStorage = originalLocalStorage
        global.XMLHttpRequest = originalXMLHttpRequest
    })

    beforeEach(() => {
        originalFetch = global.fetch
        originalLocalStorage = global.localStorage
        originalXMLHttpRequest = global.XMLHttpRequest
        global.fetch = () => { // Für automatische Anmeldung
            return { status: 200 }
        }
        global.localStorage = {
            getItem: () => 'test_user_id'
        }
        global.XMLHttpRequest = class {
            constructor() {
                this.type = undefined
                this.upload = {
                    onprogress: () => {}
                }
                this.url = undefined
            }
            onerror() {}
            onload() {}
            open(type, url) {
                this.type = type
                this.url = url
            }
            send() {
                this.onload()
            }
        }
    })

    it('Es wird die API POST /api/files/test_user_id/ mit dem gegebenen Pfad aufgerufen.', async () => {
        // Automatisch anmelden lassen
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        // Abfruf simulieren
        let xmlHttpRequestWasSent = false
        const fileContent = 'neuer Dateiinhalt'
        global.XMLHttpRequest.prototype.send = function() {
            assert.strictEqual(this.type, 'POST')
            assert.ok(this.url.endsWith('/api/files/test_user_id/path/to/private/file.txt'))
            xmlHttpRequestWasSent = true
            this.onload()
        }
        await arrange.uploadPrivateBinaryFile('path/to/private/file.txt', Buffer.from(fileContent))
        assert.strictEqual(xmlHttpRequestWasSent, true)
    })

    it('Es wird der übergebene Dateiinhalt als Blob übertragen.', async () => {
        // Automatisch anmelden lassen
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        // Abfruf simulieren
        let xmlHttpRequestWasSent = false
        const fileContent = 'neuer Dateiinhalt'
        global.XMLHttpRequest.prototype.send = function(formData) {
            assert.ok(formData.has('data'))
            const dataEntry = formData.get('data')
            assert.strictEqual(dataEntry.size, fileContent.length)
            assert.strictEqual(dataEntry.name, 'blob')
            xmlHttpRequestWasSent = true
            this.onload()
        }
        await arrange.uploadPrivateBinaryFile('path/to/private/file.txt', Buffer.from(fileContent))
        assert.strictEqual(xmlHttpRequestWasSent, true)
    })

    it('Es wird der Fortschritt gemeldet.', async () => {
        // Automatisch anmelden lassen
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        // Abfruf simulieren
        let progressSent = false
        const fileContent = 'neuer Dateiinhalt'
        global.XMLHttpRequest.prototype.send = function() {
            this.upload.onprogress({ lengthComputable: true, loaded: 50, total: 100 })
            this.onload()
        }
        await arrange.uploadPrivateBinaryFile('path/to/private/file.txt', Buffer.from(fileContent), (progress) => {
            assert.strictEqual(progress, 50)
            progressSent = true
        })
        assert.strictEqual(progressSent, true)
    })

})
