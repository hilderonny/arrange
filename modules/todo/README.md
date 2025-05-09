# Modul ToDo

Hier gibt es ToDo-Listen als App.
Man kann ToDos zu Listen gruppieren und darin einzelne ToDos definieren.

Jedes ToDo wird benutzerabhängig gespeichert.
Jeder Benutzer kann nur seine eigenen ToDos sehen.
Abgeschlossene ToDos gehen für immer verloren.

## Berechtigungen

|Berechtigung|Beschreibung|
|---|---|
|`TODO_TODO`|Benutzung der ToDo-Listen-App.|

## Datenbanktabelle `todo/todolists`

|Feldname|Datentyp|Label|Beschreibung|
|---|---|---|---|
|`id`|text|Id|Id der ToDo-Liste.|
|`name`|text|Name|Name der Liste|
|`userid`|text|Id des Benutzers, dem die Liste gehört|
|`todoids`|reference|Aufgaben|Liste von Aufgaben-IDs, die zur ToDo-Liste gehören|

```js
arrange.database['todo/todolists'] = {
    'todo_list_id' : {
        name: 'Chat-Transkription',
        userid: 'uder-id',
        todoids: [ 'todo-id-1', 'todo-id-2' ]
    }
}
```

## Datenbanktabelle `todo/todos`

Speichert alle ToDos.

|Feldname|Datentyp|Label|Beschreibung|
|---|---|---|---|
|`id`|text|Id|Id der ToDo.|
|`content`|text|Inhalt|Inhalt der Aufgabe|
|`iscompleted`|boolean|Gibt an, ob Aufgabe abgeschlossen ist|
|`userid`|text|Id des Benutzers, dem die Aufgabe gehört|

```js
arrange.database['todo/todos'] = {
    'todo_id' : {
        content: 'Beispiel präsentieren',
        iscompleted: true,
        userid: 'uder-id'
    }
}
```

## API DELETE `/api/todo/deletetodo`

Löscht eine einzelne Aufgabe.
Erfordert Berechtigung `TODO_TODO` und die Aufgabe muss dem angemeldeten Benutzer gehören.
Die zu löschende Aufgabe muss als JSON-Objekt im Body übergeben werden und muss ein Feld `id` enthalten.

```js
const todoToDelete = { id: 'todo_id' }
const response = await fetch('/api/todo/deletetodo', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(todoToDelete)
})
// Berechtigung des angemeldeten Benutzers zur Verwendung der API fehlt oder Aufgabe gehört nicht dem Benutzer
response.status === 403
// Aufgabe erfolgreich gelöscht oder gar nicht vorhanden
response.status === 200
```

## API DELETE `/api/todo/deletetodolist`

Löscht eine ToDo-Liste und alle zugehörigen Aufgaben.
Erfordert Berechtigung `TODO_TODO` und die Aufgabenliste muss dem angemeldeten Benutzer gehören.
Die zu löschende Aufgabenliste muss als JSON-Objekt im Body übergeben werden und muss ein Feld `id` enthalten.

```js
const todoListToDelete = { id: 'todo_id' }
const response = await fetch('/api/todo/deletetodolist', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(todoListToDelete)
})
// Berechtigung des angemeldeten Benutzers zur Verwendung der API fehlt oder Aufgabenliste gehört nicht dem Benutzer
response.status === 403
// Aufgabenliste erfolgreich gelöscht oder gar nicht vorhanden
response.status === 200
```

## API POST `/api/todo/savetodo`

Speichert eine Aufgabe.
Erfordert Berechtigung `TODO_TODO`.
Wenn die übergebene Aufgabe kein `id` Feld hat, wird sie als neue Aufgabe interpretiert, eine Id generiert und gespeichert.
Wenn sie bereits eine Id hat, wird geprüft, ob die bestehende Aufgabe besteht und dem Benutzer gehört.
Nur dann kann sie überschrieben werden.
Der Response enthält die gespeicherte Aufgabe mit `id`.

```js
const todoToSave = {
    id: 'todo-id', 
    content: 'Beispiel präsentieren',
    iscompleted: true
}
const response = await fetch('/api/todo/savetodo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(todoToSave)
})
// Berechtigung des angemeldeten Benutzers zur Verwendung der API fehlt oder die Aufgabe existiert, gehört aber nicht dem Benutzer
response.status === 403
// Aufgabe erfolgreich gespeichert bzw. angelegt
response.status === 200
response.json() = {
    id: 'todo-id', 
    content: 'Beispiel präsentieren',
    iscompleted: true
}
```

## API POST `/api/todo/savetodolist`

Speichert eine Aufgabenliste.
Erfordert Berechtigung `TODO_TODO`.
Wenn die übergebene Aufgabenliste kein `id` Feld hat, wird sie als neue Aufgabenliste interpretiert, eine Id generiert und gespeichert.
Wenn sie bereits eine Id hat, wird geprüft, ob die bestehende Aufgabenliste besteht und dem Benutzer gehört.
Nur dann kann sie überschrieben werden.
Der Response enthält die gespeicherte Aufgabenliste mit `id`.

```js
const todoListToSave = {
    id: 'todo-list-id', 
    name: 'Chat-Transkription',
    todoids: [ 'todo-id-1', 'todo-id-2' ]
}
const response = await fetch('/api/todo/savetodolist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(todoListToSave)
})
// Berechtigung des angemeldeten Benutzers zur Verwendung der API fehlt oder die Aufgabenliste existiert, gehört aber nicht dem Benutzer
response.status === 403
// Aufgabenliste erfolgreich gespeichert bzw. angelegt
response.status === 200
response.json() = {
    id: 'todo-list-id', 
    name: 'Chat-Transkription',
    todoids: [ 'todo-id-1', 'todo-id-2' ]
}
```

## API GET `/api/todo/todolistforuser`

Liefert Liste aller ToDo-Listen samt deren Aufgaben zurück, auf die der Benutzer Zugriff hat.

```js
response = [
    {
        id: 'todo_list_id',
        name: 'Chat-Transkription',
        todos: [
            {
                id: 'todo_id',
                content: 'Beispiel präsentieren',
                iscompleted: true
            }
        ]
   }
]
```
