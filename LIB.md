# Client-Bibliothek `arrange.mjs`

## Verwendung

```html
<html>
    <head>
        <script type="module">
            import * as Arrange from '/arrange/js/arrange.mjs'
            // Beim ersten Aufruf wird automatisch die Anmeldeseite angezeigt bzw. es erfolgt das Auto-Login

            // Datenbankobjekte definieren
            import DatabaseObject from '/arrange/js/types/DatabaseObject.mjs'

            class Aufgabe extends DatabaseObject {
                static databaseName = 'Database1' // Datenbank, in der Objekte dieser Art gespeichert werden
                static tableName = 'Table1' // Tabellenname innerhalb der Datenbank für diese Datentypen
            }

            // Datenbankobjektinstanzen verwenden
            const neueAufgabe = new Aufgabe({ Titel: 'Dokumentation', Inhalt: 'Soweit vervollständigen, dass sie verständlich und nachvollziehbar ist' })
            await neueAufgabe.save()

        </script>
    </head>
</html>
```

Zur vereinfachten objektorientierten Handhabung von Datenbanktabellen und -objekten kann [DatabaseObject.mjs](DATABASEOBJECT.md) verwendet werden.

## Funktionen

- [An Raum anmelden - async joinRoom(roomNumber)](#an-raum-anmelden---async-joinroomroomnumber)
- [Benutzer abmelden - logout()](#benutzer-abmelden---logout)
- [Datenbank abfragen - async queryDatabase(databaseName, query)](#datenbank-abfragen---async-querydatabasedatabasename-query)
- [Datenbankeintrag löschen - async deleteDatabaseRecord(databaseName, tableName, recordId)](#datenbankeintrag-löschen---async-deletedatabaserecorddatabasename-tablename-recordid)
- [Datenbankeintrag speichern - saveDatabaseRecord(databaseName, tableName, recordId, fields)](#datenbankeintrag-speichern---savedatabaserecorddatabasename-tablename-recordid-fields)
- [Datenbankschema aktualisieren - async updateDatabase(databaseName, schema)](#datenbankschema-aktualisieren---async-updatedatabasedatabasename-schema)
- [Datenbanktabelle löschen - async deleteDatabaseTable(databaseName, tableName)](#datenbanktabelle-löschen---async-deletedatabasetabledatabasename-tablename)
- [Nachricht an Raum schicken - async sendMessageToRoom(roomNumber, textMessage)](#nachricht-an-raum-schicken---async-sendmessagetoroomroomnumber-textmessage)
- [Nachricht an Teilnehmer schicken - async sendMessageToClient(clientId, textMessage)](#nachricht-an-teilnehmer-schicken---async-sendmessagetoclientclientid-textmessage)
- [Öffentliche Binärdatei hochladen - async uploadPublicBinaryFile(filePath, binaryFileContent, progressCallback)](#öffentliche-binärdatei-hochladen---async-uploadpublicbinaryfilefilepath-binaryfilecontent-progresscallback)
- [Öffentliche Datei oder Verzeichnis laden - async getPublicFile(filePath)](#öffentliche-datei-oder-verzeichnis-laden---async-getpublicfilefilepath)
- [Öffentliche Datei oder Verzeichnis löschen - async deletePublicPath(filePath)](#öffentliche-datei-oder-verzeichnis-löschen---async-deletepublicpathfilepath)
- [Öffentliche Textdatei hochladen - async postPublicTextFile(filePath, fileContent)](#öffentliche-textdatei-hochladen---async-postpublictextfilefilepath-filecontent)
- [Private Binärdatei hochladen - async uploadPrivateBinaryFile(filePath, binaryFileContent, progressCallback)](#private-binärdatei-hochladen---async-uploadprivatebinaryfilefilepath-binaryfilecontent-progresscallback)
- [Private Datei oder Verzeichnis laden - getPrivateFile(filePath)](#private-datei-oder-verzeichnis-laden---async-getprivatefilefilepath)
- [Private Datei oder Verzeichnis löschen - async deletePrivatePath(filePath)](#private-datei-oder-verzeichnis-löschen---async-deleteprivatepathfilepath)
- [Private Textdatei hochladen - async postPrivateTextFile(filePath, fileContent)](#private-textdatei-hochladen---async-postprivatetextfilefilepath-filecontent)
- [Privates Verzeichnis erstellen - async createPrivatePath(directoryPath)](#privates-verzeichnis-erstellen---async-createprivatepathdirectorypath)
- [Von Raum abmelden - async leaveRoom(roomNumber)](#von-raum-abmelden---async-leaveroomroomnumber)
- [Websocket-Verbindung aufbauen - async connectWebSocket(messageCallback)](#websocket-verbindung-aufbauen---async-connectwebsocketmessagecallback)


### An Raum anmelden - `async joinRoom(roomNumber)`

Registriert den Benutzer als Teilnehmer eines Websocket-Raumes, woraufhin er künftig Nachrichten für diesen Raum erhält.
Man kann sich für beliebig viele Räume registrieren.
Wenn man sich mehrmals für einen Raum registriert, bekommt man die Nachrichten auch mehrfach.

```js
// Websocket-Verbindung herstellen
await Arrange.connectWebSocket(messageHandler)
// An Raum mit bestimmter Nummer anmelden
await Arrange.joinRoom(13n)
```


### Benutzer abmelden - `logout()`

Meldet den Benutzer ab und lädt die Seite neu, damit der Anmeldedialog wieder angezeigt wird.

```js
Arrange.logout()
```


### Datenbank abfragen - `async queryDatabase(databaseName, query)`

Führt eine Abfrage auf der Datenbank aus und gibt das Ergebnis als Array zurück.

Bei Fehlern wird eine Exception mit dem Text `Cannot query database` geworfen.

```js
try {
    const result = await Arrange.queryDatabase('Database1', 'SELECT * FROM Table1')
    // [
    //     { Id: 'id1', Column1: 'text1', Column2: 42 },
    //     ...
    // ]
} catch (error) {
    // error.message = 'Cannot query database'
}
```


### Datenbankeintrag löschen - `async deleteDatabaseRecord(databaseName, tableName, recordId)`

Löscht einen Datenbankeintrag aus der Tabelle der angegebenen Datenbank.
Fremdschlüssel werden ebenfalls beachtet und bei Bedarf die abhängigen Datensätze ebenfalls gelöscht.
Diese Funktion hat keinerlei Rückgabe.

Bei Fehlern wird eine Exception mit dem Text `Cannot delete database record` geworfen.

```js
try {
    await Arrange.deleteDatabaseRecord('Datenbank1', 'Table1', 'id1')
} catch (error) {
    // error.message = 'Cannot delete database record'
}
```


### Datenbankeintrag speichern - `saveDatabaseRecord(databaseName, tableName, recordId, fields)`

Speichert einen Datensatz in der Datenbank und erstellt diesen bei Bedarf.
Auch die Datenbank selbst wird bei Bedarf erstellt.
Es werden nur die Felder überschrieben, die mitgesendet werden, alle anderen bleiben unberührt.
Als Ergebnis wird der vollständige Datensatz als JSON-Struktur zurückgegeben.

Bei Fehlern wird eine Exception mit dem Text `Cannot save database record` geworfen.

```js
try {
    const result = await Arrange.saveDatabaseRecord('database1', 'Table1', 'id1', {
        Column1: 'text',
        Column2: 42,
        Column3: false,
        Column4: null
    })
    // Rückgabewert result:
    // {
    //     Id: 'id1'
    //     Column1: 'text',
    //     Column2: 42,
    //     Column3: false,
    //     Column4: null,
    //     Column5: 'unverändert'
    // }
} catch (error) {
    // error.message = 'Cannot save database record'
}
```

Wenn ein Feld geleert werden soll, muss dieses als `null` mitgesendet werden, `undefined` wird herausgefiltert.


### Datenbankschema aktualisieren - `async updateDatabase(databaseName, schema)`

Erstellt eine Datenbank oder aktualisiert deren Schema.
Das Schema enthält Tabellennamen und Spaltennamen als Objekt-Keys und SQLite-Spaltendefinitionen als Values.

Bei Fehlern wird eine Exception mit dem Text `Cannot update database` geworfen.

```js
try {
    await Arrange.updateDatabase('Database1', { // Datenbankname
        Table1: { // Name der Tabelle als Key
            Column1: 'TEXT', // Name der Spalte als Key und Schemadefinition als Value
            Column2: 'INTEGER'
        }
    })
} catch (error) {
    // error.message = 'Cannot update database'
}
```

Bei Bedarf werden die Datenbank, die Tabellen und Spalten erstellt.
Existierende Spalten werden jedoch nicht verändert, wenn sie einmal erstellt wurden.
Jede Tabelle bekommt automatisch den Primärschlüssel `Id` (TEXT).


### Datenbanktabelle löschen - `async deleteDatabaseTable(databaseName, tableName)`

Löscht eine Tabelle der angegebenen Datenbank.
Fremdschlüssel werden ebenfalls beachtet und bei Bedarf die abhängigen Datensätze ebenfalls gelöscht.
Diese Funktion hat keinerlei Rückgabe.

Bei Fehlern wird eine Exception mit dem Text `Cannot delete database table` geworfen.

```js
try {
    await Arrange.deleteDatabaseTable('Datenbank1', 'Table1')
} catch (error) {
    // error.message = 'Cannot delete database table'
}
```


### Nachricht an Raum schicken - `async sendMessageToRoom(roomNumber, textMessage)`

Schickt eine Textnachricht an alle Teilnehmer eines Raumes.
Man muss nicht selbst Raumteilnehmer sein, um Nachrichten dort hin zu schicken.

```js
// Websocket-Verbindung herstellen
await Arrange.connectWebSocket(messageHandler)
// Nachricht an Raum mit bestimmter Nummer senden
await Arrange.sendMessageToRoom(13n, 'Hallo Raum')
```


### Nachricht an Teilnehmer schicken - `async sendMessageToClient(clientId, textMessage)`

Schickt eine Textnachricht an einen anderen Teilnehmer ohne Garantie.
Wenn es einen Teilnehmer mit der Id gibt, wird er die Nachricht erhalten.
Andernfalls wird die Nachricht verworfen.

```js
// Websocket-Verbindung herstellen
await Arrange.connectWebSocket(messageHandler)
// Nachricht an bestimmten Teilnehmer senden
await Arrange.sendMessageToClient(42n, 'Hallo Teilnehmer')
```


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


### Öffentliche Datei oder Verzeichnis laden - `async getPublicFile(filePath)`

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


### Von Raum abmelden - `async leaveRoom(roomNumber)`

Nach der Abmeldung werden keine Nachrichten mehr für diese Raumnummer erhalten.
Wenn man mehrfach am Raum angemeldet ist, wird nur eine Anmeldung entfernt und die anderen bleiben bestehen, sodass man weiterhin Nachrichten aus dem Raum erhält.

```js
// Websocket-Verbindung herstellen
await Arrange.connectWebSocket(messageHandler)
// An Raum mit bestimmter Nummer verlassen
await Arrange.leaveRoom(13n)
```


### Websocket-Verbindung aufbauen - `async connectWebSocket(messageCallback)`

```js
// Message-Handler definieren
function messageHandler(messageEvent) {
    if (messageEvent.type === 0x01) { // Nachricht mit eigener Websocket-Id
        const ownWebsocketId = messageEvent.clientId // Eigene Websocket-Id
    } else if (messageEvent.type === 0x31) { // Nachrichten an den Raum
        const senderId = messageEvent.senderId // Absender
        const roomId = messageEvent.roomId // Raumnummer
        const message = messageEvent.message // Nachricht
    } else if (messageEvent.type === 0x41) { // Direktnachrichten
        const senderId = messageEvent.senderId // Absender
        const message = messageEvent.message // Nachricht
    }
}
// Websocket-Verbindung aufbauen
await Arrange.connectWebSocket(messageHandler)
// Sofort nach dem Aufbau kommt eine Nachricht 0x01 mit der eigenen Websocket-Id
```
