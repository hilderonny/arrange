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
                id: userId, // Id wird dynamisch angehängt, landet aber nicht im Datensatz in der Datenbank
                name: user.name,
                icon: './images/user.png', // Icon wird für Listenansicht dynamisch generiert, landet aber nicht in der Datenbank
                usergroupids: user. usergroupids
            }
        })
        // Benutzerliste alphabetisch sortieren
        userList.sort((a, b) => a.name.localeCompare(b.name))
        response.send(userList)
    })

}