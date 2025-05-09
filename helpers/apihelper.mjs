import { createHash, randomUUID } from 'node:crypto'
import fs from 'node:fs'

// TODO: createDeleteApi dokumentieren
function createDeleteApi(arrange, table_name, api_url, required_permissions) {

    arrange.log('[APIHELPER] Erstelle Delete-API %s.', api_url)
    
    arrange.webServer.delete(api_url, async(request, response) => {
        // Benutzerberechtigung prüfen
        if (required_permissions) {
            if (!request.user || !request.user.hasPermission(required_permissions)) return response.sendStatus(403)
        }
        const recordId = request.body.id
        const table = arrange.database[table_name]
        const recordIndex = table.findIndex(record => record.id === recordId)
        if (recordIndex >= 0) {
            table.splice(recordIndex, 1)
            table.save()
        }
        // Einfach immer 200 senden, auch wenn Datensatz gar nicht existiert hat
        response.sendStatus(200)
    })

}

// TODO: createListApi dokumentieren
function createListApi(arrange, table_name, api_url, required_permissions) {

    arrange.log('[APIHELPER] Erstelle List-API %s.', api_url)

    arrange.webServer.get(api_url, async(request, response) => {
        // Benutzerberechtigung prüfen
        if (required_permissions) {
            if (!request.user || (!request.user.hasPermission(required_permissions))) return response.sendStatus(403)
        }
        // Tabelle öffnen
        const table = arrange.database[table_name]
        // Rückgabeliste erstellen, Passwörter herausfiltern
        const tableToReturn = JSON.parse(JSON.stringify(table))
        tableToReturn.forEach(record => { delete record.password })
        response.send(tableToReturn)
    })

}

// TODO: createSaveApi dokumentieren
function createSaveApi(arrange, table_name, api_url, required_permissions) {

    arrange.log('[APIHELPER] Erstelle Save-API %s.', api_url)

    arrange.webServer.post(api_url, async(request, response) => {
        // Benutzerberechtigung prüfen
        if (required_permissions) {
            if (!request.user || !request.user.hasPermission(required_permissions)) return response.sendStatus(403)
        }
        const recordId = request.body.id
        const table = arrange.database[table_name]
        let record
        if (recordId) {
            // Datensatz laden, falls Id angegeben ist
            record = table.get(recordId)
            if (!record) return response.sendStatus(404)
        } else {
            // Id nicht angegeben, Datensatz erstellen
            record = { id: randomUUID() }
            table.push(record)
        }
        // Werte einzeln übernehmen
        for (const [key, value] of Object.entries(request.body)) {
            // Id überspringen, sonst wird die leer
            if (key === 'id') {
                continue
            } else if (key === 'password') {
                if (value) { // Passwort nur aktualisieren, wenn angegeben
                    // Passwörter verschlüsseln
                    record[key] = createHash('sha256').update(value).digest('hex')
                }
            } else {
                record[key] = value
            }
        }
        // Tabelle speichern
        table.save()
        // Rückgabe zusammenbasteln
        const recordToReturn = JSON.parse(JSON.stringify(record))
        delete recordToReturn.password
        response.send(recordToReturn)
    })

}

// TODO: loadApis dokumentieren
async function loadApis(arrange, api_directory) {

        for (const fileName of fs.readdirSync(api_directory)) {
            if (fileName.endsWith('.mjs')) {
                arrange.log('[APIHELPER] Lade API %s.', fileName)
                const api = await import(`../${api_directory}/${fileName}`)
                api.default(arrange)
            }
        }
    
}

export { createDeleteApi, createListApi, createSaveApi, loadApis }