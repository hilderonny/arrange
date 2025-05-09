import { randomUUID } from 'node:crypto'

export default function (arrange) {

    // Aufgabenliste speichern oder anlegen, es wird immer der vollständige Datensatz erwartet
    arrange.webServer.post('/api/todo/savetodolist', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('TODO_TODO')) return response.sendStatus(403)
        const userId = request.user.id
        // Aufgabenlistentabelle öffnen
        const todoListsTable = arrange.database['todo/todolists']
        // Prüfen, ob der Datensatz bereits existiert und dem Benutzer gehört
        const todoListFromRequest = request.body
        if (todoListFromRequest.id && todoListsTable[todoListFromRequest.id] && todoListsTable[todoListFromRequest.id].userid !== userId) return response.sendStatus(403) // Datensatz existiert, gehört aber nicht dem Benutzer
        // Datensatz vorbereiten, immer from scratch
        const todoListId = todoListFromRequest.id || randomUUID()
        const todoList = todoListsTable[todoListFromRequest.id] || {} // Wenn Aufgabenliste noch nicht existiert, dann neu anlegen
        // Daten einzeln aus Request übernehmen
        todoList.name = todoListFromRequest.name
        todoList.todoids = todoListFromRequest.todoids
        todoList.userid = userId
        // Aufgabenliste speichern
        todoListsTable[todoListId] = todoList
        todoListsTable.save()
        // Rückgabe zusammenbasteln
        const todoListToReturn = JSON.parse(JSON.stringify(todoList))
        todoListToReturn.id = todoListId
        delete todoListToReturn.userId // Ist an Oberfläche unwichtig
        response.send(todoListToReturn)
    })

}