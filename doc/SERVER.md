# ArrangeServer – Serverkonfiguration

→ [Dokumentationsindex](./README.md)

---

## Import und Instanziierung

```js
import ArrangeServer from '@hilderonny/arrange'
// oder bei lokalem Klon:
import ArrangeServer from './ArrangeServer.mjs'

const server = new ArrangeServer(options)
server.start()
```

---

## Konstruktor-Optionen

```js
new ArrangeServer({
    // SSL
    useSSL:      true,           // HTTPS aktivieren (default: false)
    crtFile:     './server.crt', // Pfad zum SSL-Zertifikat (nur bei useSSL: true)
    keyFile:     './server.key', // Pfad zum privaten Schlüssel (nur bei useSSL: true)

    // Netzwerk
    port:        8443,           // Port (default: 8080)
    name:        'Meine App',    // Name in Log-Ausgaben (default: 'Arrange')

    // Statische Dateien (siehe unten)
    htmlPaths: {
        '/':         './html',
        '/admin':    './admin-html',
        '/docs':     '../other-repo/docs',   // Pfad außerhalb des Repos möglich
    },

    // Datenspeicherung
    dataPath:    './data',       // Wurzelverzeichnis für Datenbanken + Dateien (default: './data')

    // Sicherheit
    tokenSecret: 'geheimesWort', // Session-Verschlüsselung (default: zufällig, ändert sich bei Neustart)

    // WebSockets
    useWebsockets: true,         // WebSocket-Server aktivieren (default: false)
})
```

### Verzeichnisstruktur unter `dataPath`

```
data/
├── users/
│   └── users.json          ← Benutzerdatenbank
├── files/
│   ├── public/             ← Öffentliche Dateien (/api/files/public/...)
│   └── {userId}/           ← Private Dateien je Benutzer
└── databases/
    └── {datenbankname}.sqlite
```

---

## `htmlPaths` – Mehrere statische Routen (undokumentiertes Feature)

`htmlPaths` ist ein Objekt, das beliebig viele URL-Präfixe auf lokale Verzeichnisse abbildet. Dies ermöglicht:

- **Mehrere Sub-URLs** mit je eigenem HTML-Verzeichnis
- **Pfade außerhalb des Repositories** (z.B. parallele Repos auf dem Dateisystem)
- **Modulare Anwendungen**, bei denen verschiedene Teile aus verschiedenen Quellen stammen

```js
htmlPaths: {
    '/':          './html',              // Hauptanwendung im eigenen Repo
    '/wiki':      '../wiki-repo/html',   // Wiki aus einem anderen Repo
    '/admin':     '../admin-ui/dist',    // Admin-UI aus außerhalb
    '/subfolder': './test/html/sub',     // Unterverzeichnis
}
```

**Wichtige Regeln:**
- Die Pfade werden in der Reihenfolge registriert; spezifischere Pfade vor allgemeineren angeben, falls nötig.
- Reservierte Pfade `/api/`, `/arrange/`, `/ws/` dürfen **nicht** als Keys verwendet werden.
- Relative Pfade werden vom Working Directory des Node.js-Prozesses aus aufgelöst.
- Pfade dürfen auf Verzeichnisse **außerhalb** des aktuellen Repos zeigen.

**Beispiel DemoServer** (aus dem Arrange-Repo selbst):
```js
// DemoServer.mjs
const server = new ArrangeServer({
    crtFile: './server.crt',
    htmlPaths: {
        '/':          './test/html/root',
        '/subfolder1': './test/html/subfolder1',
        '/subfolder2': './test/html/subfolder2',
    },
    keyFile: './server.key',
    name: 'Arrange Demo Server',
    port: 8443,
    useSSL: true,
    useWebsockets: true
})
server.start()
```

---

## `start()`

Startet den HTTP(S)-Server. Blockiert nicht – der Node.js-Event-Loop läuft weiter. Gibt eine Konsolenausgabe aus:

```
Meine App läuft an PORT 8443
```

---

## Zugriff auf interne Express-App

Nach dem Konstruktoraufruf ist `server.expressApplication.app` die Express-Instanz. Damit können eigene Express-Routen ergänzt werden:

```js
const server = new ArrangeServer({ ... })

// Eigene API-Route hinzufügen (MUSS vor server.start() erfolgen)
server.expressApplication.app.get('/api/meinendpunkt', (req, res) => {
    res.json({ hallo: 'welt' })
})

server.start()
```

> **Hinweis:** Eigene Routen sollten unter `/api/` liegen, um nicht mit statischen Dateien zu kollidieren.

### Reservierte API-Routen

Die folgenden Routen werden von Arrange intern belegt und dürfen **nicht** durch eigene Routen überschrieben werden:

| Methode | Pfad | Funktion |
|---------|------|----------|
| `GET`    | `/api/autologin` | Aktive Sitzung prüfen |
| `POST`   | `/api/login` | Benutzer anmelden |
| `GET`    | `/api/logout` | Benutzer abmelden |
| `POST`   | `/api/register` | Benutzer registrieren |
| `GET`    | `/api/files/:userId/*filePath` | Datei laden / Verzeichnis auflisten |
| `POST`   | `/api/files/:userId/*filePath` | Datei hochladen |
| `PUT`    | `/api/files/:userId/*directoryPath` | Verzeichnis erstellen |
| `DELETE` | `/api/files/:userId/*filePath` | Datei oder Verzeichnis löschen |
| `PATCH`  | `/api/database/:databaseName` | Schema erstellen / aktualisieren |
| `POST`   | `/api/database/:databaseName` | SELECT-Abfrage ausführen |
| `PATCH`  | `/api/database/:databaseName/:tableName/:recordId` | Datensatz speichern |
| `DELETE` | `/api/database/:databaseName/:tableName` | Tabelle löschen |
| `DELETE` | `/api/database/:databaseName/:tableName/:recordId` | Datensatz löschen |

Eigene Endpunkte sollten außerhalb dieser Pfadmuster liegen, z.B. `/api/myapp/…`.

---

## Datenbankzugriff vom Server aus

```js
// Datenbank serverseitig laden (für eigene Express-Routen)
const db = await server.expressApplication.loadDatabase('meinedatenbank')
const result = db.prepare('SELECT * FROM Tasks').all()
```

---

## Verwandte Dokumente

- [QUICKSTART.md](./QUICKSTART.md) – Minimales Beispiel
- [API.md](./API.md) – REST-API-Referenz
- [DEPLOYMENT.md](./DEPLOYMENT.md) – Produktivbetrieb
- [USE_CASES.md](./USE_CASES.md) – Anwendungsbeispiele


---

*Diese Datei wurde mit [Claude Code](https://claude.ai/code) unter Verwendung des Modells **claude-sonnet-4-6** generiert.*
