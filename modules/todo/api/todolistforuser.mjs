export default (arrange) => {

    // Aufgabenliste für angemeldeten Benutzer
    arrange.webServer.get('/api/todo/todolistforuser', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('TODO_TODO')) return response.sendStatus(403)
        const userId = request.user.id
        // Aufgabenlistentabelle öffnen und filtern
        const todoListsTable = arrange.database['todo/todolists'].entries()
        const todoListsOfUser = todoListsTable.filter(([_, todoList]) => todoList.userid === userId)
        // Aufgabentabelle öffnen und filtern
        const todoTable = arrange.database['todo/todos'].entries()
        const todosOfUser = todoTable.filter(([_, todo]) => todo.userid === userId)
        // Aufgaben den Listen zuordnen
        for (const [_, todoList] of todoListsOfUser) {
            // Aufgaben für Liste filtern
            todoList.todos = todoList.todoids.map(todoId => {
                const todo = todosOfUser[todoId]
                return {
                    id: todo.id,
                    content: todo.content,
                    iscompleted: todo.iscompleted
                }
            })
        }
        // Rückgabestruktur zusammenbasteln
        const todoListToSend = todoListsTable.map(([todoListId, todoList]) => {
            return {
                id: todoListId,
                name: todoList.name,
                todos: todoList.todos
            }
        })
        // Liste zurück geben
        response.send(todoListToSend)
    })

}