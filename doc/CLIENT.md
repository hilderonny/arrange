# Client-Bibliothek `arrange.mjs`

→ [Dokumentationsindex](./README.md)

Die Clientbibliothek wird automatisch vom Server unter `/arrange/js/arrange.mjs` bereitgestellt. Sie kapselt alle API-Aufrufe und stellt Login-Handling sowie WebSocket-Funktionen bereit.

---

## Einbindung

```html
<script type="module">
    import * as Arrange from '/arrange/js/arrange.mjs'
    // Beim Import wird automatisch /api/autologin geprüft.
    // Falls keine Sitzung aktiv: Arrange-Login-Dialog wird angezeigt.
    // Nach erfolgreichem Login läuft die Seite normal weiter.
</script>
```

---

## Benutzerverwaltung

### `Arrange.logout()`

Meldet Benutzer ab und lädt die Seite neu (Login-Dialog erscheint).

```js
Arrange.logout()
```

---

## Datenbankfunktionen

### `await Arrange.updateDatabase(databaseName, schema)`

Erstellt Datenbank/Tabellen/Spalten (idempotent). Bestehende Spalten bleiben unverändert.

Als Spaltenwert wird die vollständige SQLite-Spaltendefinition angegeben, die bei `ALTER TABLE … ADD COLUMN` verwendet werden kann. Neben einfachen Typen sind daher auch Fremdschlüsselverweise mit kaskadierender Löschfunktion erlaubt:

```js
await Arrange.updateDatabase('myapp', {
    Tasks:    { Title: 'TEXT', Done: 'INTEGER', Notes: 'TEXT' },
    Comments: { TaskId: 'TEXT REFERENCES Tasks(Id) ON DELETE CASCADE', Text: 'TEXT' }
})
```

Durch `ON DELETE CASCADE` werden alle `Comments`-Einträge automatisch gelöscht, sobald der zugehörige `Tasks`-Datensatz entfernt wird.

> **Hinweis:** Als Tabellen- und Spaltennamen dürfen keine reservierten SQLite-Schlüsselwörter verwendet werden, da dies zu Syntaxfehlern führt. Häufig versehentlich verwendete reservierte Bezeichnungen sind:
>
> | Bezeichnung | Warum problematisch |
> |-------------|---------------------|
> | `Index`     | SQLite-Schlüsselwort für Datenbankindizes |
> | `Order`     | SQLite-Schlüsselwort in `ORDER BY`-Klauseln |
> | `Group`     | SQLite-Schlüsselwort in `GROUP BY`-Klauseln |
>
> Verwende stattdessen beschreibendere Namen, z.B. `SortOrder` statt `Order` oder `Category` statt `Group`.

---

### `await Arrange.saveDatabaseRecord(databaseName, tableName, recordId, fields)`

Erstellt oder aktualisiert einen Datensatz. Gibt vollständigen Datensatz zurück.

```js
const record = await Arrange.saveDatabaseRecord('myapp', 'Tasks', 'task-001', {
    Title: 'Dokumentation schreiben',
    Done:  0,
    Notes: null   // null = Feld leeren; undefined = Feld nicht anfassen
})
// record = { Id: 'task-001', Title: 'Dokumentation schreiben', Done: 0, Notes: null }
```

---

### `await Arrange.queryDatabase(databaseName, query)`

SELECT-Abfrage, gibt Array zurück. Kein `;` erlaubt.

```js
const tasks = await Arrange.queryDatabase('myapp', 'SELECT * FROM Tasks WHERE Done = 0')
// [ { Id: '...', Title: '...', Done: 0, Notes: null }, ... ]

// JOIN-Beispiel
const result = await Arrange.queryDatabase('myapp',
    'SELECT Tasks.Id, Tasks.Title, Labels.Name AS Label FROM Tasks JOIN Labels ON Tasks.LabelId = Labels.Id'
)
```

---

### `await Arrange.deleteDatabaseRecord(databaseName, tableName, recordId)`

```js
await Arrange.deleteDatabaseRecord('myapp', 'Tasks', 'task-001')
```

> **Hinweis CASCADE:** Wenn andere Tabellen per `REFERENCES … ON DELETE CASCADE` auf diese Tabelle verweisen, werden abhängige Datensätze beim Löschen automatisch mit entfernt. Dieses Verhalten ist gewollt, sollte aber beim Anwendungsdesign berücksichtigt werden.

---

### `await Arrange.deleteDatabaseTable(databaseName, tableName)`

```js
await Arrange.deleteDatabaseTable('myapp', 'Tasks')
```

> **Achtung Fremdschlüssel:** Wenn andere Tabellen per `REFERENCES` auf die zu löschende Tabelle verweisen und **kein** `ON DELETE CASCADE` definiert ist, schlägt dieser Aufruf mit einem Fehler fehl (Foreign Key Constraint). Stelle sicher, dass alle abhängigen Tabellen vorher gelöscht oder die Fremdschlüsselreferenzen entfernt wurden.

---

## Dateifunktionen

### Öffentliche Dateien (`/api/files/public/...`)

Für alle Benutzer (ohne Login) zugänglich.

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

---

### Private Dateien (`/api/files/{userId}/...`)

Nur für den angemeldeten Benutzer zugänglich. Die userId wird automatisch aus der Session genommen.

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

---

## WebSocket-Funktionen

Nur verfügbar, wenn `useWebsockets: true` im Server gesetzt ist.

### `await Arrange.connectWebSocket(messageCallback)`

Baut WebSocket-Verbindung auf. Der Server sendet sofort nach Verbindung eine `0x01`-Nachricht mit der eigenen Client-ID.

```js
function messageHandler(event) {
    switch (event.type) {
        case 0x01:   // Eigene ID empfangen (direkt nach Connect)
            console.log('Meine ID:', event.clientId)
            break
        case 0x31:   // Broadcast aus einem Raum
            console.log('Von:', event.senderId, 'Raum:', event.roomId, 'Nachricht:', event.message)
            break
        case 0x41:   // Direktnachricht
            console.log('Von:', event.senderId, 'Nachricht:', event.message)
            break
    }
}

await Arrange.connectWebSocket(messageHandler)
```

---

### `await Arrange.joinRoom(roomNumber)`

Tritt einem Raum bei (Typ: `BigInt`). Man erhält danach alle Broadcasts in diesem Raum.

```js
await Arrange.connectWebSocket(handler)
await Arrange.joinRoom(42n)   // BigInt!
```

---

### `await Arrange.leaveRoom(roomNumber)`

Verlässt einen Raum. Wenn mehrfach beigetreten, wird nur eine Mitgliedschaft entfernt.

```js
await Arrange.leaveRoom(42n)
```

---

### `await Arrange.sendMessageToRoom(roomNumber, message)`

Sendet Text-Nachricht an alle Mitglieder eines Raums. Man muss selbst **kein** Mitglied sein.

```js
await Arrange.sendMessageToRoom(42n, JSON.stringify({ type: 'update', id: 'task-001' }))
```

---

### `await Arrange.sendMessageToClient(clientId, message)`

Sendet Direktnachricht an einen anderen Client. `clientId` ist ein `BigInt`.

```js
await Arrange.sendMessageToClient(otherClientId, 'Privat: Hallo!')
```

---

## Fehlerbehandlung

Alle `async`-Funktionen werfen bei Fehlern eine `Error`-Exception. Die `message`-Eigenschaft entspricht dem HTTP-Fehlertext des Servers:

```js
try {
    await Arrange.queryDatabase('myapp', 'SELECT * FROM NichtVorhandeneTabelle')
} catch (e) {
    console.error(e.message) // 'Cannot query database'
}
```

---

## Verwandte Dokumente

- [API.md](./API.md) – Die zugrundeliegenden REST-Endpunkte
- [DATABASEOBJECT.md](./DATABASEOBJECT.md) – ORM-Klasse als Alternative zu manuellen DB-Aufrufen
- [WEBSOCKETS.md](./WEBSOCKETS.md) – WebSocket-Protokoll auf Binärebene


---

*Diese Datei wurde mit [Claude Code](https://claude.ai/code) unter Verwendung des Modells **claude-sonnet-4-6** generiert.*
