# Client-Bibliothek `arrange.mjs`

## Verwendung

```html
<html>
    <head>
        <script type="module">
            import * as Arrange from '/arrange/js/arrange.mjs'
            // Beim ersten Aufruf wird automatisch die Anmeldeseite angezeigt bzw. es erfolgt das Auto-Login
        </script>
    </head>
</html>
```


## Funktionen

- [Benutzer abmelden - logout()](#benutzer-abmelden---logout)
- [Datenbank abfragen - async queryDatabase(databaseName, query)](#datenbank-abfragen---async-querydatabasedatabasename-query)
- [Datenbankeintrag löschen - async deleteDatabaseRecord(databaseName, tableName, recordId)](#datenbankeintrag-löschen---async-deletedatabaserecorddatabasename-tablename-recordid)
- [Datenbankschema aktualisieren - async updateDatabase(databaseName, schema)](#datenbankschema-aktualisieren---async-updatedatabasedatabasename-schema)
- [Öffentliche Binärdatei hochladen - async uploadPublicBinaryFile(filePath, binaryFileContent, progressCallback)](#öffentliche-binärdatei-hochladen---async-uploadpublicbinaryfilefilepath-binaryfilecontent-progresscallback)
- [Öffentliche Datei oder Verzeichnis laden - async getPubliceFile(filePath)](#öffentliche-datei-oder-verzeichnis-laden---async-getpublicefilefilepath)
- [Öffentliche Datei oder Verzeichnis löschen - async deletePublicPath(filePath)](#öffentliche-datei-oder-verzeichnis-löschen---async-deletepublicpathfilepath)
- [Öffentliche Textdatei hochladen - async postPublicFile(filePath, fileContent)](#öffentliche-textdatei-hochladen---async-postpublictextfilefilepath-filecontent)
- [Private Binärdatei hochladen - async uploadPrivateBinaryFile(filePath, binaryFileContent, progressCallback)](#private-binärdatei-hochladen---async-uploadprivatebinaryfilefilepath-binaryfilecontent-progresscallback)
- [Private Datei oder Verzeichnis laden - getPrivateFile(filePath)](#private-datei-oder-verzeichnis-laden---async-getprivatefilefilepath)
- [Private Datei oder Verzeichnis löschen - async deletePrivatePath(filePath)](#private-datei-oder-verzeichnis-löschen---async-deleteprivatepathfilepath)
- [Private Textdatei hochladen - async postPrivateFile(filePath, fileContent)](#private-textdatei-hochladen---async-postprivatetextfilefilepath-filecontent)
- [Privates Verzeichnis erstellen - async createPrivatePath(directoryPath)](#privates-verzeichnis-erstellen---async-createprivatepathdirectorypath)


### Benutzer abmelden - `logout()`

Meldet den Benutzer ab und lädt die Seite neu, damit der Anmeldedialog wieder angezeigt wird.

```js
Arrange.logout()
```


## Datenbank abfragen - `async queryDatabase(databaseName, query)`

Führt eine Abfrage auf der Datenbank aus und gibt das Ergebnis als Array zurück.

```js
const result = await Arrange.queryDatabase('Database1', 'SELECT * FROM Table1')
// [
//     { Id: 'id1', Column1: 'text1', Column2: 42 },
//     ...
// ]
```

Bei Fehlern wird `undefined` zurückgegeben.

## Datenbankeintrag löschen - `async deleteDatabaseRecord(databaseName, tableName, recordId)`

Löscht einen Datenbankeintrag aus der Tabelle der angegebenen Datenbank.
Fremdschlüssel werden ebenfalls beachtet und bei Bedarf die abhängigen Datensätze ebenfalls gelöscht.
Diese Funktion hat keinerlei Rückgabe.

```js
await Arrange.deleteDatabaseRecord('Datenbank1', 'Table1', 'id1')
```

## Datenbankschema aktualisieren - `async updateDatabase(databaseName, schema)`

Erstellt eine Datenbank oder aktualisiert deren Schema.
Das Schema enthält Tabellennamen und Spaltennamen als Objekt-Keys und SQLite-Spaltendefinitionen als Values.

```js
await Arrange.updateDatabase('Database1', { // Datenbankname
    Table1: { // Name der Tabelle als Key
        Column1: 'TEXT', // Name der Spalte als Key und Schemadefinition als Value
        Column2: 'INTEGER'
    }
})
```

Bei Bedarf werden die Datenbank, die Tabellen und Spalten erstellt.
Existierende Spalten werden jedoch nicht verändert, wenn sie einmal erstellt wurden.
Jede Tabelle bekommt automatisch den Primärschlüssel `Id` (TEXT).


### Öffentliche Binärdatei hochladen - `async uploadPublicBinaryFile(filePath, binaryFileContent, progressCallback)`

Lädt eine Binärdatei in ein öffentliches Verzeichnis hoch.
Falls die Verzeichnisstruktur noch nicht existiert, wird diese erstellt.
Bestehende Dateien werden überschrieben.

```js
const binaryContent = new Blob([])
function progressCallback(progressInPercent) {
    console.log(`Upload completed to ${progressInPercent}%`)
}
await Arrange.uploadPublicBinaryFile('/path/to/biraryfile.ext', binaryFileContent, progressCallback)
```


### Öffentliche Datei oder Verzeichnis laden - `async getPubliceFile(filePath)`

Lädt eine Datei aus dem öffentlich zugänglichen Verzeichnis oder listet ein Verzeichnis darin auf.

```js
// Öffentlichen Dateiinhalt laden
const publicFileContent = await Arrange.getPublicFile('path/to/file.ext')
// z.B.: "File content"

// Öffentliches Verzeichnis auflisten
const dirPublicEntries = await Arrange.getPublicFile('path/to/directory/')
// [
//     { "name": "filename.ext", "type": "file" },
//     { "name": "directoryname", "type": "dir" }
// ]
```


### Öffentliche Datei oder Verzeichnis löschen - `async deletePublicPath(filePath)`

Löscht eine Datei oder ein Verzeichnis aus dem öffentlichen Verzeichnis. Falls es sich beim angegebenen Pfad um ein Verzeichnis handelt, wird dieses rekursiv gelöscht.

```js
// Öffentliches Verzeichnis rekursiv löschen
await Arrange.deletePublicPath('path/to/directory')

// Öffentliche Datei löschen
await Arrange.deletePublicPath('path/to/directory/with/file.txt')
```


### Öffentliche Textdatei hochladen - `async postPublicTextFile(filePath, fileContent)`

Lädt eine Textdatei in ein öffentliches Verzeichnis hoch.
Falls die Verzeichnisstruktur noch nicht existiert, wird diese erstellt.
Bestehende Dateien werden überschrieben.

```js
const textContent = 'neuer Dateiinhalt'
await Arrange.postPublicTextFile('path/to/textfile.txt', textContent)
```


### Öffentliches Verzeichnis erstellen - `async createPublicPath(directoryPath)`

Erstellt ein Verzeichnis im öffentlichen Verzeichnis.
Falls an dem Zielpfad bereits ein Verzeichnis oder eine Datei existiert, passiert nichts weiter.
Alle übergeordneten Verzeichnisse qwerden bei bedarf ebenfalls automatisch erstellt.

```js
// Öffentliches Verzeichnis erstellen
await Arrange.createPublicPath('path/to/directory')
```


### Private Binärdatei hochladen - `async uploadPrivateBinaryFile(filePath, binaryFileContent, progressCallback)`

Lädt eine Binärdatei in das Benutzerverzeichnis des angemeldeten Benutzers hoch.
Falls die Verzeichnisstruktur noch nicht existiert, wird diese erstellt.
Bestehende Dateien werden überschrieben.

```js
const binaryContent = new Blob([])
function progressCallback(progressInPercent) {
    console.log(`Upload completed to ${progressInPercent}%`)
}
await Arrange.uploadPrivateBinaryFile('/path/to/biraryfile.ext', binaryFileContent, progressCallback)
```


### Private Datei oder Verzeichnis laden - `async getPrivateFile(filePath)`

Lädt eine Datei aus dem Benutzerverzeichnis des angemeldeten Benutzers oder listet ein Verzeichnis darin auf.

```js
// Privaten Dateiinhalt laden
const privateFileContent = await Arrange.getPrivateFile('path/to/file.ext')
// z.B.: "File content"

// Privates Verzeichnis auflisten
const privateDirEntries = await Arrange.getPrivateFile('path/to/directory/')
// [
//     { "name": "filename.ext", "type": "file" },
//     { "name": "directoryname", "type": "dir" }
// ]
```


### Private Datei oder Verzeichnis löschen - `async deletePrivatePath(filePath)`

Löscht eine Datei oder ein Verzeichnis aus dem Benutzerverzeichnis des angemeldeten Benutzers. Falls es sich beim angegebenen Pfad um ein Verzeichnis handelt, wird dieses rekursiv gelöscht.

```js
// Privates Verzeichnis rekursiv löschen
await Arrange.deletePrivatePath('path/to/directory')

// Private Datei löschen
await Arrange.deletePrivatePath('path/to/directory/with/file.txt')
```


### Private Textdatei hochladen - `async postPrivateTextFile(filePath, fileContent)`

Lädt eine Textdatei in das Benutzerverzeichnis des angemeldeten Benutzers hoch.
Falls die Verzeichnisstruktur noch nicht existiert, wird diese erstellt.
Bestehende Dateien werden überschrieben.

```js
const textContent = 'neuer Dateiinhalt'
await Arrange.postPrivateTextFile('path/to/textfile.txt', textContent)
```


### Privates Verzeichnis erstellen - `async createPrivatePath(directoryPath)`

Erstellt ein Verzeichnis im Benutzerverzeichnis.
Falls an dem Zielpfad bereits ein Verzeichnis oder eine Datei existiert, passiert nichts weiter.
Alle übergeordneten Verzeichnisse qwerden bei bedarf ebenfalls automatisch erstellt.

```js
// Privates Verzeichnis erstellen
await Arrange.createPrivatePath('path/to/directory')
```
