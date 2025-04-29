export default (arrange) => {

    // Benutzerdetails und zugehörende Benutzergruppen zurück geben
    arrange.webServer.get('/api/users/userdetails/:user_id', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('PERMISSION_ADMINISTRATION_USER')) return response.sendStatus(401)
        // Benutzertabelle öffnen
        const usersTable = arrange.database['users/users']
        // Benutzer laden
        const userId = request.params.user_id
        const user = usersTable[userId]
        // Benutzer nicht gefunden
        if (!user) return response.sendStatus(404)
        // Gruppenzugehörigkeit ermitteln
        const usergroupassignmentsTable = arrange.database['users/usergroupassignments']
        const assignedUsergroupIds = usergroupassignmentsTable.filter(a => a.userid === userId).map(kvp => kvp[1].usergroupid)
        // Rückgabe zusammenbasteln
        const userToReturn = {
            id: userId,
            name: user.name,
            usergroupids: assignedUsergroupIds
        }
        response.send(userToReturn)
    })

}