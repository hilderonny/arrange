import { randomUUID } from 'node:crypto'

export default (arrange) => {

    // Berechtigung speichern oder anlegen
    arrange.webServer.post('/api/users/savepermission', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('PERMISSION_ADMINISTRATION_USER')) return response.sendStatus(401)
        // Berechtigungstabelle öffnen
        const permissionsTable = arrange.database['users/permissions']
        // Berechtigung zum Speichern vorbereiten
        let permissionId = request.body.id
        const permission = {
            label: request.body.label
        }
        // Id generieren, wenn nicht angegeben
        if (!permissionId) {
            permissionId = randomUUID()
        }
        // Berechtigung speichern
        permissionsTable[permissionId] = permission
        permissionsTable.save()
        // Rückgabe zusammenbasteln
        const permissionToReturn = {
            id: permissionId,
            label: permission.label
        }
        response.send(permissionToReturn)
    })

}