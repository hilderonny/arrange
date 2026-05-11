import assert from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'

describe('arrange.mjs updateDatabase()', () => {

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

    it('Es wird die API PATCH /api/database/test_database aufgerufen.', async () => {
        // Automatisch anmelden lassen
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        // Abfruf simulieren
        let fetchWasCalled = false
        global.fetch = (url, options) => {
            assert.ok(url.endsWith('/api/database/test_database'))
            assert.strictEqual(options.method, 'PATCH')
            fetchWasCalled = true
            return { ok: true }
        }
        await arrange.updateDatabase('test_database', { Table1: { Column1: 'TEXT' }})
        assert.strictEqual(fetchWasCalled, true)
    })

    it('Das übergebene Schema wird als JSON im body als Property "schema" mitgeschickt.', async () => {
        // Automatisch anmelden lassen
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        // Abfruf simulieren
        let fetchWasCalled = false
        global.fetch = (_, options) => {
            assert.ok(options.body)
            assert.strictEqual(options.body, JSON.stringify({ schema: { Table1: { Column1: 'TEXT' } } }))
            fetchWasCalled = true
            return { ok: true }
        }
        await arrange.updateDatabase('test_database', { Table1: { Column1: 'TEXT' }})
        assert.strictEqual(fetchWasCalled, true)
    })

    it('Bei 500er-Serverfehlern wird eine Exception geworfen.', async() => {
        // Automatisch anmelden lassen
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        // Abfruf simulieren
        global.fetch = (url, options) => {
            return { status: 500 }
        }
        await assert.rejects(
            async () => { 
                await arrange.updateDatabase('test_database', { Table1: { Column1: 'TEXT' }})
            }, 
            {
                message: 'Cannot update database'
            }
        )
    })

})
