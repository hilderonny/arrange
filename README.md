# arrange


## Grundinstallation mit Home und Benutzervweraltung

Zuerst mus NodeJS installiert sein.

```sh
git clone https://github.com/hilderonny/arrange-home

git clone https://github.com/hilderonny/arrange-users
cd arrange-users
npm install
cd ..

git clone https://github.com/hilderonny/arrange
cd arrange
npm install
```


## Konfiguration

Zum Verwenden von arrange wird eine Startdatei erzeugt, z.B. `server.mjs`, die grundlegend folgenden Inhalt hat.

```js
import { start } from './arrange.mjs'

start(
    process.env.ARRANGE_DATABASE_DIRECTORY, // Pfad zum Verzeichnis, in dem alle Datenbandateien liegen. Z.B. "./database/"
    process.env.ARRANGE_USE_SSL, // Wenn "true", wird ein HTTPS-Server mit den Zertifikats- und Schlüsseldateien gestartet, ansonsten ein einfacher HTTP-Server
    process.env.ARRANGE_PRIVATE_KEY_FILE, // Pfad zur privaten SSL Schlüsseldatei. Z.B. "./priv.key". Nur notwendig für ARRANGE_USE_SSL
    process.env.ARRANGE_PUBLIC_CERTIFICATE_FILE, // Pfad zum öffentlichen SSL Zertifikat. Z.B. "./pub.cert". Nur notwendig für ARRANGE_USE_SSL
    process.env.ARRANGE_PORT, // Port, an dem Arrange als Webanwendung lauschen soll. Z.B. "80" oder "443"
    process.env.ARRANGE_TOKEN_SECRET, // Schlüssel, der für JSON WebTokens verwendet wird. Z.B. "irgendwas"
    [ // Liste von Modul, die geladen werden sollen
        '../arrange-home/module.mjs',
        '../arrange-users/module.mjs'
    ]
)
```

Alle Pfadangaben sind entweder relativ zu `server.mjs` oder absolut anzugeben.

## Starten

Windows Kommandozeile (fehlende Leerzeichen vor `&&` beachten!)

```cmd
REM Mit SSL
SET ARRANGE_DATABASE_DIRECTORY=./database/&& SET ARRANGE_USE_SSL=true&& SET ARRANGE_PUBLIC_CERTIFICATE_FILE=./pub.cert&& SET ARRANGE_PRIVATE_KEY_FILE=./priv.key&& SET ARRANGE_PORT=443&& SET ARRANGE_TOKEN_SECRET=hubbelebubbele&& node server.mjs

REM Ohne SSL
SET ARRANGE_DATABASE_DIRECTORY=./database/&& SET ARRANGE_HTTP_PORT=80&& SET ARRANGE_TOKEN_SECRET=hubbelebubbele&& node server.mjs
```

Powershell

```ps
# Mit SSL
$env:ARRANGE_DATABASE_DIRECTORY="./database/"; $env:ARRANGE_USE_SSL="true"; $env:ARRANGE_PUBLIC_CERTIFICATE_FILE="./pub.cert"; $env:ARRANGE_PRIVATE_KEY_FILE="./priv.key"; $env:ARRANGE_PORT="443"; $env:ARRANGE_TOKEN_SECRET="hubbelebubbele"; node server.mjs

# Ohne SSL
$env:ARRANGE_DATABASE_DIRECTORY="./database/"; $env:ARRANGE_PORT="80"; $env:ARRANGE_TOKEN_SECRET="hubbelebubbele"; node server.mjs
```

## Installation als Dienst unter Ubuntu

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
Environment="ARRANGE_USE_SSL=true"
Environment="ARRANGE_PUBLIC_CERTIFICATE_FILE=./pub.cert"
Environment="ARRANGE_PRIVATE_KEY_FILE=./priv.key"
Environment="ARRANGE_PORT=443"
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
