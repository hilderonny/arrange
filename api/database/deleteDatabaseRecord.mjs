/**
 * Datensatz löschen
 */
export default function(config, databaseUtils, userUtils) {

    return async function(request, response) {
        try {
            const database = await databaseUtils.loadDatabase(request.params.databaseName)
            const existingTable = database.prepare(`SELECT name FROM sqlite_schema WHERE type='table' AND name='${request.params.tableName}';`).get()
            if (existingTable) {
                const query = database.prepare(`DELETE FROM ${request.params.tableName} WHERE Id = '${request.params.recordId}';`)
                query.run()
            }
            response.sendStatus(200)
        } catch {
            response.status(500).send('Cannot delete database record')
        }
    }

}