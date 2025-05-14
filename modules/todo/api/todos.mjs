export default (arrange) => {

    // Aufgaben eines Benutzers laden
    arrange.webServer.get('/api/todo/todos', async(request, response) => {
        // Berechtigung prüfen
        if (!request.user || (!request.user.hasPermission(['TODO_TODO']))) return response.sendStatus(403)
        const userId = request.user.id
        // Benutzer aus Benutzertabelle holen
        const usersTable = arrange.database['users/users']
        const user = usersTable.find(user => user.id === userId)
        // Aufgabentabelle öffnen
        const todoTable = arrange.database['todo/todos']
        // Datensatz anhand der Benutzer-ID laden
        const playerData = todoTable.find(record => record.userId === userId)
        let playerDataToReturn = playerData ? JSON.parse(JSON.stringify(playerData)) : { experience: 0, coins: 0, tasks: [] }
        delete playerDataToReturn.userId // Die brauchen wir an der Oberfläche nicht
        playerDataToReturn.username = user.name // Wird an Oberfläche angezeigt
        response.send(playerDataToReturn)
    })

}