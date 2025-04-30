export default (arrange) => {

    // Benutzer auflisten
    arrange.webServer.get('/api/users/listusers', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('PERMISSION_ADMINISTRATION_USER')) return response.sendStatus(401)
        // Benutzertabelle öffnen
        const usersTable = arrange.database['users/users']
        const userList = usersTable.entries().map(kvp => {
            const userId = kvp[0]
            const user = kvp[1]
            return {
                id: userId,
                name: user.name,
                usergroupids: user. usergroupids
            }
        })
        response.send(userList)
    })

}