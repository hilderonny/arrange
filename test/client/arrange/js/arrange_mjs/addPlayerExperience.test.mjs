import assert from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'

describe('arrange.mjs addPlayerExperience()', () => {

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

    it('Es wird die API GET /api/player/addexperience/test_user_id/12345 aufgerufen.', async () => {
        // Automatisch anmelden lassen
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        // Abfruf simulieren
        let fetchWasCalled = false
        global.fetch = (url) => {
            assert.ok(url.endsWith('/api/player/addexperience/test_user_id/12345'))
            fetchWasCalled = true
            return { ok: true, json() { return {} } }
        }
        await arrange.addPlayerExperience(12345)
        assert.strictEqual(fetchWasCalled, true)
    })

    it('Bei Erfolg wird der Status als JSON-Objekt zurückgegeben.', async () => {
        // Automatisch anmelden lassen
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        const objectToReturn = {
            Coins:  23456,
            Experience: 123,
            Level:  10,
            LevelBefore:  9,
            NextLevelExperience: 345,
        }
        // Abfruf simulieren
        global.fetch = () => {
            return { ok: true, json() { return objectToReturn } }
        }
        const result = await arrange.addPlayerExperience(12345)
        assert.ok(typeof(result) === 'object')
        assert.deepEqual(result, objectToReturn)
    })

})
