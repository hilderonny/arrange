import express from 'express'
import cookieSession from 'cookie-session'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { stat } from 'node:fs/promises'
import sqlite from 'node:sqlite'
import multer from 'multer'

/********** Konstanten und globale Variable **********/

// let NAECHSTE_WEBSOCKET_ID = 0

// const WEBSOCKETS = {}
// const WEBSOCKET_RAEUME = {}




/********** API Funktionen **********/

// Tabelle löschen
async function behandleLoescheDatenbanktabelle(request, response) {
    const datenbank = await ladeDatenbank(request.params.datenbankname)
    const abfrage = datenbank.prepare(`DROP TABLE IF EXISTS ${request.params.tabellenname};`)
    abfrage.run()
    response.sendStatus(200)
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
                if (wert === null) return 'NULL'
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

export default class ExpressApplication {

    /**
     * Liste aller Benutzerinfos
     */
    #allUsers

    /**
     * Pfad zum Verzeichnis, in dem die Datenbanken liegen
     */
    #databasePath

    /**
     * Alle in den Speicher geladenen Datenbanken
     */
    #databases = []

    /**
     * Pfad zum Verzeichnis, welches alle Benutzerdateien enthält
     */
    #filesPath

    /**
     * Pfad zur JSON-Datei mit Benutzerinfos
     */
    #usersJsonPath

    /**
     * Referenz zu Express app für UNIT-Tests
     */
    app
    
    /**
     * Erstellt eine Express-Anwendung und registriert alle Routen.
     * 
     * @param {string} dataPath Pfad zum Stammverzeichnis für Dateien der `files` API
     * @param {string} htmlPath Pfad zum Stammverzeichnis des Webservers, aus dem statisches HTML ausgeliefert wird.
     * @param {string} tokenSecret Secret Key zur Verschlüsselung der Sitzungs-Cookies.
     */
    constructor(dataPath, htmlPath, tokenSecret) {

        this.#usersJsonPath = path.join(dataPath, 'users/users.json')
        this.#filesPath = path.join(dataPath, 'files')
        this.#databasePath = path.join(dataPath, 'databases')

        // Benutzerdatenbank laden
        this.#loadUsers()

        this.app = express()

        // Benutzersessions
        this.app.use(cookieSession({ name: 'session', secret: tokenSecret }))

        // JSON in POST Daten aktivieren
        this.app.use(express.json())

        // Statische HTML Seiten ausliefern, wird reingemountet
        this.app.use(express.static(htmlPath))

        // Arrange-Client-Skripte und Seiten ausliefern
        this.app.use('/arrange', express.static('./client/arrange'))

        // // API-Endpunkte
        this.app.get('/api/autologin', this.#handleGetAutoLogin.bind(this))
        this.app.post('/api/login', this.#handlePostLogin.bind(this))
        this.app.get('/api/logout', this.#handleGetLogout.bind(this))
        this.app.post('/api/register', this.#handlePostRegister.bind(this))
        this.app.delete('/api/files/:userId/*filePath', this.#handleDeletePath.bind(this))
        this.app.get('/api/files/:userId/*filePath', this.#handleGetPath.bind(this))
        this.app.post('/api/files/:userId/*filePath', multer().any(), this.#handlePostFile.bind(this))
        this.app.put('/api/files/:userId/*directoryPath', this.#handlePutDirectoryPath.bind(this))
        this.app.patch('/api/database/:databaseName', this.#handlePatchDatabase.bind(this))
        // TODO Tests für API behandleSpeichereDatensatz
        // expressAnwendung.patch('/api/database/:datenbankname/:tabellenname/:datensatzId', behandleSpeichereDatensatz)
        // TODO Tests für API behandleLoescheDatenbanktabelle
        // expressAnwendung.delete('/api/database/:datenbankname/:tabellenname', behandleLoescheDatenbanktabelle)
        this.app.delete('/api/database/:databaseName/:tableName/:recordId', this.#handleDeleteDatabaseRecord.bind(this))
        this.app.post('/api/database/:databaseName', this.#handlePostDatabaseQuery.bind(this))
    }

    /**
     * Schließt die Datenbanken sauber
     */
    shutDown() {
        for (const database of Object.values(this.#databases)) {
            if (database.isOpen) {
                database.close()
            }
        }
    }
    

    /********** Hilfsfunktionen **********/

    #getUserForUsername(username) {
        return this.#allUsers.find(user => user.username === username)
    }

    #createUserSession(request, userId) {
        request.session.userId = userId
    }
    
    async #loadDatabase(databaseName) {
        let database = this.#databases[databaseName]
        if (!database) {
            const absolutePath = path.resolve(this.#databasePath, databaseName + '.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            this.#databases[databaseName] = database
        }
        return database
    }

    #loadUsers() {
        if (!fs.existsSync(this.#usersJsonPath)) {
            fs.mkdirSync(path.dirname(this.#usersJsonPath), { recursive: true })
            this.#allUsers = []
            this.#saveUsers()
        } else {
            this.#allUsers = JSON.parse(fs.readFileSync(this.#usersJsonPath))
        }
    }

    #saveUsers() {
        fs.writeFileSync(this.#usersJsonPath, JSON.stringify(this.#allUsers, null, '\t'))
    }

    /********** API Funktionen **********/

    // Datensatz löschen
    async #handleDeleteDatabaseRecord(request, response) {
        const database = await this.#loadDatabase(request.params.databaseName)
        const existingTable = database.prepare(`SELECT name FROM sqlite_schema WHERE type='table' AND name='${request.params.tableName}';`).get()
        if (existingTable) {
            const query = database.prepare(`DELETE FROM ${request.params.tableName} WHERE Id = '${request.params.recordId}';`)
            query.run()
        }
        response.sendStatus(200)
    }

    /**
     * Pfad im Dateisystem löschen
     */
    async #handleDeletePath(request, response) {
        const absolutePath = path.resolve(this.#filesPath, request.params.userId, ...request.params.filePath)
        if (fs.existsSync(absolutePath)) {
            fs.rmSync(absolutePath, { recursive: true })
            response.sendStatus(200)
        } else {
            response.sendStatus(404)
        }
    }

    /**
     * Automatische Anmeldung anhand des Cookies
     */
    #handleGetAutoLogin(request, response) {
        if (request.session && request.session.userId) {
            response.sendStatus(200)
        } else {
            response.sendStatus(401)
        }
    }

    /**
     * Benutzer abmelden
     */
    #handleGetLogout(request, response) {
        request.session = null
        response.sendStatus(200)
    }

    /**
     * Datei oder Verzeichnisinhalt liefern
     */
    async #handleGetPath(request, response) {
        const absolutePath = path.resolve(this.#filesPath, request.params.userId, ...request.params.filePath)
        if (!fs.existsSync(absolutePath)) {
            return response.sendStatus(404)
        }
        const pathStats = await stat(absolutePath)
        if (pathStats.isDirectory()) {
            const directoryEntries = fs.readdirSync(absolutePath, { withFileTypes: true })
            const entryList = directoryEntries.map(entry => { return {
                name: entry.name,
                type: entry.isDirectory() ? 'dir' : 'file'
            }})
            response.json(entryList)
        } else {
            response.sendFile(absolutePath)
        }
    }


    /**
     * Datenbankschema aktualisieren
     */
    async #handlePatchDatabase(request, response) {
        if (!request.body?.schema) {
            return response.sendStatus(400)
        }
        const database = await this.#loadDatabase(request.params.databaseName)
        // Erst mal alle Tabellen anlegen, damit sie referenziert werden können
        for (const tableName of Object.keys(request.body.schema)) {
            const createTableStatement = `CREATE TABLE IF NOT EXISTS ${tableName} (Id TEXT PRIMARY KEY NOT NULL);`
            database.exec(createTableStatement)
        }
        // Nochmal drüber iterieren und die Spalten aktualisieren
        for (const [ tableName, tableDefinition ] of Object.entries(request.body.schema)) {
            for (const [ columnName, columnDefinition ] of Object.entries(tableDefinition)) {
                // Spalte nur erstellen, wenn sie noch nicht existiert
                if (database.prepare(`SELECT COUNT(*) AS columnCount FROM pragma_table_info('${tableName}') WHERE name='${columnName}';`).get().columnCount < 1) {
                    const updateStatement = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition};`
                    database.exec(updateStatement)
                }
            }
        }
        response.sendStatus(200)
    }

    /**
     * Informationen aus Datenbank holen.
     * Es sind nur SELECT-Abfragen erlaubt und es dürfen keine Semikola (Anweisungstrenner) enthalten sein
     */
    async #handlePostDatabaseQuery(request, response) {
        const database = await this.#loadDatabase(request.params.databaseName)
        // Abfrage durchführen
        const query = request.body?.query?.toString()
        if (!query || !query.toLowerCase().startsWith('select') || query.includes(';')) {
            return response.sendStatus(400)
        }
        const result = database.prepare(query).all()
        // Ergebnisse als JSON zurück geben
        response.json(result)
    }

    /**
     * Datei speichern
     */
    async #handlePostFile(request, response) {
        const absolutePath = path.resolve(this.#filesPath, request.params.userId, ...request.params.filePath)
        if (!request.files || request.files.length !== 1) {
            response.sendStatus(400)
        } else if (fs.existsSync(absolutePath) && !fs.statSync(absolutePath).isFile()) {
            response.sendStatus(400)
        } else {
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            fs.writeFileSync(absolutePath, request.files[0].buffer)
            response.sendStatus(200)
        }
    }

    /**
     * Benutzer anmelden
     */
    #handlePostLogin(request, response) {
        const username = request.body.username
        const password = request.body.password
        if (!username || !password) return response.sendStatus(400)
        const user = this.#getUserForUsername(username)
        if (!user) return response.sendStatus(401)
        const passwortHash = crypto.createHash('sha256').update(password).digest('hex')
        if (user.password !== passwortHash) return response.sendStatus(401)
            this.#createUserSession(request, user.id)
        response.json({
            id: user.id,
            username: user.username,
        })
    } 

    /**
     * Benutzer registrieren
     */
    #handlePostRegister(request, response) {
        const username = request.body.username
        const password = request.body.password
        if (!username || !password) return response.sendStatus(400)
        const existingUser = this.#getUserForUsername(username)
        if (existingUser) return response.sendStatus(409)
        const passwortHash = crypto.createHash('sha256').update(password).digest('hex')
        const newuser = {
            id: Date.now().toString() + Math.floor(Math.random() * 1000000),
            password: passwortHash,
            username: username,
        }
        this.#allUsers.push(newuser)
        this.#saveUsers()
        this.#createUserSession(request, newuser.id)
        response.json({
            id: newuser.id,
            username: newuser.username,
        })
    }

    /**
     * Verzeichnis erstellen
     */
    #handlePutDirectoryPath(request, response) {
        const absolutePath = path.resolve(this.#filesPath, request.params.userId, ...request.params.directoryPath)
        if (!fs.existsSync(absolutePath)) {
            fs.mkdirSync(absolutePath, { recursive: true })
        }
        response.sendStatus(200)
    }

}