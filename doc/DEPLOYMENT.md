# Deployment

→ [Dokumentationsindex](./README.md)

---

## SSL-Zertifikat erstellen

```bash
openssl req -x509 -newkey rsa:2048 -nodes -keyout server.key -out server.crt
# Alle Felder können leer gelassen werden.
# "Common Name": Hostname oder IP des Servers (z.B. "meinserver.de" oder "localhost")
```

**Unter Windows:** [Win32OpenSSL](https://slproweb.com/products/Win32OpenSSL.html) installieren und OpenSSL Command Prompt öffnen.

Für Produktivbetrieb: Zertifikat von einer CA (z.B. Let's Encrypt) verwenden.

---

## Node.js installieren (Linux)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
\. "$HOME/.nvm/nvm.sh"
nvm install 24
```

---

## Anwendung installieren

```bash
git clone https://github.com/mein-user/meine-app.git
cd meine-app
npm install
```

---

## Manueller Start

```bash
node --experimental-sqlite Server.mjs
```

> Das Flag `--experimental-sqlite` ist erforderlich, da Arrange die eingebaute SQLite-Unterstützung von Node.js 24 nutzt.

---

## Als Linux-Systemdienst einrichten (systemd)

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

**Pfade anpassen:**
- Node.js-Pfad: `which node` oder `$(nvm which 24)`
- Repo-Pfad: absoluter Pfad zum Repository

**Dienst-Befehle:**
```bash
sudo systemctl start   meine-app   # Starten
sudo systemctl stop    meine-app   # Stoppen
sudo systemctl restart meine-app   # Neustarten
sudo systemctl status  meine-app   # Status anzeigen
sudo systemctl daemon-reload       # Nach jeder Änderung der .service-Datei erforderlich
journalctl -u meine-app -f         # Logs verfolgen
```

---

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

```bash
docker build -t meine-app .
docker run -d \
    --name meine-app \
    -p 8443:8443 \
    -v ./data:/app/data \
    -e TOKEN_SECRET=geheim \
    meine-app
```

**Praxisbeispiel** (forensics):
```bash
docker run -d --name forensics -p 8443:8443 -v ./data:/app/data hilderonny2024/forensics
```

---

## Daten sichern

Alle persistenten Daten liegen unter `dataPath` (default: `./data`):

```
data/
├── users/users.json       ← Benutzerdatenbank
├── files/                 ← Hochgeladene Dateien
└── databases/             ← SQLite-Datenbanken
```

Einfaches Backup:
```bash
tar czf backup-$(date +%Y%m%d).tar.gz ./data
```

---

## Umgebungsvariablen (empfohlen für Produktion)

```bash
# In /etc/systemd/system/meine-app.service oder docker-compose.yml
TOKEN_SECRET=langes-zufaelliges-geheimnis   # Pflicht für stabile Sessions
PORT=8443
DATA_PATH=/var/meine-app/data
CRT_FILE=/etc/ssl/certs/meine-app.crt
KEY_FILE=/etc/ssl/private/meine-app.key
```

```js
// Server.mjs
const server = new ArrangeServer({
    port:        parseInt(process.env.PORT        || '8443'),
    useSSL:      true,
    crtFile:     process.env.CRT_FILE             || './server.crt',
    keyFile:     process.env.KEY_FILE             || './server.key',
    htmlPaths:   { '/': './html' },
    dataPath:    process.env.DATA_PATH            || './data',
    tokenSecret: process.env.TOKEN_SECRET,
    useWebsockets: true,
    name:        'Meine App'
})
server.start()
```

---

## Verwandte Dokumente

- [SERVER.md](./SERVER.md) – Alle Konfigurationsoptionen
- [QUICKSTART.md](./QUICKSTART.md) – Schnelles lokales Setup


---

*Diese Datei wurde mit [Claude Code](https://claude.ai/code) unter Verwendung des Modells **claude-sonnet-4-6** generiert.*
