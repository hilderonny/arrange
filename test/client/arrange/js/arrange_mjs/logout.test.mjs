import assert from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'

describe('arrange.mjs logout()', () => {

    let originalFetch
    let originalLocation
    let originalLocalStorage
    const arrangeLocation = '../../../../../client/arrange/js/arrange.mjs?'

    afterEach(() => {
        global.fetch = originalFetch
        global.location = originalLocation
        global.localStorage = originalLocalStorage
    })

    beforeEach(() => {
        originalFetch = global.fetch
        originalLocation = global.location
        global.fetch = () => { // Für automatische Anmeldung
            return { status: 200 }
        }
        global.location = { reload: () => {} }
        global.localStorage = {
            items: {},
            getItem(key) { return global.localStorage.items[key] },
            removeItem(key) { delete global.localStorage.items[key] },
            setItem(key, value) { global.localStorage.items[key] = value },
        }
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

    it('Benutzerdaten werden aus localStorage gelöscht.', async() => {
        global.localStorage.items = {
            'userid': 'testuserid',
            'username': 'testusername',
            'password': 'testpassword',
        }
        // Automatisch anmelden lassen
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        // Abmeldung simulieren
        await arrange.logout()
        assert.strictEqual(global.localStorage.items['userid'], undefined)
        assert.strictEqual(global.localStorage.items['username'], undefined)
        assert.strictEqual(global.localStorage.items['password'], undefined)
    })

})
