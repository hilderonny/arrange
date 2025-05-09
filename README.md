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

## Installation unter Ubuntu

Zuvor muss NodeJS installiert worden sein.

```sh
git clone https://github.com/hilderonny/arrange.git
cd arrange
npm install
```

Datei `/etc/systemd/system/arrange.service` mit folgendem Inhalt erstellen:

```ini
[Unit]
Description=arrange

[Service]
ExecStart=/usr/bin/node /github/hilderonny/arrange/server.mjs
WorkingDirectory=/github/hilderonny/arrange
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=arrange
Environment="ARRANGE_DATABASE_DIRECTORY=./database/"
Environment="ARRANGE_PUBLIC_CERTIFICATE_FILE=./pub.cert"
Environment="ARRANGE_PRIVATE_KEY_FILE=./priv.key"
Environment="ARRANGE_HTTPS_PORT=443"
Environment="ARRANGE_TOKEN_SECRET=hubbelebubbele"

[Install]
WantedBy=multi-user.target
````

Dienst einrichten und starten

```sh
sudo systemctl enable arrange
sudo systemctl start arrange
```

Aktualisierung geht so, in `arrange`-Verzeichnis:

```sh
git pull
sudo systemctl restart arrange
```
