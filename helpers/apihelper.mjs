import { createHash, randomUUID } from 'node:crypto'
import fs from 'node:fs'

/**
 * Erstellt eine API, über die Objekte in der angegebenen Tabelle gelöscht werden können
 * Beispielaufruf:
 * ```
 * const appToDelete = { id: 'HOME_HOME' }
 * const response = await fetch('/api/home/deleteapp', {
 *     method: 'DELETE',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(appToDelete)
 * })
 * ```
 * 
 * @param {object} arrange Verweis auf arrange Instanz
 * @param {string} table_name Tabellenname
 * @param {string} api_url URL, an dem die API lauschen soll
 * @param {string[]} required_permissions Liste von Berechtigungen. Mindestens eine davon muss der Benutzer haben, um die API benutzen zu dürfen.
 */
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

/**
 * Erstellt eine API, über die alle Objekte der gegebenen Tabelle aufgelistet werden können.
 * Beispielaufruf:
 * ```
 * const response = await fetch('/api/users/listpermissions')
 * response.json() = [
 *     { id: 'permissionId', name: 'Berechtigungsbezeichnung' }
 * ]
 * ```
 * @param {object} arrange Verweis auf arrange Instanz
 * @param {string} table_name Tabellenname
 * @param {string} api_url URL, an dem die API lauschen soll
 * @param {string[]} required_permissions Liste von Berechtigungen. Mindestens eine davon muss der Benutzer haben, um die API benutzen zu dürfen.
 */
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

/**
 * Erstellt eine API, die Objekte einer bestimmten Tabelle nur dann auflistet, wenn der angemeldete Benutzer die Berechtigung für den
 * jeweiligen Datensatz hat. Dazu muss jeder Datensatz ein Feld `permissionid` haben, in dem die Id der notwendigen Berechtigung enthalten ist.
 * Beispielaufruf:
 * ```
 * const response = await fetch('/api/home/listapps')
 * response.json() = [
 *     { id: 'HOME_HOME', name: 'Benutzerverwaltung', icon: '/modules/users/images/group.png', url: '/modules/users/uermanagement.html', index: 100, isdefault: true, permissionid: 'USERS_ADMINISTRATION_USER' }
 * ]
 * ```
 * 
 * @param {object} arrange Verweis auf arrange Instanz
 * @param {string} table_name Tabellenname
 * @param {string} api_url URL, an dem die API lauschen soll
 */
function createListForPermissionApi(arrange, table_name, api_url) {

    arrange.log('[APIHELPER] Erstelle List-For-Permission-API %s.', api_url)
    
    // Liste von Apps für Navigation
    arrange.webServer.get(api_url, async(request, response) => {
        const table = arrange.database[table_name]
        // Tabelle filtern und nur die zurück geben, bei denen entweder keine permissionids angegeben sind,
        // oder bei denen der angemeldete Benutzer über diese Berechtigungen verfügt
        const filteredTable = table.filter(record => {
            if (!record.permissionid) return true // Datensätze ohne notwendige Berechtigungen sind für alle (auch ohne Anmeldung) zu sehen
            if (!request.user) return false // Datensätze, die Berechtigungen haben, erfordern einen angemeldeten Benutzer
            return request.user.hasPermission([record.permissionid])
        })
        // Rückgabeliste erstellen, Passwörter herausfiltern
        const tableToReturn = JSON.parse(JSON.stringify(filteredTable))
        tableToReturn.forEach(record => { delete record.password })
        response.send(tableToReturn)
    })

}

/**
 * Erstellt eine API, mit welcher Objekte der angegebenen Tabelle gespeichert oder angelegt werden können.
 * Wenn der Datensatz kein Feld `id` enthält, wird ein neuer Datensatz angelegt und eine Id generiert.
 * Der Datensatz wird anschließend vollständig zurück gegeben, also auch mit generierter Id.
 * Beispielaufruf:
 * ```
 * const usergroupToSave = {
 *     id: 'usergroupId', 
 *     name: 'Gruppenname',
 *     permissionids: [ 'USERS_ADMINISTRATION_USER' ]
 * }
 * const response = await fetch('/api/users/saveusergroup', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(usergroupToSave)
 * })
 * ```
 * @param {object} arrange Verweis auf arrange Instanz
 * @param {string} table_name Tabellenname
 * @param {string} api_url URL, an dem die API lauschen soll
 * @param {string[]} required_permissions Liste von Berechtigungen. Mindestens eine davon muss der Benutzer haben, um die API benutzen zu dürfen.
 */
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

/**
 * Lädt alle APIs in einem bestimmten Verzeichnis.
 * Eine API muss sich in einer Date mit der Endung `mjs` befinden und einen default-Export bereitstellen.
 * Beispielimplementierung:
 * ```
 * export default (arrange) => {
 *     arrange.webServer.post('/api/users/login', async(request, response) => {
 *         // Mach was
 *         response.sendStatus(200)
 *     })
 * }
 * ```
 * @param {object} arrange Verweis auf arrange Instanz
 * @param {string} api_directory Verzeichnis, in welchem sich die APIs befinden
 */
async function loadApis(arrange, api_directory) {

        for (const fileName of fs.readdirSync(api_directory)) {
            if (fileName.endsWith('.mjs')) {
                arrange.log('[APIHELPER] Lade API %s.', fileName)
                const api = await import(`file://${api_directory}/${fileName}`)
                api.default(arrange)
            }
        }
    
}

export { createDeleteApi, createListApi, createListForPermissionApi, createSaveApi, loadApis }