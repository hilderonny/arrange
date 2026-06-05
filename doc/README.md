# Arrange – Dokumentationsindex

> **Für KI-Chatbots:** Lies zuerst diese Datei, dann nur die Abschnitte, die für die konkrete Aufgabe relevant sind.

Arrange ist ein **Node.js-Framework** für schlanke Web-Anwendungen mit SSL, SQLite-Datenbank, Dateiverwaltung und WebSockets. Es wird als NPM-Paket `@hilderonny/arrange` eingebunden.

---

## Dokumentationsübersicht

| Datei | Inhalt | Wann lesen |
|---|---|---|
| **[QUICKSTART.md](./QUICKSTART.md)** | Minimales Beispiel, Setup in 5 Minuten | Erster Einstieg |
| **[SERVER.md](./SERVER.md)** | `ArrangeServer`-Klasse, alle Optionen, Deployment | Server konfigurieren |
| **[API.md](./API.md)** | Vollständige REST-API-Referenz | Backend-API nutzen |
| **[CLIENT.md](./CLIENT.md)** | Client-Bibliothek `arrange.mjs` (Browser) | Frontend entwickeln |
| **[DATABASEOBJECT.md](./DATABASEOBJECT.md)** | ORM-Klasse `DatabaseObject` | Datenbankzugriff vereinfachen |
| **[WEBSOCKETS.md](./WEBSOCKETS.md)** | WebSocket-Protokoll, Räume, Direktnachrichten | Echtzeit-Kommunikation |
| **[USE_CASES.md](./USE_CASES.md)** | Architekturmuster, reale Anwendungsbeispiele | Anwendung entwerfen |
| **[DEPLOYMENT.md](./DEPLOYMENT.md)** | Linux-Dienst, Docker, SSL-Zertifikate | Server in Betrieb nehmen |

---

## Schnellreferenz: Minimaler Server

```js
// MyServer.mjs
import ArrangeServer from '@hilderonny/arrange'

const server = new ArrangeServer({
    port: 8443,
    useSSL: true,
    crtFile: './server.crt',
    keyFile:  './server.key',
    htmlPaths: { '/': './html' },   // Statische Dateien unter /
    dataPath: './data',             // Datenbanken + Dateien
    useWebsockets: true,
    name: 'Meine App'
})
server.start()
```

Starten: `node --experimental-sqlite MyServer.mjs`

---

## Architekturüberblick

```
Browser / Client
    │
    ├── GET /          → statische Dateien (htmlPaths)
    ├── GET /arrange/  → Arrange-Clientbibliothek (automatisch)
    ├── /api/*         → REST-API (eingebaut)
    └── /ws/*          → WebSocket (eingebaut)

Server (Node.js)
    └── ArrangeServer
            ├── ExpressApplication (intern)
            │       ├── express.static  (htmlPaths)
            │       ├── cookie-session  (Benutzersitzungen)
            │       ├── multer          (Datei-Upload)
            │       └── node:sqlite     (SQLite-Datenbanken)
            └── WebSocketServer (optional)
```

### Reservierte URL-Pfade

| Pfad | Verwendung |
|---|---|
| `/api/` | Alle REST-Endpunkte |
| `/arrange/` | Clientbibliothek und Ressourcen |
| `/ws/` | WebSocket-Verbindungen |

Diese Pfade dürfen nicht in `htmlPaths` verwendet werden.

---

## Beispielprojekte

| Projekt | Beschreibung | Link |
|---|---|---|
| Forensics | Fallverwaltung für digitale Forensik, DB + Dateien | [github.com/hilderonny/forensics](https://github.com/hilderonny/forensics) |
| DemoServer | Demo mit mehreren statischen Pfaden | [DemoServer.mjs](../DemoServer.mjs) |


---

*Diese Datei wurde mit [Claude Code](https://claude.ai/code) unter Verwendung des Modells **claude-sonnet-4-6** generiert.*
