import databaseUtils from '../../utils/databaseUtils.mjs'

/**
 * Speichert einen Datensatz in der Datenbank
 */
export default async function(request, response) {
    if (!request.body?.fields) {
        return response.sendStatus(400)
    }
    try {
        const database = await databaseUtils.loadDatabase(request.params.databaseName)
        // Prüfen, ob Tabelle existiert
        const existingTable = database.prepare(`SELECT name FROM sqlite_schema WHERE type='table' AND name='${request.params.tableName}';`).get()
        if (!existingTable) {
            return response.sendStatus(400)
        }
        // Existierende Spalten laden
        const columns = database.prepare(`SELECT name FROM pragma_table_info('${request.params.tableName}');`).all().map(column => column.name)
        // Prüfen, ob Datensatz bereits existiert
        if (database.prepare(`SELECT COUNT(*) AS anzahl FROM ${request.params.tableName} WHERE Id='${request.params.recordId}';`).get().anzahl < 1) {
            // Existiert noch nicht, also neu anlegen
            const recordToCreate = request.body.fields
            // Existierende Spalten filtern
            for (const columnName of Object.keys(recordToCreate)) {
                if (!columns.includes(columnName)) {
                    delete recordToCreate[columnName]
                }
            }
            recordToCreate.Id = request.params.recordId
            const queryString = [
                'INSERT INTO ',
                request.params.tableName,
                ' (',
                Object.keys(recordToCreate).join(','),
                ') VALUES (',
                Object.values(recordToCreate).map(value => {
                    if (value === null) return 'NULL'
                    switch (typeof(value)) {
                        case 'undefined': return 'NULL'
                        case 'boolean': return value ? '1' : '0'
                        case 'number': return value
                        default: return `'${('' + value).toString().replaceAll(`'`, `''`)}'`
                    }
                }).join(','),
                ');'
            ].join('')
            const query = database.prepare(queryString)
            query.run()
        } else {
            // Existiert, also ggf. aktualisieren
            const recordToChange = request.body.fields
            // Id rausfiltern, diese darf nicht verändert werden
            delete recordToChange.Id
            // Existierende Spalten filtern
            for (const columnName of Object.keys(recordToChange)) {
                if (!columns.includes(columnName)) {
                    delete recordToChange[columnName]
                }
            }
            // Wenn keine Felder oder keine passenden gesendet werden, muss auch nicht aktualisiert werden
            if (Object.keys(recordToChange).length > 0) {
                const queryString = [
                    'UPDATE ',
                    request.params.tableName,
                    ' SET ',
                    Object.entries(recordToChange).map(([ columnName, value ]) => {
                        let setString = columnName + '='
                        if (value === null) {
                            setString += 'NULL'
                        } else {
                            switch (typeof(value)) {
                                case 'undefined': setString += 'NULL'; break
                                case 'boolean': setString += value ? '1' : '0'; break
                                case 'number': setString += value; break
                                default: setString += `'${('' + value).toString().replaceAll(`'`, `''`)}'`; break
                            }
                        }
                        return setString
                    }).join(', '),
                    ` WHERE Id='`,
                    request.params.recordId,
                    `';`
                ].join('')
                const query = database.prepare(queryString)
                query.run()
            }
        }
        // Vollständigen Datensatz zurück geben
        const record = database.prepare(`SELECT * FROM ${request.params.tableName} WHERE Id='${request.params.recordId}';`).get()
        response.json(record)
    } catch {
        response.status(500).send('Cannot save database record')
    }
}
