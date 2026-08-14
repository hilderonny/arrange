import databaseUtils from '../../utils/databaseUtils.mjs'

/**
 * Datenbankschema aktualisieren
 */
export default async function(request, response) {
    if (!request.body?.schema) {
        return response.sendStatus(400)
    }
    try {
        const database = await databaseUtils.loadDatabase(request.params.databaseName)
        // Erst mal alle Tabellen anlegen, damit sie referenziert werden können
        for (const tableName of Object.keys(request.body.schema)) {
            const createTableStatement = `CREATE TABLE IF NOT EXISTS ${tableName} (Id TEXT PRIMARY KEY NOT NULL) STRICT;`
            database.exec(createTableStatement)
        }
        // Nochmal drüber iterieren und die Spalten aktualisieren
        for (const [ tableName, tableDefinition ] of Object.entries(request.body.schema)) {
            for (const [ columnName, columnDefinition ] of Object.entries(tableDefinition)) {
                // Spalte nur erstellen, wenn sie noch nicht existiert
                if (database.prepare(`SELECT COUNT(*) AS columnCount FROM pragma_table_info('${tableName}') WHERE name='${columnName}';`).get().columnCount < 1) {
                    const updateStatement = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition};`
                    database.exec(updateStatement)
                }
            }
        }
        response.sendStatus(200)
    } catch {
        response.status(500).send('Cannot update database')
    }
}
