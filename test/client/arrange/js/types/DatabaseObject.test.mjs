import assert from 'node:assert'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'

describe('DatabaseObject', () => {

    let originalFetch
    const databaseObjectLocation = '../../../../../client/arrange/js/types/DatabaseObject.mjs?'

    afterEach(() => {
        global.fetch = originalFetch
    })

    beforeEach(async () => {
        originalFetch = global.fetch
        global.fetch = () => { // Für automatische Anmeldung
            return { status: 200 }
        }
    })

    describe('constructor()', () => {

        it('DatabaseObject kann nicht direkt instanziiert werden.', async () => {
            const DatabaseObject = (await import(databaseObjectLocation + Math.random())).default
            assert.throws(() => { new DatabaseObject() })
        })

        it('DatabaseObject kann abgeleitet werden.', async () => {
            const DatabaseObject = (await import(databaseObjectLocation + Math.random())).default
            class DerivedClass extends DatabaseObject {}
            const derivedInstance = new DerivedClass()
            assert.ok(derivedInstance)
        })

        it('Eine neue Instanz ohne vorgegebene Id bekommt eine generierte Id.', async () => {
            const DatabaseObject = (await import(databaseObjectLocation + Math.random())).default
            class DerivedClass extends DatabaseObject {}
            const derivedInstance = new DerivedClass()
            assert.ok(derivedInstance)
            assert.ok(derivedInstance.Id)
        })

        it('Eine vorgegebene Id wird übernommen.', async () => {
            const DatabaseObject = (await import(databaseObjectLocation + Math.random())).default
            class DerivedClass extends DatabaseObject {}
            const derivedInstance = new DerivedClass({ Id: 'id1' })
            assert.ok(derivedInstance)
            assert.strictEqual(derivedInstance.Id, 'id1')
        })

    })

    describe('delete()', () => {

        it('Ruft API DELETE /api/database/:databaseName/:tableName/:recordId auf.', async () => {
            const DatabaseObject = (await import(databaseObjectLocation + Math.random())).default
            // Datenbank und Tabelle in abgeleiteter Klasse definieren
            class DerivedClass extends DatabaseObject {
                static databaseName = 'Database1'
                static tableName = 'Table1'
            }
            const derivedInstance = new DerivedClass({ Id: 'id1' })
            // Abfruf simulieren
            let fetchWasCalled = false
            global.fetch = (url, options) => {
                assert.ok(url.endsWith('/api/database/Database1/Table1/id1'))
                assert.deepStrictEqual(options, { method: 'DELETE' })
                fetchWasCalled = true
            }
            await derivedInstance.delete()
            assert.strictEqual(fetchWasCalled, true)
        })

    })

    describe('static load(id)', () => {

        it('Ruft API POST /api/database/:databasename auf.', async () => {
            const DatabaseObject = (await import(databaseObjectLocation + Math.random())).default
            // Datenbank und Tabelle in abgeleiteter Klasse definieren
            class DerivedClass extends DatabaseObject {
                static databaseName = 'Database1'
                static tableName = 'Table1'
            }
            // Abfruf simulieren
            let fetchWasCalled = false
            global.fetch = (url, options) => {
                assert.ok(url.endsWith('/api/database/Database1'))
                assert.strictEqual(options.method, 'POST')
                assert.ok(options.body)
                const json = JSON.parse(options.body)
                assert.ok(json.query)
                assert.strictEqual(json.query, `SELECT * FROM Table1 WHERE Id='id1'`)
                fetchWasCalled = true
                return { ok: true, json() { return [] } }
            }
            await DerivedClass.load('id1')
            assert.strictEqual(fetchWasCalled, true)
        })

        it('Gibt eine Instanz der von DatabaseObject abgeleiteten Klasse zurück.', async () => {
            const DatabaseObject = (await import(databaseObjectLocation + Math.random())).default
            // Datenbank und Tabelle in abgeleiteter Klasse definieren
            class DerivedClass extends DatabaseObject {
                static databaseName = 'Database1'
                static tableName = 'Table1'
            }
            // Abfruf simulieren
            global.fetch = () => {
                return { ok: true, json() { return [{
                    Id: 'id1'
                }] } }
            }
            const result = await DerivedClass.load('id1')
            assert.ok(result)
            assert.ok(result instanceof DerivedClass)
        })

        it('Ergebnis enthält alle Felder - auch solche, die nicht in der abgeleiteten Klasse definiert sind.', async () => {
            const DatabaseObject = (await import(databaseObjectLocation + Math.random())).default
            // Datenbank und Tabelle in abgeleiteter Klasse definieren
            class DerivedClass extends DatabaseObject {
                static databaseName = 'Database1'
                static tableName = 'Table1'
            }
            // Abfruf simulieren
            global.fetch = () => {
                return { ok: true, json() { return [{
                    Id: 'id1',
                    UnknownColumn: 'text1'
                }] } }
            }
            const result = await DerivedClass.load('id1')
            assert.strictEqual(result.Id, 'id1')
            assert.strictEqual(result.UnknownColumn, 'text1')
        })

        it('Gibt undefined zurück, wenn kein Datensatz mit der Id gefunden wurde.', async () => {
            const DatabaseObject = (await import(databaseObjectLocation + Math.random())).default
            // Datenbank und Tabelle in abgeleiteter Klasse definieren
            class DerivedClass extends DatabaseObject {
                static databaseName = 'Database1'
                static tableName = 'Table1'
            }
            // Abfruf simulieren
            global.fetch = () => {
                return { ok: true, json() { return [] } }
            }
            const result = await DerivedClass.load('id1')
            assert.strictEqual(result, undefined)
        })

    })

    describe('static query()', () => {

        it('Ruft API POST /api/database/:databaseName auf.', async () => {
            const DatabaseObject = (await import(databaseObjectLocation + Math.random())).default
            // Datenbank und Tabelle in abgeleiteter Klasse definieren
            class DerivedClass extends DatabaseObject {
                static databaseName = 'Database1'
                static tableName = 'Table1'
            }
            // Abfruf simulieren
            let fetchWasCalled = false
            global.fetch = (url, options) => {
                assert.ok(url.endsWith('/api/database/Database1'))
                assert.strictEqual(options.method, 'POST')
                assert.ok(options.body)
                const json = JSON.parse(options.body)
                assert.ok(json.query)
                assert.strictEqual(json.query, 'SELECT * FROM Table1')
                fetchWasCalled = true
                return { ok: true, json() { return [] } }
            }
            await DerivedClass.query('SELECT * FROM Table1')
            assert.strictEqual(fetchWasCalled, true)
        })

        it('Gibt eine Liste von Instanzen der von DatabaseObject abgeleiteten Klasse zurück.', async () => {
            const DatabaseObject = (await import(databaseObjectLocation + Math.random())).default
            // Datenbank und Tabelle in abgeleiteter Klasse definieren
            class DerivedClass extends DatabaseObject {
                static databaseName = 'Database1'
                static tableName = 'Table1'
            }
            // Abfruf simulieren
            global.fetch = () => {
                return { ok: true, json() { return [
                    { Id: 'id1' },
                    { Id: 'id2' },
                ] } }
            }
            const records = await DerivedClass.query('SELECT * FROM Table1')
            assert.ok(records)
            assert.strictEqual(records.length, 2)
            for (const record of records) {
                assert.ok(record instanceof DerivedClass)
            }
        })

        it('Ergebnis enthält alle Felder - auch solche, die nicht in der abgeleiteten Klasse definiert sind.', async () => {
            const DatabaseObject = (await import(databaseObjectLocation + Math.random())).default
            // Datenbank und Tabelle in abgeleiteter Klasse definieren
            class DerivedClass extends DatabaseObject {
                static databaseName = 'Database1'
                static tableName = 'Table1'
            }
            // Abfruf simulieren
            global.fetch = () => {
                return { ok: true, json() { return [
                    { Id: 'id1', UnknownColumn: 'text1' }
                ] } }
            }
            const records = await DerivedClass.query('SELECT * FROM Table1')
            assert.ok(records)
            assert.strictEqual(records.length, 1)
            assert.strictEqual(records[0].Id, 'id1')
            assert.strictEqual(records[0].UnknownColumn, 'text1')
        })

        it('Gibt eine leere Liste zurück, wenn kein passender Datensatz gefunden wurde.', async () => {
            const DatabaseObject = (await import(databaseObjectLocation + Math.random())).default
            // Datenbank und Tabelle in abgeleiteter Klasse definieren
            class DerivedClass extends DatabaseObject {
                static databaseName = 'Database1'
                static tableName = 'Table1'
            }
            // Abfruf simulieren
            global.fetch = () => {
                return { ok: true, json() { return [] } }
            }
            const records = await DerivedClass.query('SELECT * FROM Table1')
            assert.ok(records)
            assert.strictEqual(records.length, 0)
        })

    })

    describe('save()', () => {

        it('Ruft API PATCH /api/database/:databaseName/:tableName/:recordId auf.', async () => {
            const DatabaseObject = (await import(databaseObjectLocation + Math.random())).default
            // Datenbank und Tabelle in abgeleiteter Klasse definieren
            class DerivedClass extends DatabaseObject {
                static databaseName = 'Database1'
                static tableName = 'Table1'
            }
            // Abfruf simulieren
            let fetchWasCalled = false
            global.fetch = (url, options) => {
                assert.ok(url.endsWith('/api/database/Database1/Table1/id1'))
                assert.strictEqual(options.method, 'PATCH')
                assert.ok(options.body)
                const json = JSON.parse(options.body)
                assert.ok(json.fields)
                fetchWasCalled = true
                return { ok: true, json() { return { Id: 'id1' } } }
            }
            const derivedInstance = new DerivedClass({ Id: 'id1' })
            await derivedInstance.save()
            assert.strictEqual(fetchWasCalled, true)
        })

        it('Es erfolgt keine Rückgabe (void).', async () => {
            const DatabaseObject = (await import(databaseObjectLocation + Math.random())).default
            // Datenbank und Tabelle in abgeleiteter Klasse definieren
            class DerivedClass extends DatabaseObject {
                static databaseName = 'Database1'
                static tableName = 'Table1'
            }
            // Abfruf simulieren
            global.fetch = () => {
                return { ok: true, json() { return { Id: 'id1' } } }
            }
            const derivedInstance = new DerivedClass({ Id: 'id1' })
            const result = await derivedInstance.save()
            assert.strictEqual(result, undefined)
        })

        it('Die Id der Instanz wird beim Aufruf nicht im Feld übergeben.', async () => {
            const DatabaseObject = (await import(databaseObjectLocation + Math.random())).default
            // Datenbank und Tabelle in abgeleiteter Klasse definieren
            class DerivedClass extends DatabaseObject {
                static databaseName = 'Database1'
                static tableName = 'Table1'
            }
            // Abfruf simulieren
            global.fetch = (_, options) => {
                const json = JSON.parse(options.body)
                assert.strictEqual(json.fields.Id, undefined)
                return { ok: true, json() { return { Id: 'id1', Column1: 'text1' } } }
            }
            const derivedInstance = new DerivedClass({ Id: 'id1', Column1: 'text1' })
            const result = await derivedInstance.save()
            assert.strictEqual(result, undefined)
        })

        it('Alle Felder werden übertragen.', async () => {
            const DatabaseObject = (await import(databaseObjectLocation + Math.random())).default
            // Datenbank und Tabelle in abgeleiteter Klasse definieren
            class DerivedClass extends DatabaseObject {
                static databaseName = 'Database1'
                static tableName = 'Table1'
            }
            // Abfruf simulieren
            global.fetch = (_, options) => {
                const json = JSON.parse(options.body)
                assert.strictEqual(json.fields.Column1, 'text1')
                assert.strictEqual(json.fields.UnknownColumn, 'text2')
                return { ok: true, json() { return { Id: 'id1', Column1: 'text1' } } }
            }
            const derivedInstance = new DerivedClass({ Id: 'id1', Column1: 'text1', UnknownColumn: 'text2' })
            const result = await derivedInstance.save()
            assert.strictEqual(result, undefined)
        })

    })

})
