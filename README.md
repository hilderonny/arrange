# arrange

[![Node.js CI](https://github.com/hilderonny/arrange/actions/workflows/node.js.yml/badge.svg)](https://github.com/hilderonny/arrange/actions/workflows/node.js.yml)

Arrange ist ein **Node.js-Framework** für schlanke Webanwendungen mit eingebautem HTTPS-Server, SQLite-Datenbankverwaltung, Dateisystem-API, Benutzerverwaltung und WebSockets. Es wird als NPM-Paket eingebunden und benötigt nur eine einzige Konfigurationszeile zum Starten.

```bash
npm install @hilderonny/arrange
```

---

## Schnellstart

```js
// Server.mjs
import ArrangeServer from '@hilderonny/arrange'

const server = new ArrangeServer({
    port: 8443,
    useSSL: true,
    crtFile: './server.crt',
    keyFile:  './server.key',
    htmlPaths: { '/': './html' },   // Statische Dateien unter /
    dataPath: './data',             // SQLite-Datenbanken + Benutzerdateien
    useWebsockets: true,
    name: 'Meine App'
})
server.start()
// node --experimental-sqlite Server.mjs
```

---

## Dokumentation

| Datei | Inhalt |
|---|---|
| **[docs/README.md](./docs/README.md)** | Vollständiger Dokumentationsindex + Architekturüberblick |
| **[docs/QUICKSTART.md](./docs/QUICKSTART.md)** | Anwendung in 5 Minuten aufsetzen |
| **[docs/SERVER.md](./docs/SERVER.md)** | `ArrangeServer`-Klasse, alle Optionen, mehrere `htmlPaths` |
| **[docs/API.md](./docs/API.md)** | Vollständige REST-API-Referenz |
| **[docs/CLIENT.md](./docs/CLIENT.md)** | Client-Bibliothek `arrange.mjs` (Browser) |
| **[docs/DATABASEOBJECT.md](./docs/DATABASEOBJECT.md)** | ORM-Klasse `DatabaseObject` |
| **[docs/WEBSOCKETS.md](./docs/WEBSOCKETS.md)** | WebSocket-Protokoll und Räume |
| **[docs/USE_CASES.md](./docs/USE_CASES.md)** | Architekturmuster und Anwendungsbeispiele |
| **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)** | Linux-Dienst, Docker, SSL, Umgebungsvariablen |

---

## Was Arrange mitbringt

| Feature | Beschreibung |
|---|---|
| **HTTPS/HTTP-Server** | Basiert auf Express.js, optional SSL |
| **Benutzerverwaltung** | Registrierung, Login, Session-Cookies (SHA-256-Passwörter) |
| **Datei-API** | Upload/Download/Listing für öffentliche und private Dateien je Benutzer |
| **Datenbank-API** | SQLite-CRUD über REST, Schema-Migration, SELECT-Abfragen |
| **WebSockets** | Räume, Broadcasts, Direktnachrichten (binäres Protokoll) |
| **Clientbibliothek** | `arrange.mjs` kapselt alle API-Aufrufe im Browser |
| **ORM** | `DatabaseObject`-Basisklasse für typisierte Datenbankzugriffe |
| **Multi-Path** | `htmlPaths` erlaubt mehrere statische Routen, auch außerhalb des Repos |

---

## Reservierte URL-Pfade

| Pfad | Verwendung |
|---|---|
| `/api/` | REST-API |
| `/arrange/` | Clientbibliothek-Ressourcen |
| `/ws/` | WebSockets |

---

## Beispielprojekte

- **[Forensics](https://github.com/hilderonny/forensics)** – Fallverwaltung für digitale Forensik (DB + Dateien + WebSockets)
- **[DemoServer.mjs](./DemoServer.mjs)** – Multi-Path-Demo mit drei statischen Verzeichnissen

---

## Entwicklung

```bash
# Node.js installieren
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
\. "$HOME/.nvm/nvm.sh"
nvm install 24

# Repo klonen
git clone https://github.com/hilderonny/arrange.git
cd arrange
npm install

# Demo starten (F5 in VS Code oder:)
node --experimental-sqlite DemoServer.mjs
# → https://localhost:8443
```

```bash
# NPM-Paket veröffentlichen
npm adduser
npm version 7.1.0
npm publish --access public
```

---

## Lizenz

[MIT](./LICENSE.md)


---

*Diese Datei wurde mit [Claude Code](https://claude.ai/code) unter Verwendung des Modells **claude-sonnet-4-6** generiert.*
