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
|`experience`|int|Erfahrungspunkte|
|`coins`|int|Münzen|
|`todos`|object[]|Liste mit Aufgaben|

Für jeden Benutzer gibt es genau einen Eintrag in der Datenbanktabelle,
welcher alle seine Aufgaben enthält.

```js
arrange.database['todo/todos'] = [
    {
        userId : 'user_0815', // Id des Benutzers
        experience: 123, // Erfahrungspunkte
        coins: 234 // Münzen
        tasks: [
            {
                title: 'Wohnung putzen', // Überschrift
                notes: 'Ich sollte mal wieder sauber machen', // Notizen
                checklist: [ // Unterliste mit Checkboxen
                    {
                        title: 'Im Wohnzimmer Staub saugen',
                        checked: true // Bereits erledigt
                    }
                ],
                ischecklistopen: true, // Dient zur Anzeige, dass die Checkliste aufgeklappt sein soll
                category: 'rot' // Kategorie, unter der die Aufgabe angezeigt wird
            }
        ]
    }
]
```

## API POST `/api/todo/savetodos`

Speichert die Aufgaben und Spielerinformationen eines Benutzers.
Erfordert Berechtigung `TODO_TODO`.
Infos müssen vollständig vorliegen.

```js
const playerData = {
    experience: 123,
    coins: 234
    tasks: [
        {
            title: 'Wohnung putzen',
            notes: 'Ich sollte mal wieder sauber machen',
            checklist: [
                {
                    title: 'Im Wohnzimmer Staub saugen',
                    checked: true
                }
            ],
            ischecklistopen: true,
            category: 'rot'
        }
    ]
}
const response = await fetch('/api/todo/savetodos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(playerData)
})
// Berechtigung des angemeldeten Benutzers zur Verwendung der API fehlt
response.status === 403
// Aufgaben erfolgreich gespeichert
response.status === 200
```

## API GET `/api/todo/todos`

Liefert Spielerinformationen und Liste aller Aufgaben für den angemeldeten Benutzer zurück.

```js
response = {
    username: 'Benutzername', // Ist der Name des angemeldeten Benutzers
    experience: 123,
    coins: 234
    tasks: [
        {
            title: 'Wohnung putzen',
            notes: 'Ich sollte mal wieder sauber machen',
            checklist: [
                {
                    title: 'Im Wohnzimmer Staub saugen',
                    checked: true
                }
            ],
            ischecklistopen: true,
            category: 'rot'
        }
    ]
}
```
