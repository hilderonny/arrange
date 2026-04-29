import path from 'node:path'
import fs from 'node:fs'
import { afterEach, beforeEach, describe, it } from 'node:test'
import supertest from 'supertest'
import ExpressApplication from '../../../ExpressApplication.mjs'
import assert from 'node:assert'
import sqlite from 'node:sqlite'
import crypto from 'node:crypto'

function calculateFileHash(filePath) {
    const hash = crypto.createHash('md5')
    const fileContent = fs.readFileSync(filePath)
    hash.update(fileContent)
    return hash.digest('hex')
}

describe('API /api/database', () => {

    let database
    let expressApplication

    beforeEach(async () => {
        const dataPath = './test/data'
        const fullPath = path.resolve(dataPath)
        if (fs.existsSync(fullPath)) {
            fs.rmSync(fullPath, { recursive: true })
        }
        expressApplication = new ExpressApplication(
            dataPath,
            './test/html', // htmlPath
            'test_secret', // tokenSecret
        )
    })

    afterEach(() => {
        if (database && database.isOpen) {
            database.close()
        }
        expressApplication.shutDown()
    })

    describe('DELETE /api/database/:databaseName/:tableName', () => {

        it('Wenn die Datenbank nicht existiert, passiert nichts weiter und es wird der HTTP Statuscode 200 zurückgegeben.', async () => {
            await supertest(expressApplication.app).delete(`/api/database/notexistingdatabase/Table1`).expect(200)
        })

        it('Wenn die Tabelle nicht existiert, passiert nichts weiter und es wird der HTTP Statuscode 200 zurückgegeben.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL);`);
            // Abfrage ausführen
            await supertest(expressApplication.app).delete(`/api/database/testdatabase/notexistingtable`).expect(200)
        })

        it('Die angegebene Tabelle wird gelöscht.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL, Column1 TEXT);`);
            database.exec(`INSERT INTO Table1 (Id, Column1) VALUES ('id1', 'text1');`);
            // Abfrage ausführen
            await supertest(expressApplication.app).delete(`/api/database/testdatabase/Table1`).expect(200)
            // Gucken, ob die Tabelle noch da ist
            const table = database.prepare(`SELECT name FROM sqlite_schema WHERE type='table' AND name='Table1';`).get()
            assert.strictEqual(table, undefined)
        })

        it('ForeignKey-Abhängigkeiten werden ebenfalls gelöscht.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL, Column1 TEXT);`);
            database.exec(`CREATE TABLE Table2 (Id TEXT PRIMARY KEY NOT NULL, Table1Id REFERENCES Table1(Id) ON DELETE CASCADE);`);
            database.exec(`INSERT INTO Table1 (Id, Column1) VALUES ('id1', 'text1');`);
            database.exec(`INSERT INTO Table2 (Id, Table1Id) VALUES ('id2', 'id1');`);
            // Abfrage ausführen
            await supertest(expressApplication.app).delete(`/api/database/testdatabase/Table1`).expect(200)
            // Gucken, ob die Tabelle noch da ist
            const table = database.prepare(`SELECT name FROM sqlite_schema WHERE type='table' AND name='Table1';`).get()
            assert.strictEqual(table, undefined)
            // Gucken, ob der Record mit der Referenz noch da ist
            const table2Record = database.prepare(`SELECT * FROM Table2 WHERE Id='id2';`).get()
            assert.strictEqual(table2Record, undefined)
        })

    })

    describe('DELETE /api/database/:databaseName/:tableName/:recordId', () => {

        it('Wenn die Datenbank nicht existiert, passiert nichts weiter und es wird der HTTP Statuscode 200 zurückgegeben.', async () => {
            await supertest(expressApplication.app).delete(`/api/database/notexistingdatabase/Table1/id1`).expect(200)
        })

        it('Wenn die Tabelle nicht existiert, passiert nichts weiter und es wird der HTTP Statuscode 200 zurückgegeben.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL);`);
            // Abfrage ausführen
            await supertest(expressApplication.app).delete(`/api/database/testdatabase/notexistingtable/id1`).expect(200)
        })

        it('Wenn kein Datensatz mit der gegebenen Id existiert, passiert nichts weiter und es wird der HTTP Statuscode 200 zurückgegeben.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL);`);
            // Abfrage ausführen
            await supertest(expressApplication.app).delete(`/api/database/testdatabase/Table1/id1`).expect(200)
        })

        it('Der angegebene Datensatz wird gelöscht.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL, Column1 TEXT);`);
            database.exec(`INSERT INTO Table1 (Id, Column1) VALUES ('id1', 'text1');`);
            // Abfrage ausführen
            await supertest(expressApplication.app).delete(`/api/database/testdatabase/Table1/id1`).expect(200)
            // Gucken, ob Record noch da ist
            const record = database.prepare(`SELECT * FROM Table1 WHERE Id='id1';`).get()
            assert.strictEqual(record, undefined)
        })

        it('ForeignKey-Abhängigkeiten werden ebenfalls gelöscht.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL, Column1 TEXT);`);
            database.exec(`CREATE TABLE Table2 (Id TEXT PRIMARY KEY NOT NULL, Table1Id REFERENCES Table1(Id) ON DELETE CASCADE);`);
            database.exec(`INSERT INTO Table1 (Id, Column1) VALUES ('id1', 'text1');`);
            database.exec(`INSERT INTO Table2 (Id, Table1Id) VALUES ('id2', 'id1');`);
            // Abfrage ausführen
            await supertest(expressApplication.app).delete(`/api/database/testdatabase/Table1/id1`).expect(200)
            // Gucken, ob Record noch da ist
            const table1Record = database.prepare(`SELECT * FROM Table1 WHERE Id='id1';`).get()
            assert.strictEqual(table1Record, undefined)
            const table2Record = database.prepare(`SELECT * FROM Table2 WHERE Id='id2';`).get()
            assert.strictEqual(table2Record, undefined)
        })

    })

    describe('PATCH /api/database/:databaseName', () => {

        it('Wenn kein Body mitgesendet wird, wird HTTP Statuscode 400 zurückgegeben.', async () => {
            await supertest(expressApplication.app).patch(`/api/database/testdatabase`).expect(400)
        })

        it('Wenn kein Schema im Body mitgesendet wird, wird HTTP Statuscode 400 zurückgegeben.', async () => {
            await supertest(expressApplication.app).patch(`/api/database/testdatabase`).send({}).expect(400)
        })

        it('Wenn die angegebene Datenbank nicht existiert, wird sie erstellt.', async () => {
            await supertest(expressApplication.app).patch(`/api/database/testdatabase`).send({
                schema: {}
            }).expect(200)
            assert.ok(fs.existsSync(path.resolve('./test/data/databases/testdatabase.sqlite')))
        })

        it('Wenn die angegebene Datenbank bereits existiert, passiert nichts weiter.', async () => {
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            assert.ok(fs.existsSync(absolutePath))
            const md5Before = calculateFileHash(absolutePath)
            await supertest(expressApplication.app).patch(`/api/database/testdatabase`).send({
                schema: {}
            }).expect(200)
            // Prüfen, ob die Datenbank immernoch existiert und unverändert ist
            assert.ok(fs.existsSync(absolutePath))
            const md5After = calculateFileHash(absolutePath)
            assert.strictEqual(md5Before, md5After)
        })

        it('Wenn eine Tabelle nicht existiert, wird sie mit Spalte Id als textuellen Primärschlüssel erstellt.', async () => {
            await supertest(expressApplication.app).patch(`/api/database/testdatabase`).send({
                schema: {
                    Table1: {}
                }
            }).expect(200)
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            database = new sqlite.DatabaseSync(absolutePath)
            const tables = database.prepare(`SELECT name FROM sqlite_schema WHERE type='table';`).all()
            const columns = database.prepare(`SELECT * FROM pragma_table_info('Table1');`).all()
            assert.ok(tables.find(table => table.name === 'Table1'))
            const idColumnDefinition = columns.find(column => column.name === 'Id')
            assert.ok(idColumnDefinition)
            assert.strictEqual(idColumnDefinition.type, 'TEXT')
            assert.strictEqual(idColumnDefinition.notnull, 1)
            assert.strictEqual(idColumnDefinition.dflt_value, null)
            assert.strictEqual(idColumnDefinition.pk, 1)
        })

        it('Wenn eine Tabelle bereits existiert, passiert nichts weiter.', async () => {
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            // Datenbank vorbereiten
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL);`);
            // Schema aktualisieren
            await supertest(expressApplication.app).patch(`/api/database/testdatabase`).send({
                schema: {
                    Table1: {}
                }
            }).expect(200)
            // Prüfen, ob noch alles beim Alten ist
            const tables = database.prepare(`SELECT name FROM sqlite_schema WHERE type='table';`).all()
            assert.ok(tables.find(table => table.name === 'Table1'))
            const columns = database.prepare(`SELECT * FROM pragma_table_info('Table1');`).all()
            const idColumnDefinition = columns.find(column => column.name === 'Id')
            assert.ok(idColumnDefinition)
            assert.strictEqual(idColumnDefinition.type, 'TEXT')
            assert.strictEqual(idColumnDefinition.notnull, 1)
            assert.strictEqual(idColumnDefinition.dflt_value, null)
            assert.strictEqual(idColumnDefinition.pk, 1)
        })

        it('Wenn eine Spalte nicht existiert, wird sie angelegt.', async () => {
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            // Datenbank vorbereiten
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL);`);
            // Schema aktualisieren
            await supertest(expressApplication.app).patch(`/api/database/testdatabase`).send({
                schema: {
                    Table1: {
                        Column1: 'TEXT',
                        Column2: 'INTEGER',
                    }
                }
            }).expect(200)
            // Prüfen, ob Spalten angelegt wurden
            const tables = database.prepare(`SELECT name FROM sqlite_schema WHERE type='table';`).all()
            assert.ok(tables.find(table => table.name === 'Table1'))
            const columns = database.prepare(`SELECT * FROM pragma_table_info('Table1');`).all()
            const column1Definition = columns.find(column => column.name === 'Column1')
            assert.ok(column1Definition)
            assert.strictEqual(column1Definition.type, 'TEXT')
            const column2Definition = columns.find(column => column.name === 'Column2')
            assert.ok(column2Definition)
            assert.strictEqual(column2Definition.type, 'INTEGER')
        })

        it('Wenn eine Spalte bereits existiert, wird sie nicht verändert.', async () => {
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            // Datenbank vorbereiten
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL, Column1 TEXT);`);
            // Schema aktualisieren
            await supertest(expressApplication.app).patch(`/api/database/testdatabase`).send({
                schema: {
                    Table1: {
                        Column1: 'INTEGER', // Versuch der Änderung
                        Column2: 'INTEGER',
                    }
                }
            }).expect(200)
            // Prüfen, ob Spalten unverändert bleiben
            const tables = database.prepare(`SELECT name FROM sqlite_schema WHERE type='table';`).all()
            assert.ok(tables.find(table => table.name === 'Table1'))
            const columns = database.prepare(`SELECT * FROM pragma_table_info('Table1');`).all()
            const column1Definition = columns.find(column => column.name === 'Column1')
            assert.ok(column1Definition)
            assert.strictEqual(column1Definition.type, 'TEXT') // Darf nicht verändert werden
            const column2Definition = columns.find(column => column.name === 'Column2')
            assert.ok(column2Definition)
            assert.strictEqual(column2Definition.type, 'INTEGER')
        })
    
    })

    describe('POST /api/database/:databaseName', () => {

        it('Wenn kein body gesendet wird, wird der HTTP Statuscode 400 zurückgegeben.', async() => {
            await supertest(expressApplication.app).post(`/api/database/testdatabase`).expect(400)
        })

        it('Wenn der body keine Eigenschaft "query" enthält, wird der HTTP Statuscode 400 zurückgegeben.', async() => {
            await supertest(expressApplication.app).post(`/api/database/testdatabase`).send({}).expect(400)
        })

        it('Wenn die Abfrage nicht mit "SELECT" beginnt, wird der HTTP Statuscode 400 zurückgegeben.', async() => {
            // insert, update, create, OBJEKT, FELD
            // INSERT
            await supertest(expressApplication.app).post(`/api/database/testdatabase`).send({ query: `INSERT INTO Table1 (Id, Column1) VALUES ('id1', 'text1')` }).expect(400)
            // UPDATE
            await supertest(expressApplication.app).post(`/api/database/testdatabase`).send({ query: `UPDATE Table1 SET Column1='text1' WHERE Id='id1'` }).expect(400)
            // CREATE
            await supertest(expressApplication.app).post(`/api/database/testdatabase`).send({ query: `CREATE TABLE Table2 (Id TEXT PRIMARY KEY NOT NULL, Column1 Text)` }).expect(400)
            // query ist keine Zeichenkette
            await supertest(expressApplication.app).post(`/api/database/testdatabase`).send({ query: 42 }).expect(400)
            await supertest(expressApplication.app).post(`/api/database/testdatabase`).send({ query: true }).expect(400)
            await supertest(expressApplication.app).post(`/api/database/testdatabase`).send({ query: {} }).expect(400)
            await supertest(expressApplication.app).post(`/api/database/testdatabase`).send({ query: [] }).expect(400)
        })

        it('Wenn die Abfrage ein Semikolon enthält, wird der HTTP Statuscode 400 zurückgegeben.', async() => {
            await supertest(expressApplication.app).post(`/api/database/testdatabase`).send({ query: `SELECT * FROM Table1; INSERT INTO Table1 (Id, Column1) VALUES ('id1', 'text1')` }).expect(400)
        })

        it('Bei Erfolg wird der HTTP Statuscode 200 zurückgegeben.', async() => {
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            // Datenbank vorbereiten
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL, Column1 TEXT);`);
            database.exec(`INSERT INTO Table1 (Id, Column1) VALUES ('id1', 'text1');`);
            // Abfrage absenden
            await supertest(expressApplication.app).post(`/api/database/testdatabase`).send({ query: `SELECT * FROM Table1` }).expect(200)
        })

        it('Bei Erfolg wird ein JSON mit dem Abfrageergebnis als Feld zurückgegeben.', async() => {
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            // Datenbank vorbereiten
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL, Column1 TEXT);`);
            database.exec(`INSERT INTO Table1 (Id, Column1) VALUES ('id1', 'text1');`);
            database.exec(`INSERT INTO Table1 (Id, Column1) VALUES ('id2', 'text2');`);
            // Abfrage absenden
            const response = await supertest(expressApplication.app).post(`/api/database/testdatabase`).send({ query: `SELECT * FROM Table1 ORDER BY Id` })
            assert.ok(response.body)
            assert.ok(Array.isArray(response.body))
            assert.strictEqual(response.body.length, 2)
            assert.strictEqual(response.body[0].Id, 'id1')
            assert.strictEqual(response.body[0].Column1, 'text1')
            assert.strictEqual(response.body[1].Id, 'id2')
            assert.strictEqual(response.body[1].Column1, 'text2')
        })

        it('Wenn die Abfrage nur einen Eintrag enthält, wird trotzdem ein Feld zurückgegeben.', async() => {
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            // Datenbank vorbereiten
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL, Column1 TEXT);`);
            database.exec(`INSERT INTO Table1 (Id, Column1) VALUES ('id1', 'text1');`);
            // Abfrage absenden
            const response = await supertest(expressApplication.app).post(`/api/database/testdatabase`).send({ query: `SELECT * FROM Table1 ORDER BY Id` })
            assert.ok(response.body)
            assert.ok(Array.isArray(response.body))
            assert.strictEqual(response.body.length, 1)
            assert.strictEqual(response.body[0].Id, 'id1')
            assert.strictEqual(response.body[0].Column1, 'text1')
        })

        it('Wenn die Abfrage kein Ergebnis enthält, wird ein leeres Feld zurückgegeben.', async() => {
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            // Datenbank vorbereiten
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL, Column1 TEXT);`);
            // Abfrage absenden
            const response = await supertest(expressApplication.app).post(`/api/database/testdatabase`).send({ query: `SELECT * FROM Table1 ORDER BY Id` })
            assert.ok(response.body)
            assert.ok(Array.isArray(response.body))
            assert.strictEqual(response.body.length, 0)
        })
        
    })

})
