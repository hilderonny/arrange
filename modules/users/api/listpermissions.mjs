export default (arrange) => {

    // Benutzer auflisten
    arrange.webServer.get('/api/users/listpermissions', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('USERS_ADMINISTRATION_USER')) return response.sendStatus(401)
        // Berechtigungstabelle öffnen
        const permissionsTable = arrange.database['users/permissions']
        const permissionList = permissionsTable.entries().map(([permissionId, permission]) => { 
            return {
                id: permissionId,
                name: permission.name,
                icon: './images/unlock.png'
            }
        })
        // Liste alphabetisch sortieren
        permissionList.sort((a, b) => a.name.localeCompare(b.name))
        response.send(permissionList)
    })

}