import assert from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'

describe('arrange.mjs getPrivateFile()', () => {

    let originalFetch
    let originalLocalStorage
    const arrangeLocation = '../../../../../client/arrange/js/arrange.mjs?'

    afterEach(() => {
        global.fetch = originalFetch
        global.localStorage = originalLocalStorage
    })

    beforeEach(() => {
        originalFetch = global.fetch
        originalLocalStorage = global.localStorage
        global.fetch = () => { // Für automatische Anmeldung
            return { status: 200 }
        }
        global.localStorage = {
            getItem: () => 'test_user_id'
        }
    })

    it('Es wird die API GET /api/files/test_user_id/ mit dem gegebenen Pfad aufgerufen.', async () => {
        // Automatisch anmelden lassen
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        // Abfruf simulieren
        let fetchWasCalled = false
        global.fetch = (url, options) => {
            assert.ok(url.endsWith('/api/files/test_user_id/path/to/private/file'))
            assert.strictEqual(options, undefined)
            fetchWasCalled = true
        }
        await arrange.getPrivateFile('path/to/private/file')
        assert.strictEqual(fetchWasCalled, true)
    })

})
