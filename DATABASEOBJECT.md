# Basisklasse DatabaseObject

Diese abstrakte Basisklasse dient dazu, den Datenaustausch zwischen Client-Anwendung und Datenbank zu vereinfachen.
Sie kapselt die API-Aufrufe innerhalb von Klassen- und Instanzmethoden.


## Verwendung

```js
import DatabaseObject from '/arrange/js/types/DatabaseObject.mjs'

// Base class for all application specific objects
class ApplicationObject extends DatabaseObject {
    static databaseName = 'ApplicationDatabase' // Define database name for all application specific objects
}

// Class for specific object type which represents a database table
class Task extends ApplicationObject {
    static tableName = 'Tasks' // Table name for this kind of objects
}

// Create and save an object
const newTask = new Task({ Title: 'Dokumentation', Content: 'Soweit vervollständigen, dass sie verständlich und nachvollziehbar ist' })
await newTask.save()

// Load an object by its Id
const task = await Task.load('id1')

// Load a list of objects via SQL Query
const allTasks = await Task.query('SELECT * FROM Tasks')

// Delete an object from the database
await task.delete()
```


## Funktionen

- [Klassendefinition](#klassendefinition)
- [Konstruktor](#konstruktor)
- [Datensätze anhand einer SQL-Abfrage laden - static query()](#datensätze-anhand-einer-sql-abfrage-laden---static-query)
- [Datensatz laden - static load()](#datensatz-laden---static-load)
- [Datensatz löschen - delete()](#datensatz-löschen---delete)
- [Datensatz speichern - save()](#datensatz-speichern---save)


### Klassendefinition

Datentypen müssen `DatabaseObject` beerben, da diese Basisklasse alle Grundfunktionen bereitstellt.
Dabei müssen abgeleitete Klassen festlegen, in welcher Datenbank und in welcher Tabelle sie gespeichert werden.

```js
import DatabaseObject from '/arrange/js/types/DatabaseObject.mjs'

class Aufgabe extends DatabaseObject {
    static databaseName = 'Database1' // Datenbank, in der Objekte dieser Art gespeichert werden
    static tableName = 'Table1' // Tabellenname innerhalb der Datenbank für diese Datentypen
}
```


### Konstruktor

Bei der Erstellung von Datenbankobjekten können als Parameter Feldwerte vorbelegt werden.
Wird keine `Id` als Parameter übergeben, wird eine solche generiert.

```js
const aufgabeMitGenerierterId = new Aufgabe()

const aufgabeMitVordefinierterId = new Aufgabe({ Id: 'id1' })

const aufgabeMitVordefiniertenFeldern = new Aufgabe({ Id: 'id1', Titel: 'Mach was Tolles!' })
```


### Datensätze anhand einer SQL-Abfrage laden - `static query()`

Mit dieser Funktion können beliebige SQL-Abfragen ausgeführt werden, die Listen liefern.
Dabei werden die Ergebnisse in die Datentypen der jeweiligen Klasse gemappt, um sie später einfacher bearbeiten zu können.

Es werden auch solche Felder in den Ergebnissen geliefert, die nicht Bestandteil der Klassendefinition sind.
Dadurch können auch komplizierte Abfragen mit `JOIN`s ausgeführt werden.

Bei Fehlern wird eine Exception mit dem Text `Cannot query database` geworfen.

```js
try {
    const query = 'SELECT Aufgabe.Id, Aufgabe.Titel, Benutzer.Name AS Benutzername FROM Aufgabe JOIN Benutzer ON Aufgabe.BenutzerId = Benutzer.Id'
    const aufgabenAllerBenutzer = await Aufgabe.query(query)
    for (const aufgabe of aufgabenAllerBenutzer) {
        // aufgabe hat den Typ 'Aufgabe' und alle darin enthaltenen Funktionen
        aufgabe.Id // Aus Tabelle 'Aufgabe'
        aufgabe.Titel // Aus Tabelle 'Aufgabe'
        aufgabe.Benutzername // Aus Tabelle 'Benutzer'
    }
} catch (error) {
    // error.message = 'Cannot query database'
}
```


### Datensatz laden - `static load()`

Lädt einen Datensatz mit allen Inhalten anhand seiner Id.

Bei Fehlern wird eine Exception mit dem Text `Cannot load database record` geworfen.

```js
try {
    const aufgabe = await Aufgabe.load('id1')
} catch (error) {
    // error.message = 'Cannot load database record'
}
```


### Datensatz löschen - `delete()`

Löscht einen Datensatz aus der Datenbank.
Die Objektinstanz selbst bleibt dabei unangetastet.
Würde man anschließend `save()` aufrufen, wird ein neuer Datensatz mit den Informationen der Instanz in der Datenbank abgelegt.

Bei Fehlern wird eine Exception mit dem Text `Cannot delete database record` geworfen.

```js
try {
    await aufgabe.delete()
} catch (error) {
    // error.message = 'Cannot delete database record'
}
```


### Datensatz speichern - `save()`

Speichert einen Datensatz in der Datenbank.
Wenn noch kein Datensatz mit der entsprechenden `Id` existiert, wird einer angelegt.

Existiert bereits ein Datensatz mit der entsprechenden `Id`, werden darin diejenigen Felder überschrieben, die in der Instanz mit Werten belegt sind.

Bei Fehlern wird eine Exception mit dem Text `Cannot save database record` geworfen.

```js
try {
    // Neuen Datensatz speichern
    const neueAufgabe = new Aufgabe({ Titel: 'Mach was' })
    await neueAufgabe.save()

    // Existierenden Datensatz verändern
    const existierendeAufgabe = await Aufgabe.load('id1')
    existierendeAufgabe.Titel = 'Anderer Titel'
    await existierendeAufgabe.save()

    // Datensatz verändern, aber Felder explizit NICHT überschreiben
    const existierendeAufgabe = await Aufgabe.load('id1')
    existierendeAufgabe.Titel = undefined // Durch das Setzen auf "undefined" wird dieses Feld nicht beim Speichern übertragen
    existierendeAufgabe.Inhalt = 'Denk Dir was aus'
    await existierendeAufgabe.save()

    // Inhalt eines Feldes löschen
    const existierendeAufgabe = await Aufgabe.load('id1')
    existierendeAufgabe.Titel = null // null wird zur Datenbank übertragen und führt zur Leerung des entsprechenden Feldes
    await existierendeAufgabe.save()

    // Nur in der Klasse definierte Felder werden gespeichert
    const neueAufgabe = new Aufgabe()
    neueAufgabe.Titel = 'Mach was' // Feld "Titel" existiert in Klasse "Aufgabe" und wird daher gespeichert
    neueAufgabe.UnbekannteEigenschaft = 'Was genau?' // Feld "UnbekannteEigenschaft" existiert NICHT in Klasse "Aufgabe" und wird daher auch NICHT gespeichert
    await neueAufgabe.save()
} catch (error) {
    // error.message = 'Cannot save database record'
}
```

