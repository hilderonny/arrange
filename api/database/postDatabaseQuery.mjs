import databaseUtils from '../../utils/databaseUtils.mjs'

/**
 * Informationen aus Datenbank holen.
 * Es sind nur SELECT-Abfragen erlaubt und es dürfen keine Semikola (Anweisungstrenner) enthalten sein
 */
export default async function(request, response) {
    try {
        const database = await databaseUtils.loadDatabase(request.params.databaseName)
        // Abfrage durchführen
        const query = request.body?.query?.toString()
        if (!query || !query.toLowerCase().startsWith('select') || query.includes(';')) {
            return response.sendStatus(400)
        }
        const result = database.prepare(query).all()
        // Ergebnisse als JSON zurück geben
        response.json(result)
    } catch {
        response.status(500).send('Cannot query database')
    }
}
