export default (arrange) => {

    // Benutzer löschen
    arrange.webServer.delete('/api/users/deleteuser', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('USERS_ADMINISTRATION_USER')) return response.sendStatus(403)
        // Benutzer-ID aus Request holen
        const userId = request.body.id
        if (userId) {
            // Benutzertabelle öffnen und Benutzer löschen
            const usersTable = arrange.database['users/users']
            if (usersTable[userId]) {
                delete usersTable[userId]
                usersTable.save()
            }
        }
        // Einfach immer 200 senden, auch wenn Benutzer gar nicht existiert hat
        response.sendStatus(200)
    })

}