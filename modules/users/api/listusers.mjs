function createListUsersApi(arrange) {

    // Benutzer auflisten
    arrange.webServer.get('/api/users/listusers', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('PERMISSION_ADMINISTRATION_USER')) return response.sendStatus(401)
        // Benutzerdatenbank öffnen
        const usersTable = arrange.database['users/users']
        const userList = usersTable.entries().map(kvp => { return {
            id: kvp[0],
            name: kvp[1].name
        }})
        response.send(userList)
    })

}

export { createListUsersApi }