import assert from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'

describe('arrange.mjs saveDatabaseRecord()', () => {

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

    it('Es wird die API PATCH /api/database/test_database/test_table/test_record_id aufgerufen.', async () => {
        // Automatisch anmelden lassen
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        // Abfruf simulieren
        let fetchWasCalled = false
        global.fetch = (url, options) => {
            assert.ok(url.endsWith('/api/database/test_database/test_table/test_record_id'))
            assert.strictEqual(options.method, 'PATCH')
            fetchWasCalled = true
            return { ok: true, json() { return {} } }
        }
        await arrange.saveDatabaseRecord('test_database', 'test_table', 'test_record_id', { Column1: 'text1' })
        assert.strictEqual(fetchWasCalled, true)
    })

    it('Die angegebenen Felder werden in body.fields übertragen', async () => {
        // Automatisch anmelden lassen
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        // Abfruf simulieren
        global.fetch = (_, options) => {
            assert.strictEqual(options.body, JSON.stringify({ fields: { Column1: 'text1', Column2: 42, Column3: null, Column4: false } }))
            return { ok: true, json() { return {} } }
        }
        await arrange.saveDatabaseRecord('test_database', 'test_table', 'test_record_id', { Column1: 'text1', Column2: 42, Column3: null, Column4: false })
    })

    it('Undefined - Werte werden nicht übertragen.', async () => {
        // Automatisch anmelden lassen
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        // Abfruf simulieren
        global.fetch = (_, options) => {
            assert.strictEqual(options.body, JSON.stringify({ fields: { Column1: 'text1', Column2: 42 } }))
            return { ok: true, json() { return {} } }
        }
        await arrange.saveDatabaseRecord('test_database', 'test_table', 'test_record_id', { Column1: 'text1', Column2: 42, Column3: undefined })
    })

    it('Bei Fehlern wird undefined zurückgegeben.', async () => {
        // Automatisch anmelden lassen
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        // Abfruf simulieren
        global.fetch = () => {
            return { ok: false }
        }
        const result = await arrange.saveDatabaseRecord('test_database', 'test_table', 'test_record_id', { Column1: 'text1', Column2: 42, Column3: undefined })
        assert.strictEqual(result, undefined)
    })

    it('Bei Erfolg wird eine JSON-Struktur zurückgegeben.', async () => {
        // Automatisch anmelden lassen
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        // Abfruf simulieren
        global.fetch = () => {
            return { ok: true, json() { return { Id: 'id1', Column1: 'text1', Column2: 42, Column3: 1 } } }
        }
        const result = await arrange.saveDatabaseRecord('test_database', 'test_table', 'test_record_id', { Column1: 'text1', Column2: 42 })
        assert.deepEqual(result, { Id: 'id1', Column1: 'text1', Column2: 42, Column3: 1 })
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
                await arrange.saveDatabaseRecord('test_database', 'test_table', 'test_record_id', { Column1: 'text1', Column2: 42 })
            }, 
            {
                message: 'Cannot save database record'
            }
        )
    })

})
