export default (arrange) => {

    // Aufgaben eines Benutzers speichern
    arrange.webServer.post('/api/todo/savetodos', async(request, response) => {
        // Berechtigung prüfen
        if (!request.user || (!request.user.hasPermission(['TODO_TODO']))) return response.sendStatus(403)
        const userId = request.user.id
        // Aufgabentabelle öffnen
        const todoTable = arrange.database['todo/todos']
        // Übergebene Struktur um Benutzer-Id erweitern
        const playerData = request.body
        playerData.userId = userId
        // Benutzername nicht mit speichern
        delete playerData.username
        // Eintrag für Benutzer in Tabelle einfach ersetzen
        const index = todoTable.findIndex(record => record.userId === userId)
        if (index >= 0) {
            todoTable.splice(index, 1, playerData)
        } else {
            todoTable.push(playerData)
        }
        todoTable.save()
        // OK zurück geben
        response.sendStatus(200)
    })

}