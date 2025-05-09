export default (arrange) => {

    // Benutzer auflisten
    arrange.webServer.get('/api/users/listusers', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('USERS_ADMINISTRATION_USER')) return response.sendStatus(403)
        // Benutzertabelle öffnen
        const usersTable = arrange.database['users/users']
        const userList = usersTable.entries().map(([userId, user]) => {
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