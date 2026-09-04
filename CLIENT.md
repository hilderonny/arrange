# Client-Bibliothek `arrange.mjs`

## Einbindung

```html
<script type="module">

    import * as Arrange from '/arrange/js/arrange.mjs'

</script>
```

Beim Import wird automatisch `/api/autologin` geprüft.

Falls keine Sitzung aktiv: Arrange-Login-Dialog wird angezeigt.

Nach erfolgreichem Login läuft die Seite normal weiter.

## Benutzerverwaltung

### `Arrange.logout()`

Meldet Benutzer ab und lädt die Seite neu.
Dadurch wird der Login-Dialog angezeigt.

## Datenbankfunktionen

### `Arrange.updateDatabase(databaseName, schema)`

Erstellt oder erweitert Datenbanken, Tabellen und Spalten.

```js
await Arrange.updateDatabase('myapp', {
    Tasks: {
        Title: 'TEXT', 
        Done: 'INTEGER', 
        Notes: 'TEXT'
    },
    Comments: { 
        TaskId: 'TEXT REFERENCES Tasks(Id) ON DELETE CASCADE', 
        Text: 'TEXT'
    }
})
```

### `Arrange.saveDatabaseRecord(databaseName, tableName, recordId, fields)`

Erstellt oder aktualisiert einen Datensatz.

Gibt vollständigen Datensatz zurück.

```js
const record = await Arrange.saveDatabaseRecord('myapp', 'Tasks', 'task-001', {
    Title: 'Dokumentation schreiben',
    Done:  0,
    Notes: null
})
```

Wird bei einem Feld `null` als Wert angegeben, wird das Feld in der Datenbank geleert.

Bei `undefined` wird das Feld nicht verändert.

### `Arrange.queryDatabase(databaseName, query)`

SELECT-Abfrage, gibt Array zurück.
Kein `;` erlaubt, Statement muss mit `SELECT` beginnen.

```js
const openTasks = await Arrange.queryDatabase('myapp', 'SELECT * FROM Tasks WHERE Done = 0')
```

### `Arrange.deleteDatabaseRecord(databaseName, tableName, recordId)`

Löscht einen Datensatz mit der angegebenen `recordId`.

### `Arrange.deleteDatabaseTable(databaseName, tableName)`

Löscht eine gesamte Tabelle.

## Dateifunktionen

### Öffentliche Dateien

Für alle Benutzer auch ohne Login zugänglich.

```js
// Datei laden (gibt Text oder Blob zurück, je nach Typ)
const content = await Arrange.getPublicFile('config/settings.json')

// Verzeichnis auflisten
const entries = await Arrange.getPublicFile('images/')
// [ { name: 'logo.png', type: 'file' }, { name: 'icons', type: 'dir' } ]

// Textdatei hochladen
await Arrange.postPublicTextFile('config/settings.json', JSON.stringify({ theme: 'dark' }))

// Binärdatei hochladen (mit Fortschritt)
await Arrange.uploadPublicBinaryFile('images/foto.jpg', blobOrFile, (percent) => {
    console.log(`${percent}% hochgeladen`)
})

// Verzeichnis erstellen
await Arrange.createPublicPath('images/thumbnails')

// Löschen (Datei oder Verzeichnis rekursiv)
await Arrange.deletePublicPath('images/thumbnails')
```

### Private Dateien

Nur für den angemeldeten Benutzer zugänglich.

```js
// Datei laden
const content = await Arrange.getPrivateFile('dokumente/bericht.pdf')

// Verzeichnis auflisten
const entries = await Arrange.getPrivateFile('dokumente/')

// Textdatei hochladen
await Arrange.postPrivateTextFile('notizen.txt', 'Meine Notizen')

// Binärdatei hochladen
await Arrange.uploadPrivateBinaryFile('foto.jpg', file, (percent) => { ... })

// Verzeichnis erstellen
await Arrange.createPrivatePath('dokumente/2025')

// Löschen
await Arrange.deletePrivatePath('dokumente/alt')
```

## Gamification

Für den Spieler in Dir.

```js
// Spielerstatus abfragen
const playerStatus = await Arrange.getPlayerStatus()
playerStatus = {
    Coins:  23456,
    Experience: 123,
    Level: 10,
    NextLevelExperience: 345
}

// Münzen hinzufügen
await Arrange.addPlayerCoins(123)

// Münzen entfernen
await Arrange.removePlayerCoins(42)

// Erfahrungspunkte gewähren
await Arrange.addPlayerExperience(345)
```

## WebSocket-Funktionen

### `Arrange.connectWebSocket(messageCallback)`

Baut WebSocket-Verbindung auf.

Der Server sendet sofort nach Verbindung eine `0x01` - Nachricht mit der eigenen Client-ID.

```js
function messageHandler(event) {
    switch (event.type) {
        case 0x01: // Eigene ID empfangen (direkt nach Connect)
            console.log('Meine ID:', event.clientId)
            break
        case 0x31: // Broadcast aus einem Raum
            console.log('Von:', event.senderId, 'Raum:', event.roomId, 'Nachricht:', event.message)
            break
        case 0x41: // Direktnachricht
            console.log('Von:', event.senderId, 'Nachricht:', event.message)
            break
    }
}

await Arrange.connectWebSocket(messageHandler)
```

### `Arrange.joinRoom(roomNumber)`

Tritt einem Raum it einer bestimmten Id bei (Typ: `BigInt`).

Man erhält danach alle Broadcasts in diesem Raum.

```js
await Arrange.connectWebSocket(handler)
await Arrange.joinRoom(42n) // BigInt
```

### `Arrange.leaveRoom(roomNumber)`

Verlässt einen Raum.

```js
await Arrange.leaveRoom(42n)
```

### `Arrange.sendMessageToRoom(roomNumber, message)`

Sendet Text-Nachricht an alle Mitglieder eines Raums.

```js
await Arrange.sendMessageToRoom(42n, 'Hallo Raum!')
```

### `Arrange.sendMessageToClient(clientId, message)`

Sendet Direktnachricht an einen anderen Client.

`clientId` ist ein `BigInt`.

```js
await Arrange.sendMessageToClient(otherClientId, 'Hallo Du da!')
```
