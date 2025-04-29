export default (arrange) => {

    // Benutzer auflisten
    arrange.webServer.get('/api/users/listusergroups', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('PERMISSION_ADMINISTRATION_USER')) return response.sendStatus(401)
        // Benutzergruppentabelle öffnen
        const usergroupsTable = arrange.database['users/usergroups']
        const usergroupList = usergroupsTable.entries().map(kvp => { return {
            id: kvp[0],
            name: kvp[1].name
        }})
        response.send(usergroupList)
    })

}