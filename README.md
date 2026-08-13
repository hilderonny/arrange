# arrange

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/hilderonny/arrange)

Arrange ist ein **Node.js-Webserver** mit SQLite-Datenbankverwaltung, Dateisystem-API, Benutzerverwaltung, WebSockets und Gamification.

## Schnellstart

### 1. Repository klonen und Abhängigkeiten installieren

```sh
git clone https://github.com/hilderonny/arrange.git
cd arrange
npm install
```

### 2. Eigenes SSL-Zertifikat erstellen

```sh
openssl req -x509 -newkey rsa:2048 -nodes -keyout server.key -out server.crt
```

### 3. Datei 'config-template.json' nach `config.json' kopieren und anpassen

```json
{
    "port": 8443,
    "useSSL": true,
    "crtFile": "./server.crt",
    "keyFile":  "./server.key",
    "htmlPaths": {
        "/": "PATH_TO_ROOT_HTML_DIRECTORY",
        "/webapp": "PATH_TO_SUBURL_DIRECTORY"
    },
    "dataPath":  "./data",
    "useWebsockets": true,
    "name": "Meine App"
}
```

### 3. Webseite anlegen

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

### 4. Server starten

```sh
node --experimental-sqlite ArrangeServer.mjs
```

## Dokumentation

- [API-Referenz](./API.md)
- [Basisklasse `DatabaseObject`](./DATABASEOBJECT.md)
- [Client-Bibliothek `arrange.mjs`](./CLIENT.md)

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

# F5 in VS Code drücken
# https://localhost:8443
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
ExecStart=/PFAD/ZU/node --experimental-sqlite /PFAD/ZU/REPO/ArrangeServer.mjs
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

CMD ["node", "--experimental-sqlite", "ArrangeServer.mjs"]
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
