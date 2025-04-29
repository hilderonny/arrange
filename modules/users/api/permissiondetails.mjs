export default (arrange) => {

    // Berechtigungsdetails zurück geben
    arrange.webServer.get('/api/users/permissiondetails/:permission_id', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('PERMISSION_ADMINISTRATION_USER')) return response.sendStatus(401)
        // Berechtigungstabelle öffnen
        const permissionsTable = arrange.database['users/permissions']
        // Berechtigung laden
        const permissionId = request.params.permission_id
        const permission = permissionsTable[permissionId]
        // Berechtigung nicht gefunden
        if (!permission) return response.sendStatus(404)
        // Rückgabe zusammenbasteln
        const permissionToReturn = {
            id: permissionId,
            name: permission.name
        }
        response.send(permissionToReturn)
    })

}