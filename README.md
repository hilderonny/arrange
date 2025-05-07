# arrange


## Installation

1. NodeJS installieren
2. Repository klonen
3. Terminal öffnen, `npm install` aufrufen


## Konfiguration

Zum Verwenden von arrange wird eine Startdatei erzeugt, z.B. `server.mjs`, die grundlegend folgenden Inhalt hat.

```js
import { start } from './arrange.mjs'

start(
    process.env.ARRANGE_DATABASE_DIRECTORY, // Pfad zum Verzeichnis, in dem alle Datenbandateien liegen. Z.B. "./database/"
    process.env.ARRANGE_PRIVATE_KEY_FILE, // Pfad zur privaten SSL Schlüsseldatei. Z.B. "./priv.key"
    process.env.ARRANGE_PUBLIC_CERTIFICATE_FILE, // Pfad zum öffentlichen SSL Zertifikat. Z.B. "./pub.cert"
    process.env.ARRANGE_HTTPS_PORT, // Port, an dem Arrange als Webanwendung lauschen soll. Z.B. "443"
    process.env.ARRANGE_TOKEN_SECRET, // Schlüssel, der für JSON WebTokens verwendet wird. Z.B. "irgendwas"
    [ './modules/home', './modules/users' ] // Liste von Modulverzeichnissen, die geladen werden sollen
)
```

Alle Pfadangaben sind entweder relativ zu `server.mjs` oder absolut anzugeben.

## Starten

Windows Kommandozeile (fehlende Leerzeichen vor `&&` beachten!)

```cmd
SET ARRANGE_DATABASE_DIRECTORY=./database/&& SET ARRANGE_PUBLIC_CERTIFICATE_FILE=./pub.cert&& SET ARRANGE_PRIVATE_KEY_FILE=./priv.key&& SET ARRANGE_HTTPS_PORT=443&& SET ARRANGE_TOKEN_SECRET=hubbelebubbele&& node server.mjs
```

Powershell

```ps
$env:ARRANGE_DATABASE_DIRECTORY="./database/"; $env:ARRANGE_PUBLIC_CERTIFICATE_FILE="./pub.cert"; $env:ARRANGE_PRIVATE_KEY_FILE="./priv.key"; $env:ARRANGE_HTTPS_PORT="443"; $env:ARRANGE_TOKEN_SECRET="hubbelebubbele"; node server.mjs
```







# ALT

## 2021 Installation on Ubuntu

```sh
curl -s https://raw.githubusercontent.com/hilderonny/arrange/main/install.sh | sh
```

Installs NodeJS v15, git, actual Postgres database and downloads the github repository into the current folder.
After that it creates a service "arrange" and starts it on ports 80 and 443.
The database "arrange" will be created and will get an user "arrange" / "arrange" which is used by the application.
An admin user gets created the credentials "admin" / "admin".

Make sure that you call this script from the folder where you want to install the sources into!

## Webserver content

The content of the `/files` directory are served as webserver content.

## APIs

Under [/api](./api/README.md) there are several JSON based APIs handling with files, metadata, records and SQL queries.
