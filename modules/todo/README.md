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

## Datenbanktabelle `todo/todos`

|Feldname|Datentyp|Label|Beschreibung|
|---|---|---|---|
|`userid`|text|Id des Benutzers, dem die ToDos gehören. Für jeden Benutzer gibt es einen Eintrag.|

TODO: Datenbanktabelle beschreiben

```js
arrange.database['todo/todos'] = {
    'user_id' : {
    }
}
```

## API POST `/api/todo/savetodos`

Speichert die Aufgaben eines Benutzers.
Erfordert Berechtigung `TODO_TODO`.

TODO API savetodos beschreiben

```js
const todoToSave = {
    id: 'todo-id', 
    content: 'Beispiel präsentieren',
    iscompleted: true
}
const response = await fetch('/api/todo/savetodos', {
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

## API GET `/api/todo/todos`

TODO: API todos beschreiben

Liefert Liste aller ToDo-Listen samt deren Aufgaben zurück, auf die der Benutzer Zugriff hat.

```js
response = {
}
```
