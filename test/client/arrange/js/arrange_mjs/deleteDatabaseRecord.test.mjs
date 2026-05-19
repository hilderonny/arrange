import assert from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'

describe('arrange.mjs deleteDatabaseRecord()', () => {

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

    it('Es wird die API DELETE /api/database/test_database/test_table/test_record_id aufgerufen.', async () => {
        // Automatisch anmelden lassen
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        // Abfruf simulieren
        let fetchWasCalled = false
        global.fetch = (url, options) => {
            assert.ok(url.endsWith('/api/database/test_database/test_table/test_record_id'))
            assert.strictEqual(options.method, 'DELETE')
            fetchWasCalled = true
            return { status: 200 }
        }
        await arrange.deleteDatabaseRecord('test_database', 'test_table', 'test_record_id')
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
                await arrange.deleteDatabaseRecord('test_database', 'test_table', 'test_record_id')
            }, 
            {
                message: 'Cannot delete database record'
            }
        )
    })

})
