import assert from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'

describe('arrange.mjs queryDatabase()', () => {

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

    it('Es wird die API POST /api/database/test_database aufgerufen.', async () => {
        // Automatisch anmelden lassen
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        // Abfruf simulieren
        let fetchWasCalled = false
        global.fetch = (url, options) => {
            assert.ok(url.endsWith('/api/database/test_database'))
            assert.strictEqual(options.method, 'POST')
            fetchWasCalled = true
            return { ok: true, json() { return {} } }
        }
        await arrange.queryDatabase('test_database', 'SELECT * FROM Table1')
        assert.strictEqual(fetchWasCalled, true)
    })

    it('Die Abfrage wird als JSON in der body-Property "query" mitgeschickt.', async () => {
        // Automatisch anmelden lassen
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        // Abfruf simulieren
        global.fetch = (_, options) => {
            assert.ok(options.body)
            assert.strictEqual(options.body, JSON.stringify({ query: 'SELECT * FROM Table1' }))
            return { ok: true, json() { return {} } }
        }
        await arrange.queryDatabase('test_database', 'SELECT * FROM Table1')
    })

    it('Bei Fehlern wird undefined zurückgegeben.', async () => {
        // Automatisch anmelden lassen
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        // Abfruf simulieren
        global.fetch = (_, options) => {
            assert.ok(options.body)
            assert.strictEqual(options.body, JSON.stringify({ query: 'SELECT * FROM Table1' }))
            return { ok: false }
        }
        const result = await arrange.queryDatabase('test_database', 'SELECT * FROM Table1')
        assert.strictEqual(result, undefined)
    })

    it('Bei Erfolg wird das Ergebnis als JSON-Objekt zurückgegeben.', async () => {
        // Automatisch anmelden lassen
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        // Abfruf simulieren
        global.fetch = (_, options) => {
            assert.ok(options.body)
            assert.strictEqual(options.body, JSON.stringify({ query: 'SELECT * FROM Table1' }))
            return { ok: true, json() { return { Column1: 'text1' } } }
        }
        const result = await arrange.queryDatabase('test_database', 'SELECT * FROM Table1')
        assert.ok(typeof(result) === 'object')
        assert.deepEqual(result, { Column1: 'text1' })
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
                await arrange.queryDatabase('test_database', 'SELECT * FROM Table1')
            }, 
            {
                message: 'Cannot query database'
            }
        )
    })

})
