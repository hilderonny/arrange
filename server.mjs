import express from 'express'
import cookieSession from 'cookie-session'
import crypto from 'node:crypto'
import fs from 'fs'
import https from 'https'
import path from 'node:path'
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises'
import multer from 'multer'
import { WebSocketServer } from 'ws'
import sqlite from 'node:sqlite'


/********** Konstanten und globale Variable **********/


let ALLE_BENUTZER = []
let NAECHSTE_WEBSOCKET_ID = 0

const BENUTZER_JSON_PFAD = './data/users/users.json' // Pfad zur JSON-Datei mit Benutzerinfos
const DATEIEN_PFAD = './data/files' // Pfad zu den Dateien
const PORT = process.env.PORT
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'hubbelebubbele'
const UPLOAD_HANDLER = multer()
const WEBSOCKETS = {}
const WEBSOCKET_RAEUME = {}
const DATENBANKEN = {}
const DATENBANKEN_PFAD = './data/databases'

/********** Hilfsfunktionen **********/

function benutzerFuerBenutzername(benutzername) {
    return ALLE_BENUTZER.find(benutzer => benutzer.username === benutzername)
}

function erstelleBenutzersitzung(request, benutzerId) {
    request.session.userId = benutzerId
}

function ladeBenutzer() {
    if (!fs.existsSync(BENUTZER_JSON_PFAD)) {
        fs.mkdirSync(path.dirname(BENUTZER_JSON_PFAD), { recursive: true })
        ALLE_BENUTZER = []
        speichereBenutzer()
    } else {
        ALLE_BENUTZER = JSON.parse(fs.readFileSync(BENUTZER_JSON_PFAD))
    }
}

async function ladeDatenbank(datenbankname) {
    let datenbank = DATENBANKEN[datenbankname]
    if (!datenbank) {
        const absoluterPfad = path.resolve(DATENBANKEN_PFAD, datenbankname + '.sqlite')
        await mkdir(path.dirname(absoluterPfad), { recursive: true })
        datenbank = new sqlite.DatabaseSync(absoluterPfad)
        DATENBANKEN[datenbankname] = datenbank
    }
    return datenbank
}

function speichereBenutzer() {
    fs.writeFileSync(BENUTZER_JSON_PFAD, JSON.stringify(ALLE_BENUTZER, null, '\t'))
}


/********** API Funktionen **********/

async function behandleAktualisiereDatenbankschema(request, response) {
    if (!request.body.schema) {
        return response.sendStatus(400)
    }
    const datenbank = await ladeDatenbank(request.params.datenbankname)
    for (const [ tabellenname, tabellendefinition ] of Object.entries(request.body.schema)) {
        // Tabelle bei Bedarf anlegen, Id-Spalte wird immer generiert
        datenbank.exec(`CREATE TABLE IF NOT EXISTS ${tabellenname} (Id TEXT);`)
        for (const [ spaltenname, spaltendefinition ] of Object.entries(tabellendefinition)) {
            // Spalte nur erstellen, wenn sie noch nicht existiert
            if (datenbank.prepare(`SELECT COUNT(*) AS anzahl FROM pragma_table_info('${tabellenname}') WHERE name='${spaltenname}';`).get().anzahl < 1) {
                datenbank.exec(`ALTER TABLE ${tabellenname} ADD COLUMN ${spaltenname} ${spaltendefinition};`)
            }
        }
    }
    response.sendStatus(200)
}

// Informationen aus Datenbank holen.
// Es sind nur SELECT-Abfragen erlaubt und es dürfen keine Semikola (Anweisungstrenner) enthalten sein
async function behandleDatenbankabfrage(request, response) {
    const datenbank = await ladeDatenbank(request.params.datenbankname)
    // Abfrage durchführen
    const auszufuehrendeAbfrage = request.body.abfrage
    if (!auszufuehrendeAbfrage || !auszufuehrendeAbfrage.toLowerCase().startsWith('select') || auszufuehrendeAbfrage.includes(';')) {
        return response.sendStatus(400)
    }
    const ergebnis = datenbank.prepare(auszufuehrendeAbfrage).all()
    // Ergebnisse als JSON zurück geben
    response.json(ergebnis)
}

// Pfad löschen
async function behandleDeleteDateipfad(request, response) {
    const absoluterPfad = path.resolve(DATEIEN_PFAD, request.params.benutzerId, ...request.params.pfad)
    try {
        await rm(absoluterPfad, { recursive: true })
        response.sendStatus(200)
    } catch (e) {
        response.sendStatus(404)
    }
}

// Automatische Anmeldung anhand des Cookies
function behandleGetAutoLogin(request, response) {
    if (request.session && request.session.userId) {
        response.sendStatus(200)
    } else {
        response.sendStatus(401)
    }
}

// Datei oder Verzeichnisliste liefern
async function behandleGetDateipfad(request, response) {
    const absoluterPfad = path.resolve(DATEIEN_PFAD, request.params.benutzerId, ...request.params.pfad)
    if (!fs.existsSync(absoluterPfad)) {
        return response.sendStatus(404)
    }
    const pfadEigenschaften = await stat(absoluterPfad)
    if (pfadEigenschaften.isDirectory()) {
        const verzeichniseintraege = await readdir(absoluterPfad, { withFileTypes: true })
        const verzeichnisliste = verzeichniseintraege.map(eintrag => { return {
            name: eintrag.name,
            type: eintrag.isDirectory() ? 'dir' : 'file'
        }})
        response.json(verzeichnisliste)
    } else if (pfadEigenschaften.isFile()) {
        response.sendFile(absoluterPfad)
    } else {
        return response.sendStatus(400)
    }
}

// Benutzer abmelden
function behandleGetLogout(request, response) {
    if (request.session) {
        delete request.session.userId
    }
    response.sendStatus(200)
}

// Datensatz löschen
async function behandleLoescheDatensatz(request, response) {
    const datenbank = await ladeDatenbank(request.params.datenbankname)
    const abfrage = datenbank.prepare(`DELETE FROM ${request.params.tabellenname} WHERE Id = '${request.params.datensatzId}';`)
    abfrage.run()
    response.sendStatus(200)
}

// Datei speichern
async function behandlePostDateipfad(request, response) {
    const absoluterPfad = path.resolve(DATEIEN_PFAD, request.params.benutzerId, ...request.params.pfad)
    await mkdir(path.dirname(absoluterPfad), { recursive: true })
    try {
        await writeFile(absoluterPfad, request.files[0].buffer)
        response.sendStatus(200)
    } catch (fehlermeldung) {
        response.status(400).send(fehlermeldung)
    }
}

// Benutzer anmelden
function behandlePostLogin(request, response) {
    const benutzername = request.body.username
    const passwort = request.body.password
    if (!benutzername || !passwort) return response.sendStatus(400)
    const benutzer = benutzerFuerBenutzername(benutzername)
    if (!benutzer) return response.sendStatus(401)
    const passwortHash = crypto.createHash('sha256').update(passwort).digest('hex')
    if (benutzer.password !== passwortHash) return response.sendStatus(401)
    erstelleBenutzersitzung(request, benutzer.id)
    response.json({
        id: benutzer.id,
        username: benutzer.username,
    })
} 

// Benutzer registrieren
function behandlePostRegister(request, response) {
    const benutzername = request.body.username
    const passwort = request.body.password
    if (!benutzername || !passwort) return response.sendStatus(400)
    const existierenderBenutzer = benutzerFuerBenutzername(benutzername)
    if (existierenderBenutzer) return response.sendStatus(409)
    const passwortHash = crypto.createHash('sha256').update(passwort).digest('hex')
    const neuerBenutzer = {
        id: Date.now().toString() + Math.floor(Math.random() * 1000000),
        password: passwortHash,
        username: benutzername,
    }
    ALLE_BENUTZER.push(neuerBenutzer)
    speichereBenutzer()
    erstelleBenutzersitzung(request, neuerBenutzer.id)
    response.json({
        id: neuerBenutzer.id,
        username: neuerBenutzer.username,
    })
}

// Verzeichnis erstellen
async function behandlePutDateipfad(request, response) {
    const absoluterPfad = path.resolve(DATEIEN_PFAD, request.params.benutzerId, ...request.params.pfad)
    try {
        await mkdir(absoluterPfad, { recursive: true })
        response.sendStatus(200)
    } catch (fehlermeldung) {
        response.status(400).send(fehlermeldung)
    }
}

// Websocket Verbindung wurde aufgebaut
function behandleWebSocketVerbindung(webSocket) {
    webSocket.on('message', nachricht => behandleWebSocketNachricht(webSocket, nachricht))
    // Websocket-ID an Client senden
    const webSocketId = BigInt(NAECHSTE_WEBSOCKET_ID++)
    webSocket.id = webSocketId // Für Wiedererkennung
    WEBSOCKETS[webSocketId] = webSocket
    webSocket.on('close', () => { delete WEBSOCKETS[webSocketId] })
    const arrayBuffer = new ArrayBuffer(9)
    const dataView = new DataView(arrayBuffer)
    dataView.setInt8(0, 0x01)
    dataView.setBigInt64(1, webSocketId, true)
    webSocket.send(arrayBuffer)
}

async function behandleSpeichereDatensatz(request, response) {
    if (!request.body.felder) {
        return response.sendStatus(400)
    }
    const datenbank = await ladeDatenbank(request.params.datenbankname)
    // Prüfen, ob Datensatz bereits existiert
    if (datenbank.prepare(`SELECT COUNT(*) AS anzahl FROM ${request.params.tabellenname} WHERE Id='${request.params.datensatzId}';`).get().anzahl < 1) {
        // Existiert noch nicht, also neu anlegen
        const zuErstellenderDatensatz = request.body.felder
        zuErstellenderDatensatz.Id = request.params.datensatzId
        const abfragezeichenkette = [
            'INSERT INTO ',
            request.params.tabellenname,
            ' (',
            Object.keys(zuErstellenderDatensatz).join(','),
            ') VALUES (',
            Object.values(zuErstellenderDatensatz).map(wert => {
                switch (typeof(wert)) {
                    case 'undefined': return 'NULL'
                    case 'boolean': return wert ? '1' : '0'
                    case 'number': return wert
                    default: return `'${('' + wert).toString().replaceAll(`'`, `''`)}'`
                }
            }).join(','),
            ');'
        ].join('')
        const abfrage = datenbank.prepare(abfragezeichenkette)
        abfrage.run()
    } else {
        // Existiert, also aktualisieren
        const abfragezeichenkette = [
            'UPDATE ',
            request.params.tabellenname,
            ' SET ',
            Object.entries(request.body.felder).map(([ feldname, feldwert ]) => {
                let zeichenkette = feldname + '='
                switch (typeof(feldwert)) {
                    case 'undefined': zeichenkette += 'NULL'; break
                    case 'boolean': zeichenkette += feldwert ? '1' : '0'; break
                    case 'number': zeichenkette += feldwert; break
                    default: zeichenkette += `'${('' + feldwert).toString().replaceAll(`'`, `''`)}'`; break
                }
                return zeichenkette
            }).join(', '),
            ` WHERE Id='`,
            request.params.datensatzId,
            `';`
        ].join('')
        const abfrage = datenbank.prepare(abfragezeichenkette)
        abfrage.run()
    }
    // Vollständigen Datensatz zurück geben
    const datensatz = datenbank.prepare(`SELECT * FROM ${request.params.tabellenname} WHERE Id='${request.params.datensatzId}';`).get()
    response.json(datensatz)
}

// Websocket Nachricht empfangen
async function behandleWebSocketNachricht(webSocket, nachricht) {
    const type = nachricht[0]
    switch (type) {
        case 0x10: { // Raum betreten
            const raumnummer = nachricht.readBigUInt64LE(1)
            if (!WEBSOCKET_RAEUME[raumnummer]) {
                WEBSOCKET_RAEUME[raumnummer] = []
            }
            WEBSOCKET_RAEUME[raumnummer].push(webSocket)
        } break
        case 0x20: { // Raum verlassen
            const raumnummer = nachricht.readBigUInt64LE(1)
            if (WEBSOCKET_RAEUME[raumnummer]) {
                WEBSOCKET_RAEUME[raumnummer].splice(WEBSOCKET_RAEUME[raumnummer].indexOf(webSocket), 1)
            }
        } break
        case 0x30: { // Nachricht an Raum senden
            const raumnummer = nachricht.readBigUInt64LE(1)
            const raum = WEBSOCKET_RAEUME[raumnummer]
            if (raum?.length) {
                const nachrichteninhalt = nachricht.slice(9)
                const ausgehendeNachricht = Buffer.alloc(17 + nachrichteninhalt.length)
                ausgehendeNachricht[0] = 0x31
                ausgehendeNachricht.writeBigUint64LE(webSocket.id, 1)
                ausgehendeNachricht.writeBigUint64LE(raumnummer, 9)
                nachrichteninhalt.copy(ausgehendeNachricht, 17)
                for (const zielWebSocket of raum) {
                    zielWebSocket.send(ausgehendeNachricht)
                }
            }
        } break
        case 0x40: { // Nachricht an anderen Client senden
            const zielWebSocket = WEBSOCKETS[nachricht.readBigUInt64LE(1)]
            if (zielWebSocket) {
                const nachrichteninhalt = nachricht.slice(9)
                const ausgehendeNachricht = Buffer.alloc(9 + nachrichteninhalt.length)
                ausgehendeNachricht[0] = 0x41
                ausgehendeNachricht.writeBigUint64LE(webSocket.id, 1)
                nachrichteninhalt.copy(ausgehendeNachricht, 9)
                zielWebSocket.send(ausgehendeNachricht)
            }
        } break
    }
}

/********** Server **********/


// Benutzerdatenbank laden
ladeBenutzer()

const expressAnwendung = express()

// Benutzersessions
expressAnwendung.use(cookieSession({
    name: 'session',
    secret: TOKEN_SECRET,
}))

// JSON in POST Daten aktivieren
expressAnwendung.use(express.json())

// Statische HTML Seiten ausliefern, wird reingemountet
expressAnwendung.use(express.static('./html'))

// Arrange-Client-Skripte und Seiten ausliefern
expressAnwendung.use('/arrange', express.static('./arrange'))

// API-Endpunkte
expressAnwendung.get('/api/autologin', behandleGetAutoLogin)
expressAnwendung.post('/api/login', behandlePostLogin)
expressAnwendung.get('/api/logout', behandleGetLogout)
expressAnwendung.post('/api/register', behandlePostRegister)
expressAnwendung.delete('/api/files/:benutzerId/*pfad', behandleDeleteDateipfad)
expressAnwendung.get('/api/files/:benutzerId/*pfad', behandleGetDateipfad)
expressAnwendung.post('/api/files/:benutzerId/*pfad', UPLOAD_HANDLER.any(), behandlePostDateipfad)
expressAnwendung.put('/api/files/:benutzerId/*pfad', behandlePutDateipfad)
expressAnwendung.patch('/api/datenbank/:datenbankname', behandleAktualisiereDatenbankschema)
expressAnwendung.patch('/api/datenbank/:datenbankname/:tabellenname/:datensatzId', behandleSpeichereDatensatz)
expressAnwendung.delete('/api/datenbank/:datenbankname/:tabellenname/:datensatzId', behandleLoescheDatensatz)
expressAnwendung.post('/api/datenbank/:datenbankname', behandleDatenbankabfrage)

// Server vorbereiten
const httpsServer = https.createServer({
    key: fs.readFileSync('./server.key'),
    cert: fs.readFileSync('./server.crt'),
}, expressAnwendung)

// Websocketverbindungen behandeln
const webSocketServer = new WebSocketServer({ server: httpsServer })
webSocketServer.on('connection', behandleWebSocketVerbindung)

// HTTP-Server starten, geht in Endlosschleife
httpsServer.listen(PORT, () => {
    console.log('Arrange läuft an PORT ' + PORT)
})
