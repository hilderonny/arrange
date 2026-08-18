import fs from 'node:fs'
import path from 'node:path/posix'
import sqlite from 'node:sqlite'

import config from '../config.mjs'

const databases = {}

export default {

    deleteDatabase(databaseName) {
        const database = databases[databaseName]
        if (database) {
            if (database.isOpen) {
                database.close()
            }
            delete databases[databaseName]
        }
        const fullPath = path.resolve(config.databasesPath, databaseName + '.sqlite')
        if (fs.existsSync(fullPath)) {
            fs.rmSync(fullPath, { force: true })
        }
    },

    async loadDatabase(databaseName) {
        let database = databases[databaseName]
        if (!database) {
            const absolutePath = path.resolve(config.databasesPath, databaseName + '.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            databases[databaseName] = database
        }
        return database
    },

    async updateDatabaseSchema(databaseName, schema) {
        const database = await this.loadDatabase(databaseName)
        // Erst mal alle Tabellen anlegen, damit sie referenziert werden können
        for (const tableName of Object.keys(schema)) {
            const createTableStatement = `CREATE TABLE IF NOT EXISTS ${tableName} (Id TEXT PRIMARY KEY NOT NULL) STRICT;`
            database.exec(createTableStatement)
        }
        // Nochmal drüber iterieren und die Spalten aktualisieren
        for (const [ tableName, tableDefinition ] of Object.entries(schema)) {
            for (const [ columnName, columnDefinition ] of Object.entries(tableDefinition)) {
                // Spalte nur erstellen, wenn sie noch nicht existiert
                if (database.prepare(`SELECT COUNT(*) AS columnCount FROM pragma_table_info('${tableName}') WHERE name='${columnName}';`).get().columnCount < 1) {
                    const updateStatement = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition};`
                    database.exec(updateStatement)
                }
            }
        }
    },

}
