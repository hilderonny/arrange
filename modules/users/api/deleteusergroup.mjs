export default (arrange) => {

    // Benutzergruippe löschen
    arrange.webServer.delete('/api/users/deleteusergroup', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('USERS_ADMINISTRATION_USER')) return response.sendStatus(403)
        // Benutzergruppen-ID aus Request holen
        const usergroupId = request.body.id
        if (usergroupId) {
            // Benutzergruppentabelle öffnen und Benutzer löschen
            const usergroupsTable = arrange.database['users/usergroups']
            if (usergroupsTable[usergroupId]) {
                delete usergroupsTable[usergroupId]
                usergroupsTable.save()
            }
        }
        // Einfach immer 200 senden, auch wenn Benutzergruppe gar nicht existiert hat
        response.sendStatus(200)
    })

}