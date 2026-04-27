import assert from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'

describe('arrange.js logout()', () => {

    let originalFetch
    let originalLocation
    const arrangeLocation = '../../../../../client/arrange/js/arrange.mjs?'

    afterEach(() => {
        global.fetch = originalFetch
        global.location = originalLocation
    })

    beforeEach(() => {
        originalFetch = global.fetch
        originalLocation = global.location
        global.fetch = () => { // Für automatische Anmeldung
            return { status: 200 }
        }
        global.location = { reload: () => {} }
    })

    it('Es wird die API GET /api/logout aufgerufen.', async () => {
        // Automatisch anmelden lassen
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        // Abmeldung simulieren
        let fetchWasCalled = false
        global.fetch = (url, options) => {
            assert.strictEqual(url, '/api/logout')
            assert.strictEqual(options, undefined)
            fetchWasCalled = true
        }
        await arrange.logout()
        assert.strictEqual(fetchWasCalled, true)
    })

    it('Die Seite wird neu geladen.', async () => {
        // Automatisch anmelden lassen
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        // Abmeldung simulieren
        global.fetch = () => { }
        let reloadWasCalled = false
        global.location.reload = () => {
            reloadWasCalled = true
        }
        await arrange.logout()
        assert.strictEqual(reloadWasCalled, true)
    })

})
