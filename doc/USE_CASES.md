# Anwendungsfälle und Architekturmuster

→ [Dokumentationsindex](./README.md)

---

## Übersicht der Muster

| Muster | Geeignet für |
|---|---|
| [Einfache statische Webapp](#1-einfache-statische-webapp) | Informationsseiten, Tools ohne Login |
| [Single-User-App (kein Login)](#2-single-user-app-ohne-login) | Persönliche Tools, lokale Anwendungen |
| [Multi-User-App mit Login](#3-multi-user-app-mit-login) | Teams, Gruppenanwendungen |
| [Dateiverwaltung](#4-dateiverwaltung) | Medienverwaltung, Dokumentensysteme |
| [Echtzeit-Kollaboration](#5-echtzeit-kollaboration) | Chat, gemeinsames Bearbeiten |
| [Modular mit mehreren htmlPaths](#6-modulare-anwendung-mit-mehreren-htmlpaths) | Kopplung mehrerer Repos, Sub-Anwendungen |
| [Erweiterung mit eigener Express-Route](#7-eigene-express-routen) | Spezielle Backend-Logik |

---

## 1. Einfache statische Webapp

Nur statische Dateien ausliefern, keine Datenbank, kein Login.

```js
// Server.mjs
import ArrangeServer from '@hilderonny/arrange'

const server = new ArrangeServer({
    port: 8080,
    useSSL: false,
    htmlPaths: { '/': './html' },
    name: 'Statische App'
})
server.start()
```

```html
<!-- html/index.html – ohne Arrange-JS-Import, reines HTML/JS -->
<!DOCTYPE html>
<html><body><h1>Hallo</h1></body></html>
```

Startet ohne `--experimental-sqlite`, da keine DB genutzt wird. Kein HTTPS nötig.

---

## 2. Single-User-App (ohne Login)

Datenbank und Dateien nutzen, aber kein Benutzer-System. Alle Daten liegen unter dem Pseudo-User `public`.

```js
// Server.mjs
const server = new ArrangeServer({
    port: 8443, useSSL: true,
    crtFile: './server.crt', keyFile: './server.key',
    htmlPaths: { '/': './html' },
    dataPath: './data'
})
server.start()
```

```js
// html/app.mjs – kein Login-Import nötig, direkt API verwenden
await fetch('/api/database/myapp', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ schema: { Notes: { Text: 'TEXT' } } })
})
```

> **Alternativ:** Client-Bibliothek importieren – dann erscheint der Login-Dialog. Für Single-User-Apps die API direkt ansprechen oder ein eigenes minimales Login implementieren.

---

## 3. Multi-User-App mit Login

Standard-Pattern für Team-Anwendungen. Arrange bringt Registrierung, Login und Session-Cookies von Haus aus mit.

**Server:**
```js
const server = new ArrangeServer({
    port: 8443, useSSL: true,
    crtFile: './server.crt', keyFile: './server.key',
    htmlPaths: { '/': './html' },
    dataPath: './data',
    tokenSecret: process.env.TOKEN_SECRET || 'fallback-secret'
})
server.start()
```

**Frontend-Pattern:**
```html
<script type="module">
    import * as Arrange from '/arrange/js/arrange.mjs'
    // → Arrange zeigt automatisch Login/Registrierungs-Dialog, falls keine Sitzung

    // Nach Login: eigene App-Logik
    await Arrange.updateDatabase('myapp', {
        Projects: { Name: 'TEXT', OwnerId: 'TEXT' }
    })
</script>
```

**Praxisbeispiel:** [hilderonny/forensics](https://github.com/hilderonny/forensics) – Forensik-Fallverwaltung

```js
// ForensicsServer.mjs (vereinfacht)
import ArrangeServer from '@hilderonny/arrange'

const server = new ArrangeServer({
    crtFile: './server.crt',
    htmlPaths: { '/': './html' },
    keyFile:  './server.key',
    name:     'Forensics',
    port:     8443,
    useSSL:   true,
    useWebsockets: true
})
server.start()
```

---

## 4. Dateiverwaltung

### Öffentliche Dateien (für alle sichtbar)

```js
// Bild hochladen
const fileInput = document.querySelector('input[type=file]')
const file = fileInput.files[0]
await Arrange.uploadPublicBinaryFile(`images/${file.name}`, file, (pct) => {
    console.log(`${pct}%`)
})

// Verzeichnis auflisten
const entries = await Arrange.getPublicFile('images/')

// Bild anzeigen
const blob = await Arrange.getPublicFile('images/foto.jpg')
const url = URL.createObjectURL(blob)
document.querySelector('img').src = url
```

### Private Dateien (nur für angemeldeten Benutzer)

```js
// Datei speichern (pro Benutzer isoliert)
await Arrange.uploadPrivateBinaryFile('dokumente/vertrag.pdf', pdfBlob)

// Dateiliste
const files = await Arrange.getPrivateFile('dokumente/')

// Datei laden
const pdf = await Arrange.getPrivateFile('dokumente/vertrag.pdf')
```

### Dateien in Datenbank referenzieren

```js
// Bild hochladen und Pfad in DB speichern
const path = `images/${Date.now()}.jpg`
await Arrange.uploadPublicBinaryFile(path, imageFile)
await Arrange.saveDatabaseRecord('myapp', 'Products', productId, {
    Name:      'Schraube',
    ImagePath: path
})
```

---

## 5. Echtzeit-Kollaboration

WebSockets für Live-Updates nutzen, wenn mehrere Benutzer gleichzeitig dieselben Daten sehen.

```js
const TASKS_ROOM = 1n  // Feste Raumnummer für Tasks

// App-Init
await Arrange.connectWebSocket(async (event) => {
    if (event.type !== 0x31) return
    const msg = JSON.parse(event.message)
    if (msg.action === 'taskSaved') await renderTask(msg.id)
    if (msg.action === 'taskDeleted') removeTaskFromUI(msg.id)
})
await Arrange.joinRoom(TASKS_ROOM)

// Beim Speichern
async function saveTask(task) {
    await task.save()
    await Arrange.sendMessageToRoom(TASKS_ROOM, JSON.stringify({
        action: 'taskSaved',
        id:     task.Id
    }))
}

// Beim Löschen
async function deleteTask(task) {
    await task.delete()
    await Arrange.sendMessageToRoom(TASKS_ROOM, JSON.stringify({
        action: 'taskDeleted',
        id:     task.Id
    }))
}
```

---

## 6. Modulare Anwendung mit mehreren `htmlPaths`

`htmlPaths` kann mehrere Sub-URLs auf verschiedene lokale Verzeichnisse abbilden – auch **außerhalb** des Repos.

```
/home/user/
├── meine-app/          ← Haupt-Repo
│   ├── Server.mjs
│   ├── html/
│   └── data/
├── wiki/               ← Separates Repo
│   └── html/
└── admin/              ← Weiteres Repo
    └── html/
```

```js
// Server.mjs in meine-app/
const server = new ArrangeServer({
    port: 8443, useSSL: true,
    crtFile: './server.crt', keyFile: './server.key',
    htmlPaths: {
        '/':      './html',            // Hauptanwendung
        '/wiki':  '../wiki/html',      // Wiki aus anderem Repo (relativer Pfad)
        '/admin': '../admin/html',     // Admin-UI aus anderem Repo
    },
    dataPath: './data'
})
server.start()
```

**Ergebnis:**
- `https://server/` → `meine-app/html/`
- `https://server/wiki` → `../wiki/html/`
- `https://server/admin` → `../admin/html/`

Alle URLs teilen dieselbe Datenbank und API.

---

## 7. Eigene Express-Routen

```js
const server = new ArrangeServer({ ... })
const app = server.expressApplication.app

// Eigener API-Endpunkt
app.post('/api/sendmail', async (req, res) => {
    const { to, subject, body } = req.body
    // ... eigene Logik
    res.json({ sent: true })
})

// Middleware (z.B. Auth-Check für bestimmte Routen)
app.use('/api/admin/*', (req, res, next) => {
    if (!req.session?.userId) return res.sendStatus(401)
    next()
})

server.start()
```

---

## 8. Produktive Konfiguration

```js
const server = new ArrangeServer({
    port:        parseInt(process.env.PORT || '8443'),
    useSSL:      true,
    crtFile:     process.env.CRT_FILE || './server.crt',
    keyFile:     process.env.KEY_FILE || './server.key',
    htmlPaths:   { '/': './html' },
    dataPath:    process.env.DATA_PATH || './data',
    tokenSecret: process.env.TOKEN_SECRET,  // Ohne Secret: bei Neustart werden alle Sessions ungültig
    useWebsockets: true,
    name:        'Meine Produktiv-App'
})
server.start()
```

---

## Verwandte Dokumente

- [SERVER.md](./SERVER.md) – `htmlPaths` und alle Optionen
- [CLIENT.md](./CLIENT.md) – Clientbibliothek-Referenz
- [WEBSOCKETS.md](./WEBSOCKETS.md) – WebSocket-Protokoll
- [DEPLOYMENT.md](./DEPLOYMENT.md) – Deployment-Anleitung


---

*Diese Datei wurde mit [Claude Code](https://claude.ai/code) unter Verwendung des Modells **claude-sonnet-4-6** generiert.*
