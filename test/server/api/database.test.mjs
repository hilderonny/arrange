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
            { '/': './test/html/root' }, // htmlPaths
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
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL) STRICT;`);
            // Abfrage ausführen
            await supertest(expressApplication.app).delete(`/api/database/testdatabase/notexistingtable`).expect(200)
        })

        it('Die angegebene Tabelle wird gelöscht.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL, Column1 TEXT) STRICT;`);
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
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL, Column1 TEXT) STRICT;`);
            database.exec(`CREATE TABLE Table2 (Id TEXT PRIMARY KEY NOT NULL, Table1Id TEXT REFERENCES Table1(Id) ON DELETE CASCADE) STRICT;`);
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
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL) STRICT;`);
            // Abfrage ausführen
            await supertest(expressApplication.app).delete(`/api/database/testdatabase/notexistingtable/id1`).expect(200)
        })

        it('Wenn kein Datensatz mit der gegebenen Id existiert, passiert nichts weiter und es wird der HTTP Statuscode 200 zurückgegeben.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL) STRICT;`);
            // Abfrage ausführen
            await supertest(expressApplication.app).delete(`/api/database/testdatabase/Table1/id1`).expect(200)
        })

        it('Der angegebene Datensatz wird gelöscht.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL, Column1 TEXT) STRICT;`);
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
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL, Column1 TEXT) STRICT;`);
            database.exec(`CREATE TABLE Table2 (Id TEXT PRIMARY KEY NOT NULL, Table1Id TEXT REFERENCES Table1(Id) ON DELETE CASCADE) STRICT;`);
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
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL) STRICT;`);
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
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL) STRICT;`);
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
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL, Column1 TEXT) STRICT;`);
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

    describe('PATCH /api/database/:databaseName/:tableName/:recordId', () => {

        it('Wenn kein Body mitgesendet wird, wird HTTP Statuscode 400 zurückgegeben.', async () => {
            await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).expect(400)
        })

        it('Wenn die angegebene Tabelle nicht existiert, wird HTTP Statuscode 400 zurückgegeben.', async () => {
            await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: {} }).expect(400)
        })

        it('Wenn beim Erstellen eine übergebene Spalte nicht existiert, wird HTTP Statuscode 400 zurückgegeben.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY, Column1 TEXT) STRICT;`);
            // Abfrage absenden
            await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: { Unknowncolumn: 'text' } }).expect(400)
        })

        it('Wenn beim Aktualisieren eine übergebene Spalte nicht existiert, wird HTTP Statuscode 400 zurückgegeben.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY, Column1 TEXT) STRICT;`);
            database.exec(`INSERT INTO Table1 (Id, Column1) VALUES ('id1', 'text1');`);
            // Abfrage absenden
            await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: { Unknowncolumn: 'text' } }).expect(400)
        })

        it('Wenn beim Erstellen ein inkompatibler Spaltenwert übergeben wird, wird HTTP Statuscode 400 zurückgegeben.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY, Column1 INTEGER) STRICT;`);
            // Abfrage absenden
            await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: { Column1: 'text' } }).expect(400)
        })

        it('Wenn beim Aktualisieren ein inkompatibler Spaltenwert übergeben wird, wird HTTP Statuscode 400 zurückgegeben.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY, Column1 INTEGER) STRICT;`);
            database.exec(`INSERT INTO Table1 (Id, Column1) VALUES ('id1', 42);`);
            // Abfrage absenden
            await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: { Column1: 'text' } }).expect(400)
        })

        it('Wenn es keinen Record mit der gegebenen Id gibt, wird einer erstellt.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY, Column1 TEXT) STRICT;`);
            // Abfrage absenden
            await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: { Column1: 'text1' } }).expect(200)
            // Datenbank überprüfen
            const record = database.prepare(`SELECT * FROM Table1 WHERE Id='id1';`).get()
            assert.ok(record)
            assert.strictEqual(record.Column1, 'text1')
        })

        it('Wenn es keinen Record mit der gegebenen Id gibt und keine Felder mitgeschickt werden, wird einer mit leeren Feldern erstellt.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY, Column1 TEXT) STRICT;`);
            // Abfrage absenden
            await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: {} }).expect(200)
            // Datenbank überprüfen
            const record = database.prepare(`SELECT * FROM Table1 WHERE Id='id1';`).get()
            assert.ok(record)
            assert.strictEqual(record.Column1, null)
        })

        it('Wenn es bereits einen Record mit der gegebenen Id gibt, wird dieser überschrieben.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY, Column1 TEXT) STRICT;`);
            database.exec(`INSERT INTO Table1 (Id, Column1) VALUES ('id1', 'text1');`);
            // Abfrage absenden
            await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: { Column1: 'newtext' } }).expect(200)
            // Datenbank überprüfen
            const record = database.prepare(`SELECT * FROM Table1 WHERE Id='id1';`).get()
            assert.ok(record)
            assert.strictEqual(record.Column1, 'newtext')
        })

        it('Wenn es bereits einen Record mit der gegebenen Id gibt, aber keine Felder gesendet werden, passiert nichts weiter.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY, Column1 TEXT) STRICT;`);
            database.exec(`INSERT INTO Table1 (Id, Column1) VALUES ('id1', 'text1');`);
            // Abfrage absenden
            await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: {} }).expect(200)
            // Datenbank überprüfen
            const record = database.prepare(`SELECT * FROM Table1 WHERE Id='id1';`).get()
            assert.ok(record)
            assert.strictEqual(record.Column1, 'text1')
        })

        it('Null - Werte werden beim Erstellen als NULL in der Datenbank gespeichert.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY, Column1 TEXT) STRICT;`);
            // Abfrage absenden
            await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: { Column1: null } }).expect(200)
            // Datenbank überprüfen
            const record = database.prepare(`SELECT * FROM Table1 WHERE Id='id1';`).get()
            assert.ok(record)
            assert.strictEqual(record.Column1, null)
        })

        it('Null - Werte werden beim Aktualisieren als NULL in der Datenbank gespeichert.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY, Column1 TEXT) STRICT;`);
            database.exec(`INSERT INTO Table1 (Id, Column1) VALUES ('id1', 'text1');`);
            // Abfrage absenden
            await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: { Column1: null } }).expect(200)
            // Datenbank überprüfen
            const record = database.prepare(`SELECT * FROM Table1 WHERE Id='id1';`).get()
            assert.ok(record)
            assert.strictEqual(record.Column1, null)
        })

        it('Undefined - Werte werden beim Erstellen als NULL in der Datenbank gespeichert.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY, Column1 TEXT) STRICT;`);
            // Abfrage absenden
            await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: { Column1: undefined } }).expect(200)
            // Datenbank überprüfen
            const record = database.prepare(`SELECT * FROM Table1 WHERE Id='id1';`).get()
            assert.ok(record)
            assert.strictEqual(record.Column1, null)
        })

        it('Undefined - Werte werden beim Aktualisieren ignoriert, da sie nicht geparst werden.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY, Column1 TEXT) STRICT;`);
            database.exec(`INSERT INTO Table1 (Id, Column1) VALUES ('id1', 'text1');`);
            // Abfrage absenden
            await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: { Column1: undefined } }).expect(200)
            // Datenbank überprüfen
            const record = database.prepare(`SELECT * FROM Table1 WHERE Id='id1';`).get()
            assert.ok(record)
            assert.strictEqual(record.Column1, 'text1')
        })

        it('Boolean - Werte werden beim Erstellen als Zahlen in der Datenbank gespeichert.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY, Column1 INTEGER) STRICT;`);
            // Abfrage absenden
            await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: { Column1: true } }).expect(200)
            await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id2`).send({ fields: { Column1: false } }).expect(200)
            // Datenbank überprüfen
            const record1 = database.prepare(`SELECT * FROM Table1 WHERE Id='id1';`).get()
            assert.ok(record1)
            assert.strictEqual(record1.Column1, 1)
            const record2 = database.prepare(`SELECT * FROM Table1 WHERE Id='id2';`).get()
            assert.ok(record2)
            assert.strictEqual(record2.Column1, 0)
        })

        it('Boolean - Werte werden beim Aktualisieren als Zahlen in der Datenbank gespeichert.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY, Column1 INTEGER) STRICT;`);
            database.exec(`INSERT INTO Table1 (Id, Column1) VALUES ('id1', 0);`);
            database.exec(`INSERT INTO Table1 (Id, Column1) VALUES ('id2', 1);`);
            // Abfrage absenden
            await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: { Column1: true } }).expect(200)
            await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id2`).send({ fields: { Column1: false } }).expect(200)
            // Datenbank überprüfen
            const record1 = database.prepare(`SELECT * FROM Table1 WHERE Id='id1';`).get()
            assert.ok(record1)
            assert.strictEqual(record1.Column1, 1)
            const record2 = database.prepare(`SELECT * FROM Table1 WHERE Id='id2';`).get()
            assert.ok(record2)
            assert.strictEqual(record2.Column1, 0)
        })

        it('Zahlen werden beim Erstellen als Zahlen in der Datenbank gespeichert.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY, Column1 INTEGER) STRICT;`);
            // Abfrage absenden
            await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: { Column1: 42 } }).expect(200)
            // Datenbank überprüfen
            const record = database.prepare(`SELECT * FROM Table1 WHERE Id='id1';`).get()
            assert.ok(record)
            assert.strictEqual(record.Column1, 42)
        })

        it('Zahlen werden beim Aktualisieren als Zahlen in der Datenbank gespeichert.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY, Column1 INTEGER) STRICT;`);
            database.exec(`INSERT INTO Table1 (Id, Column1) VALUES ('id1', 42);`);
            // Abfrage absenden
            await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: { Column1: 67 } }).expect(200)
            // Datenbank überprüfen
            const record1 = database.prepare(`SELECT * FROM Table1 WHERE Id='id1';`).get()
            assert.ok(record1)
            assert.strictEqual(record1.Column1, 67)
        })

        it('Zeichenketten werden beim Erstellen als Zeichenketten in der Datenbank gespeichert.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY, Column1 TEXT) STRICT;`);
            // Abfrage absenden
            await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: { Column1: 'text1' } }).expect(200)
            // Datenbank überprüfen
            const record = database.prepare(`SELECT * FROM Table1 WHERE Id='id1';`).get()
            assert.ok(record)
            assert.strictEqual(record.Column1, 'text1')
        })

        it('Zeichenketten werden beim Aktualisieren als Zeichenketten in der Datenbank gespeichert.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY, Column1 TEXT) STRICT;`);
            database.exec(`INSERT INTO Table1 (Id, Column1) VALUES ('id1', 'beforetext');`);
            // Abfrage absenden
            await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: { Column1: 'aftertext' } }).expect(200)
            // Datenbank überprüfen
            const record1 = database.prepare(`SELECT * FROM Table1 WHERE Id='id1';`).get()
            assert.ok(record1)
            assert.strictEqual(record1.Column1, 'aftertext')
        })

        it('Einfache Anführungszeichen werden beim Erstellen korrekt escaped.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY, Column1 TEXT) STRICT;`);
            // Abfrage absenden
            await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: { Column1: `singlequote: ' ` } }).expect(200)
            // Datenbank überprüfen
            const record = database.prepare(`SELECT * FROM Table1 WHERE Id='id1';`).get()
            assert.ok(record)
            assert.strictEqual(record.Column1, `singlequote: ' `)
        })

        it('Einfache Anführungszeichen werden beim Aktualisieren korrekt escaped.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY, Column1 TEXT) STRICT;`);
            database.exec(`INSERT INTO Table1 (Id, Column1) VALUES ('id1', 'beforetext');`);
            // Abfrage absenden
            await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: { Column1: `singlequote: ' ` } }).expect(200)
            // Datenbank überprüfen
            const record = database.prepare(`SELECT * FROM Table1 WHERE Id='id1';`).get()
            assert.ok(record)
            assert.strictEqual(record.Column1, `singlequote: ' `)
        })

        it('Doppelte Anführungszeichen werden beim Erstellen korrekt escaped.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY, Column1 TEXT) STRICT;`);
            // Abfrage absenden
            await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: { Column1: `doublequote: " ` } }).expect(200)
            // Datenbank überprüfen
            const record = database.prepare(`SELECT * FROM Table1 WHERE Id='id1';`).get()
            assert.ok(record)
            assert.strictEqual(record.Column1, `doublequote: " `)
        })

        it('Doppelte Anführungszeichen werden beim Aktualisieren korrekt escaped.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY, Column1 TEXT) STRICT;`);
            database.exec(`INSERT INTO Table1 (Id, Column1) VALUES ('id1', 'beforetext');`);
            // Abfrage absenden
            await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: { Column1: `doublequote: " ` } }).expect(200)
            // Datenbank überprüfen
            const record = database.prepare(`SELECT * FROM Table1 WHERE Id='id1';`).get()
            assert.ok(record)
            assert.strictEqual(record.Column1, `doublequote: " `)
        })

        it('Backticks werden beim Erstellen korrekt escaped.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY, Column1 TEXT) STRICT;`);
            // Abfrage absenden
            await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: { Column1: 'backtick: ` ' } }).expect(200)
            // Datenbank überprüfen
            const record = database.prepare(`SELECT * FROM Table1 WHERE Id='id1';`).get()
            assert.ok(record)
            assert.strictEqual(record.Column1, 'backtick: ` ')
        })

        it('Backticks werden beim Aktualisieren korrekt escaped.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY, Column1 TEXT) STRICT;`);
            database.exec(`INSERT INTO Table1 (Id, Column1) VALUES ('id1', 'beforetext');`);
            // Abfrage absenden
            await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: { Column1: 'backtick: ` ' } }).expect(200)
            // Datenbank überprüfen
            const record = database.prepare(`SELECT * FROM Table1 WHERE Id='id1';`).get()
            assert.ok(record)
            assert.strictEqual(record.Column1, 'backtick: ` ')
        })

        it('Nach dem Erstellen wird der gesamte Datensatz zurückgegeben.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY, Column1 TEXT, Column2 INTEGER, Column3 TEXT) STRICT;`);
            // Abfrage absenden
            const result = await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: { Column1: 'text1', Column2: 42 } }).expect(200)
            assert.ok(result)
            assert.ok(result.body)
            assert.strictEqual(result.body.Id, 'id1')
            assert.strictEqual(result.body.Column1, 'text1')
            assert.strictEqual(result.body.Column2, 42)
            assert.strictEqual(result.body.Column3, null)
        })

        it('Nach dem Aktualisieren wird der gesamte Datensatz zurückgegeben.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY, Column1 TEXT, Column2 INTEGER, Column3 TEXT) STRICT;`);
            database.exec(`INSERT INTO Table1 (Id, Column1, Column2, Column3) VALUES ('id1', 'beforetext', 42, 'oldtext');`);
            // Abfrage absenden
            const result = await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: { Column1: 'aftertext', Column2: 13 } }).expect(200)
            assert.ok(result)
            assert.ok(result.body)
            assert.strictEqual(result.body.Id, 'id1')
            assert.strictEqual(result.body.Column1, 'aftertext')
            assert.strictEqual(result.body.Column2, 13)
            assert.strictEqual(result.body.Column3, 'oldtext')
        })

        it('Wird beim Aktualisieren als Spalte Id mitgegeben, wird diese nicht aktualisiert.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY, Column1 TEXT) STRICT;`);
            database.exec(`INSERT INTO Table1 (Id, Column1) VALUES ('id1', 'text1');`);
            // Abfrage absenden
            const result = await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: { Id: 'neueId', Column1: 'neuertext' } }).expect(200)
            assert.ok(result)
            assert.ok(result.body)
            assert.strictEqual(result.body.Id, 'id1')
            assert.strictEqual(result.body.Column1, 'neuertext')
        })

        it('Wird beim Aktualisieren nur die Spalte Id mitgegeben, bleibt der Datensatz unverändert.', async () => {
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY, Column1 TEXT) STRICT;`);
            database.exec(`INSERT INTO Table1 (Id, Column1) VALUES ('id1', 'text1');`);
            // Abfrage absenden
            const result = await supertest(expressApplication.app).patch(`/api/database/testdatabase/Table1/id1`).send({ fields: { Id: 'neueId' } }).expect(200)
            assert.ok(result)
            assert.ok(result.body)
            assert.strictEqual(result.body.Id, 'id1')
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
            // INSERT
            await supertest(expressApplication.app).post(`/api/database/testdatabase`).send({ query: `INSERT INTO Table1 (Id, Column1) VALUES ('id1', 'text1')` }).expect(400)
            // UPDATE
            await supertest(expressApplication.app).post(`/api/database/testdatabase`).send({ query: `UPDATE Table1 SET Column1='text1' WHERE Id='id1'` }).expect(400)
            // CREATE
            await supertest(expressApplication.app).post(`/api/database/testdatabase`).send({ query: `CREATE TABLE Table2 (Id TEXT PRIMARY KEY NOT NULL, Column1 Text) STRICT` }).expect(400)
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
            // Datenbank vorbereiten
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL, Column1 TEXT) STRICT;`);
            database.exec(`INSERT INTO Table1 (Id, Column1) VALUES ('id1', 'text1');`);
            // Abfrage absenden
            await supertest(expressApplication.app).post(`/api/database/testdatabase`).send({ query: `SELECT * FROM Table1` }).expect(200)
        })

        it('Bei Erfolg wird ein JSON mit dem Abfrageergebnis als Feld zurückgegeben.', async() => {
            const absolutePath = path.resolve('./test/data/databases/testdatabase.sqlite')
            // Datenbank vorbereiten
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL, Column1 TEXT) STRICT;`);
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
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL, Column1 TEXT) STRICT;`);
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
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL, Column1 TEXT) STRICT;`);
            // Abfrage absenden
            const response = await supertest(expressApplication.app).post(`/api/database/testdatabase`).send({ query: `SELECT * FROM Table1 ORDER BY Id` })
            assert.ok(response.body)
            assert.ok(Array.isArray(response.body))
            assert.strictEqual(response.body.length, 0)
        })
        
    })

})
