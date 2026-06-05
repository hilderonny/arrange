# DatabaseObject – ORM-Basisklasse

→ [Dokumentationsindex](./README.md)

`DatabaseObject` ist eine abstrakte Basisklasse für den vereinfachten, objektorientierten Datenbankzugriff im Browser. Sie kapselt die `Arrange`-API-Aufrufe.

**Import:**
```js
import DatabaseObject from '/arrange/js/types/DatabaseObject.mjs'
```

---

## Klassendefinition

```js
import DatabaseObject from '/arrange/js/types/DatabaseObject.mjs'

// Optionale Zwischenschicht für gemeinsame Datenbankdefinition
class AppObject extends DatabaseObject {
    static databaseName = 'myapp'   // Datenbank für alle App-Objekte
}

// Konkrete Datenklassen
class Task extends AppObject {
    static tableName = 'Tasks'      // Tabelle für diesen Typ
}

class Label extends AppObject {
    static tableName = 'Labels'
}
```

**Pflichtfelder in jeder konkreten Klasse:**
- `static databaseName` – Name der SQLite-Datenbank (Dateiname ohne `.sqlite`)
- `static tableName` – Tabellenname innerhalb der Datenbank

---

## Konstruktor

```js
// Leeres Objekt (Id wird automatisch generiert)
const t1 = new Task()

// Mit vorgegebener Id
const t2 = new Task({ Id: 'meine-id' })

// Mit Felder-Vorbesetzung
const t3 = new Task({ Id: 'task-1', Title: 'Hallo', Done: 0 })
```

---

## Instanzmethoden

### `await obj.save()`

Speichert den Datensatz. Erstellt ihn, falls er noch nicht existiert. Felder mit `undefined` werden **nicht** übertragen; Felder mit `null` leeren den DB-Wert.

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

---

### `await obj.delete()`

Löscht den Datensatz aus der Datenbank. Das JavaScript-Objekt bleibt erhalten. Ein anschließendes `save()` würde einen neuen Datensatz anlegen.

```js
const task = await Task.load('task-1')
await task.delete()
```

> **Hinweis CASCADE:** Wenn andere Tabellen per `REFERENCES … ON DELETE CASCADE` auf diese Tabelle verweisen, werden alle abhängigen Datensätze beim Löschen automatisch mit entfernt. Dieses Verhalten greift auf Datenbankebene und ist im JavaScript-Objekt nicht sichtbar.

---

## Statische Methoden

### `await Task.load(id)`

Lädt einen einzelnen Datensatz anhand seiner Id.

```js
const task = await Task.load('task-1')
console.log(task.Title)
// Fehler: throws 'Cannot load database record'
```

---

### `await Task.query(sqlString)`

Führt eine SELECT-Abfrage aus und gibt typisierte Instanzen zurück. Unterstützt JOINs – zusätzliche Felder werden ebenfalls in die Instanzen gemappt.

```js
// Einfache Abfrage
const allTasks = await Task.query('SELECT * FROM Tasks')

// Gefiltert
const openTasks = await Task.query('SELECT * FROM Tasks WHERE Done = 0 ORDER BY Title')

// Mit JOIN (Zusatzfelder werden ebenfalls gemappt)
const query = `
    SELECT Tasks.Id, Tasks.Title, Labels.Name AS LabelName
    FROM Tasks
    JOIN Labels ON Tasks.LabelId = Labels.Id
`
const tasksWithLabel = await Task.query(query)
for (const t of tasksWithLabel) {
    console.log(t.Title, t.LabelName) // LabelName ist Extrafeld aus JOIN
}
```

---

## Schema-Initialisierung

`DatabaseObject` erstellt das Schema **nicht** automatisch. Datenbanken und Tabellen müssen vorher über `Arrange.updateDatabase()` angelegt werden:

```js
import * as Arrange from '/arrange/js/arrange.mjs'

// Einmalig beim App-Start (idempotent, kann jedes Mal aufgerufen werden)
await Arrange.updateDatabase('myapp', {
    Tasks:  { Title: 'TEXT', Done: 'INTEGER', LabelId: 'TEXT', Notes: 'TEXT' },
    Labels: { Name: 'TEXT', Color: 'TEXT' }
})
```

---

## Vollständiges Beispiel

```js
import * as Arrange from '/arrange/js/arrange.mjs'
import DatabaseObject from '/arrange/js/types/DatabaseObject.mjs'

class Task extends DatabaseObject {
    static databaseName = 'myapp'
    static tableName = 'Tasks'
}

// Schema sicherstellen
await Arrange.updateDatabase('myapp', {
    Tasks: { Title: 'TEXT', Done: 'INTEGER' }
})

// Datensatz anlegen
const t = new Task({ Title: 'Arrange dokumentieren', Done: 0 })
await t.save()

// Laden
const loaded = await Task.load(t.Id)
console.log(loaded.Title) // 'Arrange dokumentieren'

// Ändern
loaded.Done = 1
await loaded.save()

// Alle offenen Tasks
const open = await Task.query('SELECT * FROM Tasks WHERE Done = 0')
console.log(open.length) // 0

// Löschen
await loaded.delete()
```

---

## Verwandte Dokumente

- [CLIENT.md](./CLIENT.md) – Zugrundeliegende `Arrange`-Funktionen
- [API.md](./API.md) – REST-Endpunkte für Datenbankoperationen


---

*Diese Datei wurde mit [Claude Code](https://claude.ai/code) unter Verwendung des Modells **claude-sonnet-4-6** generiert.*
