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
        if (database) {
            database.close()
        }
        expressApplication.shutDown()
    })

    describe('PATCH /api/database/:databasename', () => {

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
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL)`);
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
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL)`);
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
            database.exec(`CREATE TABLE Table1 (Id TEXT PRIMARY KEY NOT NULL, Column1 TEXT)`);
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

})
