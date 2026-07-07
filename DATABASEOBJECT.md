# Basisklasse `DatabaseObject`

`DatabaseObject` ist eine abstrakte Basisklasse Datenobjekte.

Sie kapselt die Client-Funktionen und API-Aufrufe.

## Definition eigener Datenbankobjekte

```js
import DatabaseObject from '/arrange/js/types/DatabaseObject.mjs'

class Task extends DatabaseObject {
    static databaseName = 'myapp' // Name der SQLite Datenbank
    static tableName = 'Tasks' // Tabellenname für Datentyp
}
```

## Konstruktor

```js
const task = new Task({
    Id: 'task-1',
    Title: 'Hallo',
    Done: 0
})
```

Die Eigenschaften entsprechen den Feldnamen in der Datenbanktabelle.

Wird `Id` nicht angegeben, wird durch den Konstruktor eine Id generiert.

## Instanzmethoden

### `obj.save()`

Speichert den Datensatz.

```js
// Neu anlegen
const task = new Task({ Title: 'Test', Done: 0 })
await task.save()

// Ändern
task.Done = 1
await task.save()

// Feld leeren (null senden)
task.Notes = null
await task.save()

// Feld beim Speichern auslassen (bleibt in DB unverändert)
task.Title = undefined
await task.save()
```

### `obj.delete()`

Löscht den Datensatz aus der Datenbank.

```js
const task = await Task.load('task-1')
await task.delete()
```

## Statische Methoden

### `Task.load(id)`

Lädt einen Datensatz anhand seiner Id.

```js
const task = await Task.load('task-1')
```

### `Task.query(sqlString)`

Führt eine SELECT-Abfrage aus und gibt typisierte Instanzen zurück.

```js
// Einfache Abfrage
const allTasks = await Task.query('SELECT * FROM Tasks')

// Mit JOIN (Zusatzfelder werden ebenfalls gemappt)
const tasksWithLabel = await Task.query(`
    SELECT Tasks.Id, Tasks.Title, Labels.Name AS LabelName
    FROM Tasks
    JOIN Labels ON Tasks.LabelId = Labels.Id
`)
```