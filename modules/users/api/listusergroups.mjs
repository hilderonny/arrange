export default (arrange) => {

    // Benutzer auflisten
    arrange.webServer.get('/api/users/listusergroups', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('PERMISSION_ADMINISTRATION_USER')) return response.sendStatus(401)
        // Benutzergruppentabelle öffnen
        const usergroupsTable = arrange.database['users/usergroups']
        const usergroupList = usergroupsTable.entries().map(kvp => {
            const usergroupId = kvp[0]
            const usergroup = kvp[1]
            return {
                id: usergroupId,
                name: usergroup.name,
                permissionids: usergroup.permissionids
            }
        })
        response.send(usergroupList)
    })

}