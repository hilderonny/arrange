export default (arrange) => {

    // Berechtigung löschen
    arrange.webServer.delete('/api/users/deletepermission/:permission_id', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('PERMISSION_ADMINISTRATION_USER')) return response.sendStatus(401)
        const permissionId = request.params.permission_id
        // Berechtigungstabelle öffnen
        const permissionsTable = arrange.database['users/permissions']
        if (permissionsTable[permissionId]) {
            delete permissionsTable[permissionId]
            // Eventuell vorhandene Verweise werden ignoriert. Darum müssen sich die Teile kümmern, die die Verweise benutzen
            permissionsTable.save()
        }
        response.sendStatus(200)
    })

}