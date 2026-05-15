# arrange

Arrange ist ein kleiner SSL-Webserver, der Funktionen zum Verwalten von Dateien und SQLite-Datenbanken auf dem Server sowie Websockets mitbringt.

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
```

In Visual Studio Code kann man mit **F5** einen lokalen HTTPS-Server an Port `8443` starten.

# Verwendung

Im Prinzip läuft Arrange als eigener Webserver.
Man erstellt irgendwo ein Verzeichnis und platziert seine HTML-Seiten darin.
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

## Starten über Kommandozeile

```sh
git clone https://github.com/hilderonny/arrange.git
cd arrange
npm ci

node ./server.mjs --port 8443 --datapath ./data --crtfile ./server.crt --keyfile ./server.key --tokensecret hubbelebubbele --htmlpath /=/html/root --htmlpath /subfolder1=/html/subfolder1 --htmlpath /subfolder2=/html/subfolder2
```

Die Parameter haben folgende Bedeutung.

|Parameter|Bedeutung|
|-|-|
|`port`|Port, an welchem der Webserver mit SSL lauschen soll, z.B. `8443`|
|`datapath`|Pfad, wo Arrange Anwendungsdateien und Datenbanken speichert|
|`htmlpath`|Mapping von Verzeichnis-Mounts (ähnlich Docker Volume Mounts)|
|`tokensecret`|Schlüssel für Anmeldetoken|
|`crtfile`|Pfad zur SSL Zertifikatsdatei|
|`keyfile`|Pfad zur SSL Schlüsseldatei|

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
ExecStart=/######PFAD_ZU_NODE###### --experimental-sqlite /######PFAD_ZU_ARRANGE######/server.mjs --port 8443 --datapath /data --crtfile /server.crt --keyfile /server.key --tokensecret hubbelebubbele --htmlpath /=/html/root --htmlpath /subfolder1=/html/subfolder1 --htmlpath /subfolder2=/html/subfolder2
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
