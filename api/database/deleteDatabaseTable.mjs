import databaseUtils from '../../utils/databaseUtils.mjs'

/**
 * Datenbanktabelle löschen
 */
export default async function(request, response) {
    try {
        const database = await databaseUtils.loadDatabase(request.params.databaseName)
        const query = database.prepare(`DROP TABLE IF EXISTS ${request.params.tableName};`)
        query.run()
        response.sendStatus(200)
    } catch {
        response.status(500).send('Cannot delete database table')
    }
}
