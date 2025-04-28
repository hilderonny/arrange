function createListUsergroupsApi(arrange) {

    // Benutzer auflisten
    arrange.webServer.get('/api/users/listusergroups', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('PERMISSION_ADMINISTRATION_USER')) return response.sendStatus(401)
        // Benutzergruppendatenbank öffnen
        const usergroupsTable = arrange.database['users/usergroups']
        const usergroupList = usergroupsTable.entries().map(kvp => { return {
            id: kvp[0],
            name: kvp[1].name
        }})
        response.send(usergroupList)
    })

}

export { createListUsergroupsApi }