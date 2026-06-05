# Quickstart – Eigene Anwendung in 5 Minuten

→ [Dokumentationsindex](./README.md)

---

## 1. Repository anlegen und Abhängigkeiten installieren

```bash
mkdir meine-app && cd meine-app
npm init -y
npm install @hilderonny/arrange
```

## 2. SSL-Zertifikat erstellen (einmalig)

```bash
openssl req -x509 -newkey rsa:2048 -nodes -keyout server.key -out server.crt
# Alle Felder leer lassen, bei "Common Name" z.B. "localhost" eingeben
```

## 3. HTML-Verzeichnis anlegen

```bash
mkdir html
```

```html
<!-- html/index.html -->
<!DOCTYPE html>
<html>
<head>
    <script type="module">
        import * as Arrange from '/arrange/js/arrange.mjs'
        // Arrange prüft automatisch Login-Status und zeigt ggf. Login-Dialog
    </script>
</head>
<body>
    <h1>Meine Arrange-App</h1>
</body>
</html>
```

## 4. Server-Datei erstellen

```js
// Server.mjs
import ArrangeServer from '@hilderonny/arrange'

const server = new ArrangeServer({
    port: 8443,
    useSSL: true,
    crtFile: './server.crt',
    keyFile:  './server.key',
    htmlPaths: { '/': './html' },
    dataPath:  './data',
    useWebsockets: true,
    name: 'Meine App'
})
server.start()
```

## 5. Server starten

```bash
node --experimental-sqlite Server.mjs
# → Meine App läuft an PORT 8443
```

Browser: `https://localhost:8443` (Zertifikatswarnung für selbstsigniertes Zertifikat bestätigen)

---

## Nächste Schritte

| Ziel | Dokument |
|---|---|
| Datenbank nutzen (Erstellen, Lesen, Schreiben) | [API.md](./API.md) · [CLIENT.md](./CLIENT.md) · [DATABASEOBJECT.md](./DATABASEOBJECT.md) |
| Dateien hochladen/herunterladen | [API.md](./API.md) · [CLIENT.md](./CLIENT.md) |
| Echtzeit-Kommunikation | [WEBSOCKETS.md](./WEBSOCKETS.md) |
| Mehrere URL-Pfade / Außenpfade | [SERVER.md](./SERVER.md) |
| Als Linux-Dienst betreiben | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| Anwendungsbeispiele | [USE_CASES.md](./USE_CASES.md) |

---

## Typisches Minimal-Frontend-Pattern

```html
<script type="module">
    import * as Arrange from '/arrange/js/arrange.mjs'
    import DatabaseObject from '/arrange/js/types/DatabaseObject.mjs'

    // Eigene Datenklasse definieren
    class Task extends DatabaseObject {
        static databaseName = 'myapp'
        static tableName = 'Tasks'
    }

    // Datenbank-Schema initialisieren (einmalig beim App-Start)
    await Arrange.updateDatabase('myapp', {
        Tasks: { Title: 'TEXT', Done: 'INTEGER' }
    })

    // Datensatz anlegen
    const task = new Task({ Title: 'Hallo Welt', Done: 0 })
    await task.save()

    // Alle Datensätze laden
    const allTasks = await Task.query('SELECT * FROM Tasks')
    console.log(allTasks)
</script>
```


---

*Diese Datei wurde mit [Claude Code](https://claude.ai/code) unter Verwendung des Modells **claude-sonnet-4-6** generiert.*
