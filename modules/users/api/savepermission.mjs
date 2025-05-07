export default function (arrange) {

    // Berechtigung speichern, es wird immer der vollständige Bertechtigungsdatensatz erwartet
    arrange.webServer.post('/api/users/savepermission', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('PERMISSION_ADMINISTRATION_USER')) return response.sendStatus(401)
        // Id muss übergeben worden sein
        const permissionId = request.body.id
        if (!permissionId) return response.sendStatus(404)
        // Berechtigungstabelle öffnen
        const permissionsTable = arrange.database['users/permissions']
        // Berechtigung in Datenbank suchen
        const permission = permissionsTable[permissionId]
        if (!permission) return response.sendStatus(404)
        // Datensatz vorbereiten, immer from scratch
        const permissionFromRequest = request.body
        // Daten einzeln aus Request übernehmen
        permission.name = permissionFromRequest.name
        // Berechtigung speichern
        permissionsTable[permissionId] = permission
        permissionsTable.save()
        // Rückgabe zusammenbasteln
        const permissionToReturn = JSON.parse(JSON.stringify(permission))
        permissionToReturn.id = permissionId
        response.send(permissionToReturn)
    })

}