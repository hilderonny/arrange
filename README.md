# arrange

Arrange ist ein kleiner SSL-Webserver, der Funktionen zum Verwalten von Dateien und SQLite-Datenbanken auf dem Server sowie Websockets mitbringt.

[![Node.js CI](https://github.com/hilderonny/arrange/actions/workflows/node.js.yml/badge.svg)](https://github.com/hilderonny/arrange/actions/workflows/node.js.yml)

- [API](API.md)
- [Websockets](WEBSOCKETS.md)
- [Client-Bibliothek arrange.mjs](LIB.md)
- [Basisklasse DatabaseObject](DATABASEOBJECT.md)

# Entwicklung

```sh
# NodeJS unter Linux installieren
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
\. "$HOME/.nvm/nvm.sh"
nvm install 24

# Arrange klonen und Abhängigkeiten installieren
git clone https://github.com/hilderonny/arrange.git
cd arrange
npm install

# NPM Paket veröffentlichen
npm adduser
npm version 7.1.0
npm publish --access public
```

In Visual Studio Code kann man mit **F5** einen lokalen HTTPS-Server an Port `8443` starten.

# Verwendung

Arrange selbst ist "nur" ein NPM-Modul, welches für einen eigenen Webserver benutzt werden kann.
Folgende Beispiele zeigen, wie man Arrange einsetzen kann.

- [lokaler Demo Server](./DemoServer.mjs)
- [Forensics](https://github.com/hilderonny/forensics)

Hier mal als Quellcodeausschnitt:

```js
import ArrangeServer from './ArrangeServer.mjs'

const server = new ArrangeServer({
    crtFile: './server.crt',
    htmlPaths: {
        '/' : './test/html/root',
        '/subfolder1' : './test/html/subfolder1',
        '/subfolder2' : './test/html/subfolder2',
    },
    keyFile: './server.key',
    name: 'Arrange Demo Server',
    port: 8443,
    useSSL: true,
    useWebsockets: true
})

// Server starten
server.start()
```

## SSL-Zertifikat erstellen

Unter Windows habe ich [Win32OpenSSL](https://slproweb.com/products/Win32OpenSSL.html) installiert und den OpenSSL Command Prompt geöffnet.
In Linux uns MacOS ist `openssl` bereits installiert.

```sh
openssl req -x509 -newkey rsa:2048 -nodes -keyout server.key -out server.crt
Country Name (2 letter code) [AU]: leer gelassen
State or Province Name (full name) [Some-State]: leer gelassen
Locality Name (eg, city) []: leer gelassen
Organization Name (eg, company) [Internet Widgits Pty Ltd]: leer gelassen
Organizational Unit Name (eg, section) []: leer gelassen
Common Name (e.g. server FQDN or YOUR name) []:arrange
Email Address []: leer gelassen
```

## Starten über Kommandozeile (Demo)

```sh
git clone https://github.com/hilderonny/arrange.git
cd arrange
npm ci

node --experimental-sqlite ./DemoServer.mjs
```

## Einrichtung als Hintergrunddienst

```sh
git clone https://github.com/hilderonny/arrange.git
cd arrange
npm ci
sudo nano /etc/systemd/system/arrange.service
sudo systemctl enable arrange
sudo systemctl start arrange
```

### /etc/systemd/system/arrange.service

```
[Unit]
Description=arrange

[Service]
ExecStart=/######PFAD_ZU_NODE###### --experimental-sqlite /######PFAD_ZU_ARRANGE######/DemoServer.mjs
WorkingDirectory=/######PFAD_ZU_ARRANGE######
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

# Reservierte URLs

The following URLs and sub paths are reserved and cannot be used by the application.

|URL|Description|
|-|-|
|`/api/`|REST APIs|
|`/arrange/`|Arrange ressources|
|`/ws/`|Websockets|
