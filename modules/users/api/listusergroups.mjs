export default (arrange) => {

    // Benutzergruppen auflisten
    arrange.webServer.get('/api/users/listusergroups', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('USERS_ADMINISTRATION_USER')) return response.sendStatus(403)
        // Benutzergruppentabelle öffnen
        const usergroupsTable = arrange.database['users/usergroups']
        const usergroupList = usergroupsTable.entries().map(([usergroupId, usergroup]) => {
            return {
                id: usergroupId,
                name: usergroup.name,
                permissionids: usergroup.permissionids,
                icon: './images/group.png'
            }
        })
        // Liste alphabetisch sortieren
        usergroupList.sort((a, b) => a.name.localeCompare(b.name))
        response.send(usergroupList)
    })

}