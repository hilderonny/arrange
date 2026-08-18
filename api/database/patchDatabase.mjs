/**
 * Datenbankschema aktualisieren
 */
export default function(config, databaseUtils, userUtils) {

    return async function(request, response) {
        if (!request.body?.schema) {
            return response.sendStatus(400)
        }
        try {
            await databaseUtils.updateDatabaseSchema(request.params.databaseName, request.body.schema)
            response.sendStatus(200)
        } catch {
            response.status(500).send('Cannot update database')
        }
    }

}