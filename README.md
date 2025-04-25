# arrange


## Installation

1. Repository klonen
2. Terminal öffnen, `.\nodejs\npm install` aufrufen


## Konfiguration

Die Konfiguration der Instanz erfolgt in der Datei `/localconfig.json`, die ein Objekt mit Einstellungen enthält.
Alle Pfadangaben sind entweder relativ zu `arrange.mjs` oder absolut anzugeben.

|Schlüssel|Bedeutung|Beispiel|
|---|---|---|
|`sqlitefilepath`|Pfad zur SQLite Datenbankdatei|`./database/database.sqlite`|
|`publiccertificatefile`|Pfad zum öffentlichen SSL Zertifikat|`./pub.cert`|
|`privatekeyfile`|Pfad zur privaten SSL Schlüsseldatei|`./priv.key`|
|`httpsport`|Port, an dem Arrange als Webanwendung lauschen soll|`443`|
|`modulespath`|Verzeichnispfad, in dem die Module zu finden sind|`./modules`|
|`tokensecret`|Schlüssel, der für JSON WebTokens verwendet wird|`irgendwas`|

## Starten

```cmd
.\nodejs\node .\server.mjs`
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
