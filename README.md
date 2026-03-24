# arrange

## Entwicklung

```sh
gh repo clone arrange
cd arrange
npm install
```

In Visual Studio kann man mit **F5** einen lokalen HTPS-Server an Port `3000` starten.

Das Docker Image kann so gebaut, deployed und getestet werden:

```sh
# Bauen
docker build --platform linux/amd64,linux/arm64 -t hilderonny2024/arrange:2.3.0 .

# Testen
docker run -d -v ./data:/app/data -v ./html:/app/html -p 3000:3000 hilderonny2024/arrange:2.3.0

# Auf Docker Hub deployen
docker login
docker push hilderonny2024/arrange:2.3.0
```

## Benutzung mit Docker

```sh
docker run --name myarrangeserver -d -v /LOCALDATAPATH:/app/data -v /LOCALWEBROOT:/app/html -v /LOCALWEBSUBFOLDER:/app/html/subfolder -p 3000:3000 hilderonny2024/arrange:2.3.0
```

## Integration

```html
<html>
    <head>
        <script type="module">
            import * as Arrange from './arrange/js/arrange.js'
        </script>
    </head>
</html>
```

## Reserved URLs

The following URLs and sub paths are reserved and cannot be used by the application.

|URL|Description|
|-|-|
|`/api/`|REST APIs|
|`/arrange/`|Arrange ressources|
|`/ws/`|Websockets|

## API

```
GET /api/autologin
GET /api/logout
POST /api/login
POST /api/register

DELETE /api/files/{userid}/{path...}
GET /api/files/{userid}/{filepath...}
POST /api/files/{userid}/{filepath...}
PUT /api/files/{userid}/{path...}

PATCH /api/datenbank/{datenbankname}
PATCH /api/datenbank/{datenbankname}/{tabellenname}/{datensatzId}
POST /api/datenbank/{datenbankname}/{tabellenname}
DELETE /api/datenbank/{datenbankname}/{tabellenname}/{datensatzId}
POST /api/datenbank/{datenbankname}
```

## Websockets

Messages over websockets contain one byte of type information and the rest as payload in any data structure (defined by application).

### Messages from client to server

|First byte|Meaning|
|-|-|
|`0x10`|Join room. `8` bytes room number|
|`0x20`|Leave room. `8` bytes room number|
|`0x30`|Send broadcast message into room. `8` bytes room number followed by payload|
|`0x40`|Send direct message to client. `8` bytes client ID followed by payload|

### Messages from server to client

|First byte|Meaning|
|-|-|
|`0x01`|`8` bytes of assigned client ID. Sent directly after connecting|
|`0x31`|Broadcast message from client. `8` bytes sender client ID, `8` bytes room ID, followed by payload|
|`0x41`|Direct message from client. `8` bytes sender client ID followed by payload|

## /js/arrange.js

```js
logout()

createPrivatePath(path)
createPublicPath(path)
deletePrivatePath(path)
deletePublicPath(path)
getPrivateFile(filePath)
getPublicFile(filePath)
postPrivateFile(filePath, fileContent)
postPublicFile(filePath, fileContent)

connectWebSocket(serverMessageCallback({type, senderId, roomId, clientId, message}))
joinRoom(roomNumber)
leaveRoom(roomNumber)
sendMessageToClient(clientId, textMessage)
sendMessageToRoom(roomNumber, textMessage)

aktualisiereDatenbankschema(datenbankname, schema)
aktualisiereDatensatz(datenbankname, tabellenname, datensatzId, felder)
erstelleDatensatz(datenbankname, tabellenname, datensatz)
loescheDatensatz(datenbankname, tabellenname, datensatzId)
macheDatenbankabfrage(datenbankname, abfrage)
```

## Zertifikat erstellt

Zuerst habe ich [Win32OpenSSL](https://slproweb.com/products/Win32OpenSSL.html) installiert und den OpenSSL Command Prompt geöffnet.

```cmd
openssl req -x509 -newkey rsa:2048 -nodes -keyout server.key -out server.crt
Country Name (2 letter code) [AU]:DE
State or Province Name (full name) [Some-State]:Thueringen
Locality Name (eg, city) []:Erfurt
Organization Name (eg, company) [Internet Widgits Pty Ltd]:TLKA
Organizational Unit Name (eg, section) []:DBE
Common Name (e.g. server FQDN or YOUR name) []:SENECA
Email Address []:ronny.hildebrandt@polizei.thueringen.de
```
