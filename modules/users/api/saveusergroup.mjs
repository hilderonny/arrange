import { randomUUID } from 'node:crypto'

export default function (arrange) {

    // Benutzergruppe speichern oder anlegen, es wird immer der vollständige Benutzergruppendatensatz erwartet
    arrange.webServer.post('/api/users/saveusergroup', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('USERS_ADMINISTRATION_USER')) return response.sendStatus(401)
        // Benutzergruppentabelle öffnen
        const usergroupsTable = arrange.database['users/usergroups']
        // Benutzergruppendatensatz vorbereiten, immer from scratch
        const usergroupFromRequest = request.body
        const usergroupId = usergroupFromRequest.id || randomUUID()
        const usergroup = usergroupsTable[usergroupId] || {} // Wenn Benutzergruppe noch nicht existiert, dann neu anlegen
        // Daten einzeln aus Request übernehmen
        usergroup.name = usergroupFromRequest.name
        usergroup.permissionids = usergroupFromRequest.permissionids
        // Benutzergruppe speichern
        usergroupsTable[usergroupId] = usergroup
        usergroupsTable.save()
        // Rückgabe zusammenbasteln
        const usergroupToReturn = JSON.parse(JSON.stringify(usergroup))
        usergroupToReturn.id = usergroupId
        response.send(usergroupToReturn)
    })

}