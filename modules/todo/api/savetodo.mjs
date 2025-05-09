import { randomUUID } from 'node:crypto'

export default function (arrange) {

    // Aufgabe speichern oder anlegen, es wird immer der vollständige Datensatz erwartet
    arrange.webServer.post('/api/todo/savetodo', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('TODO_TODO')) return response.sendStatus(403)
        const userId = request.user.id
        // Aufgabentabelle öffnen
        const todosTable = arrange.database['todo/todos']
        // Prüfen, ob der Datensatz bereits existiert und dem Benutzer gehört
        const todoFromRequest = request.body
        if (todoFromRequest.id && todosTable[todoFromRequest.id] && todosTable[todoFromRequest.id].userid !== userId) return response.sendStatus(403) // Datensatz existiert, gehört aber nicht dem Benutzer
        // Datensatz vorbereiten, immer from scratch
        const todoId = todoFromRequest.id || randomUUID()
        const todo = todosTable[todoFromRequest.id] || {} // Wenn Aufgabe noch nicht existiert, dann neu anlegen
        // Daten einzeln aus Request übernehmen
        todo.content = todoFromRequest.content
        todo.iscompleted = todoFromRequest.iscompleted
        todo.userid = userId
        // Aufgabe speichern
        todosTable[todoId] = todo
        todosTable.save()
        // Rückgabe zusammenbasteln
        const todoToReturn = JSON.parse(JSON.stringify(todo))
        todoToReturn.id = todoId
        delete todoToReturn.userId // Ist an Oberfläche unwichtig
        response.send(todoToReturn)
    })

}