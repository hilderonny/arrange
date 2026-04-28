import assert from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'

describe('arrange.js postPublicTextFile()', () => {

    let originalFetch
    const arrangeLocation = '../../../../../client/arrange/js/arrange.mjs?'

    afterEach(() => {
        global.fetch = originalFetch
    })

    beforeEach(() => {
        originalFetch = global.fetch
        global.fetch = () => { // Für automatische Anmeldung
            return { status: 200 }
        }
    })

    it('Es wird die API POST /api/files/public/ mit dem gegebenen Pfad aufgerufen.', async () => {
        // Automatisch anmelden lassen
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        // Abfruf simulieren
        let fetchWasCalled = false
        const fileContent = 'neuer Dateiinhalt'
        global.fetch = (url) => {
            assert.ok(url.endsWith('/api/files/public/path/to/public/file.txt'))
            fetchWasCalled = true
            return { ok: true }
        }
        await arrange.postPublicTextFile('path/to/public/file.txt', fileContent)
        assert.strictEqual(fetchWasCalled, true)
    })

    it('Es wird der übergebene Dateiinhalt als Blob übertragen.', async () => {
        // Automatisch anmelden lassen
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        // Abfruf simulieren
        let fetchWasCalled = false
        const fileContent = 'neuer Dateiinhalt'
        global.fetch = (_, options) => {
            assert.ok(options)
            assert.strictEqual(options.method, 'POST')
            assert.ok(options.body)
            assert.ok(options.body.has('data'))
            const dataEntry = options.body.get('data')
            assert.strictEqual(dataEntry.size, fileContent.length)
            assert.strictEqual(dataEntry.name, 'blob')
            fetchWasCalled = true
            return { ok: true }
        }
        await arrange.postPublicTextFile('path/to/public/file.txt', fileContent)
        assert.strictEqual(fetchWasCalled, true)
    })

})
