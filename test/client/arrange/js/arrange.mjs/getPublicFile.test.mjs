import assert from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'

describe('arrange.js getPublicFile()', () => {

    let originalFetch
    let originalLocalStorage
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

    it('Es wird die API GET /api/files/public/ mit dem gegebenen Pfad aufgerufen.', async () => {
        // Automatisch anmelden lassen
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        // Abfruf simulieren
        let fetchWasCalled = false
        global.fetch = (url, options) => {
            assert.ok(url.endsWith('/api/files/public/path/to/public/file'))
            assert.strictEqual(options, undefined)
            fetchWasCalled = true
        }
        await arrange.getPublicFile('path/to/public/file')
        assert.strictEqual(fetchWasCalled, true)
    })

})
