export default (arrange) => {

    // Aufgabenliste und alle zugehörigen Aufgaben löschen
    arrange.webServer.delete('/api/todo/deletetodolist', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('TODO_TODO')) return response.sendStatus(403)
        const userId = request.user.id
        // Aufgabenlisten-ID aus Request holen
        const todoListId = request.body.id
        if (todoListId) {
            // Aufgabenlistentabelle öffnen und Eigentum klären
            const todoListsTable = arrange.database['todo/todolists']
            const todoList = todoListsTable[todoListId]
            if (todoList) {
                if (todoList.userid !== userId) return response.sendStatus(403) // Aufgabenliste gehört nicht dem Benutzer
                // Erst mal alle zugehörigen Aufgaben löschen
                if (todoList.todoids) {
                    const todosTable = arrange.database['todo/todos']
                    let todosTableWasChanged = false
                    for (const todoId of todoList.todoids) {
                        const todo = todosTable[todoId]
                        if (todo) {
                            if (todo.userid !== userId) continue // Aufgabe ist zwar Liste zugeordnet, gehört aber nicht dem Benutzer, also auch nicht löschen
                            delete todosTable[todoId]
                            todosTableWasChanged = true
                        }
                    }
                    if (todosTableWasChanged) {
                        todosTable.save()
                    }
                }
                // Aufgabenliste löschen
                delete todoListsTable[todoListId]
                todoListsTable.save()
            }
        }
        // Einfach immer 200 senden, auch wenn Aufgabe gar nicht existiert hat
        response.sendStatus(200)
    })

}