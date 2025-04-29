export default (arrange) => {

    // Benutzer auflisten
    arrange.webServer.get('/api/users/listpermissions', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('PERMISSION_ADMINISTRATION_USER')) return response.sendStatus(401)
        // Berechtigungstabelle öffnen
        const permissionsTable = arrange.database['users/permissions']
        const permissionList = permissionsTable.entries().map(kvp => { return {
            id: kvp[0],
            name: kvp[1].name
        }})
        response.send(permissionList)
    })

}