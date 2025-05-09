export default (arrange) => {

    // Aufgabe löschen
    arrange.webServer.delete('/api/todo/deletetodo', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('TODO_TODO')) return response.sendStatus(403)
        // Aufgaben-ID aus Request holen
        const todoId = request.body.id
        if (todoId) {
            // Aufgabentabelle öffnen und Eigentum klären
            const todosTable = arrange.database['todo/todos']
            const todo = todosTable[todoId]
            if (todo) {
                if (todo.userid !== request.user.id) return response.sendStatus(403) // Aufgabe gehört nicht dem Benutzer
                delete todosTable[todoId]
                todosTable.save()
            }
        }
        // Einfach immer 200 senden, auch wenn Aufgabe gar nicht existiert hat
        response.sendStatus(200)
    })

}