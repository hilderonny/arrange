# arrange

[![Node.js CI](https://github.com/hilderonny/arrange/actions/workflows/node.js.yml/badge.svg)](https://github.com/hilderonny/arrange/actions/workflows/node.js.yml)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/hilderonny/arrange)

Arrange ist ein **Node.js-Framework** für HTTPS-Webanwendungen mit SQLite-Datenbankverwaltung, Dateisystem-API, Benutzerverwaltung und WebSockets.
Es wird als NPM-Paket eingebunden.

## Dokumentation

- [API-Referenz](./API.md)
- [Basisklasse `DatabaseObject`](./DATABASEOBJECT.md)
- [Client-Bibliothek `arrange.mjs`](./CLIENT.md)

## Schnellstart

### 1. Verzeichnis anlegen und Abhängigkeiten installieren

```sh
mkdir meine-app && cd meine-app
npm init -y
npm install @hilderonny/arrange
```

### 2. Eigenes SSL-Zertifikat erstellen

```sh
openssl req -x509 -newkey rsa:2048 -nodes -keyout server.key -out server.crt
```

### 3. Webseite anlegen

#### html/index.html

```html
<!DOCTYPE html>
<html>
    <head>
        <script type="module">

            import * as Arrange from '/arrange/js/arrange.mjs'
            // Arrange prüft automatisch Login-Status und zeigt ggf. Login-Dialog

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
    </head>
    <body>
        <h1>Meine Arrange-App</h1>
    </body>
</html>
```

### 4. Server erstellen

#### Server.mjs

```js
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

### 5. Server starten

```sh
node --experimental-sqlite Server.mjs
```

## Reservierte URL-Pfade

|Pfad|Verwendung|
|-|--|
|`/api/`|REST-API|
|`/arrange/`|Client-Bibliothek|
|`/ws/`|WebSockets|

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

# Demo starten (oder F5 in VS Code)
node --experimental-sqlite DemoServer.mjs
# https://localhost:8443
```

```bash
# NPM-Paket veröffentlichen
npm adduser
npm version 7.1.1
npm publish --access public --tag latest
```

## Als Linux-Systemdienst einrichten

```bash
sudo nano /etc/systemd/system/meine-app.service
sudo systemctl enable meine-app
sudo systemctl start meine-app
```

### `/etc/systemd/system/meine-app.service`

```ini
[Unit]
Description=Meine Arrange-App

[Service]
ExecStart=/PFAD/ZU/node --experimental-sqlite /PFAD/ZU/REPO/Server.mjs
WorkingDirectory=/PFAD/ZU/REPO
Restart=always
RestartSec=10
Environment=TOKEN_SECRET=mein-geheimes-token
Environment=DATA_PATH=/var/meine-app/data

[Install]
WantedBy=multi-user.target
```

## Docker

### Dockerfile

```dockerfile
FROM node:24-slim

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

EXPOSE 8443

CMD ["node", "--experimental-sqlite", "Server.mjs"]
```

### Docker-Build und -Start

```sh
docker build -t meine-app .
docker run -d \
    --name meine-app \
    -p 8443:8443 \
    -v ./data:/app/data \
    -e TOKEN_SECRET=geheim \
    meine-app
```
