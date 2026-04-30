# arrange

Arrange ist ein kleiner SSL-Webserver, der Funktionen zum Verwalten von Dateien und SQLite-Datenbanken auf dem Server sowie Websockets mitbringt.

- [API](API.md)
- [Client-Bibliothek arrange.mjs](LIB.md)
- [Basisklasse DatabaseObject](DATABASEOBJECT.md)

# Entwicklung

```sh
# NodeJS unter Linux installieren
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
\. "$HOME/.nvm/nvm.sh"
nvm install 24

# Arrange klonen und Abhängigkeiten installieren
git clone http://192.168.178.138:8100/ronny/arrange.git
cd arrange
npm install
```

In Visual Studio Code kann man mit **F5** einen lokalen HTTPS-Server an Port `8443` starten.

# Verwendung

Im Prinzip läuft Arrange als eigener Webserver.
Man erstellt irgendwo ein Verzeichnisund platziert seine HTML-Seiten darin.
Beispielsweise in `/var/www/index.html`.

```html
<html>
    <head>
        <script type="module">
            import * as Arrange from '/arrange/js/arrange.mjs'
            // Beim ersten Aufruf wird automatisch die Anmeldeseite angezeigt
        </script>
    </head>
</html>
```

Danach klont man das `arrange` - Repository und startet Arrange per Kommandozeile oder als Hintergrunddienst.
Dabei müssen folgende Umgebungsvariablen gesetzt sein:

|Umgebungsvariable|Bedeutung|
|-|-|
|ARRANGE_PORT|Port, an welchem der Webserver mit SSL lauschen soll, z.B. `8443`|
|ARRANGE_DATA_PATH|Pfad, wo Arrange Anwendungsdateien und Datenbanken speichert|
|ARRANGE_HTML_PATH|Pfad, wo Arrange Das HTML Stammverzeichnis sucht|
|ARRANGE_TOKEN_SECRET|Schlüssel für Anmeldetoken|
|ARRANGE_CRT_FILE|Pfad zur SSL Zertifikatsdatei|
|ARRANGE_KEY_FILE|Pfad zur SSL Schlüsseldatei|

## Starten über Kommandozeile

```sh
git clone http://192.168.178.138:8100/ronny/arrange.git
cd arrange
npm ci
ARRANGE_PORT=8443 ARRANGE_DATA_PATH=./data ARRANGE_HTML_PATH=./test ARRANGE_TOKEN_SECRET=hubbelebubbele ARRANGE_CRT_FILE=./server.crt ARRANGE_KEY_FILE=./server.key node --experimental-sqlite ./server.mjs
```

## Einrichtung als Hintergrunddienst

```sh
git clone http://192.168.178.138:8100/ronny/arrange.git
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
ExecStart=/######PFAD_ZU_NODE###### --experimental-sqlite /######PFAD_ZU_ARRANGE######/server.mjs
WorkingDirectory=/######PFAD_ZU_ARRANGE######
Restart=always
RestartSec=10
Environment="ARRANGE_PORT=8443"
Environment="ARRANGE_DATA_PATH=######PFAD_ZUM_DATENVERZEICHNIS######"
Environment="ARRANGE_HTML_PATH=######PFAD_ZUM_HTML-VERZEICHNIS######"
Environment="ARRANGE_TOKEN_SECRET=hubbelebubbele"
Environment="ARRANGE_CRT_FILE=######PFAD_ZUR_SSL_ZERTIFIKATSDATEI######"
Environment="ARRANGE_KEY_FILE=######PFAD_ZUR_SSL_SCHLUESSELDATEI######"

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

# Websockets

Messages over websockets contain one byte of type information and the rest as payload in any data structure (defined by application).

## Messages from client to server

|First byte|Meaning|
|-|-|
|`0x10`|Join room. `8` bytes room number|
|`0x20`|Leave room. `8` bytes room number|
|`0x30`|Send broadcast message into room. `8` bytes room number followed by payload|
|`0x40`|Send direct message to client. `8` bytes client ID followed by payload|

## Messages from server to client

|First byte|Meaning|
|-|-|
|`0x01`|`8` bytes of assigned client ID. Sent directly after connecting|
|`0x31`|Broadcast message from client. `8` bytes sender client ID, `8` bytes room ID, followed by payload|
|`0x41`|Direct message from client. `8` bytes sender client ID followed by payload|

# Bibliothek /arrange/js/arrange.mjs

```js
connectWebSocket(serverMessageCallback({type, senderId, roomId, clientId, message}))
joinRoom(roomNumber)
leaveRoom(roomNumber)
sendMessageToClient(clientId, textMessage)
sendMessageToRoom(roomNumber, textMessage)
```

# SSL-Zertifikat erstellen

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
