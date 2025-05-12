import express from 'express'
import { loadDatabase } from './database/database.mjs'
import { loadModules } from './helpers/modulehelper.mjs'
import http from 'http'
import https from 'https'
import fs from 'fs'
import * as logHelper from './helpers/loghelper.mjs'
import * as apiHelper from './helpers/apihelper.mjs'
import cookieParser from 'cookie-parser'

/**
 * Erstellt und starten eine arrange Instanz
 * 
 * @param {string} database_directory Pfad zum Verzeichnis, in dem alle Datenbandateien liegen
 * @param {string} use_ssl Verwendet SSL, wenn `true` angegeben ist
 * @param {string} private_key_file Pfad zur privaten SSL Schlüsseldatei
 * @param {string} public_certificate_file Pfad zum öffentlichen SSL Zertifikat
 * @param {int} port Port, an dem arrange als Webanwendung lauschen soll
 * @param {string} token_secret Schlüssel, der für JSON WebTokens verwendet wird
 * @param {string[]} modules_to_load Liste von Modulverzeichnissen, die geladen werden sollen
 * @returns arrange-Objekt
 */
async function start(database_directory, use_ssl, private_key_file, public_certificate_file, port, token_secret, modules_to_load) {

    logHelper.log('[ARRANGE] Arrange wird gestartet.')

    // Datenbank laden
    const database = loadDatabase(database_directory, logHelper.log)

    // Webserver initialisieren
    const webServer = express()
    webServer.use(express.json()) // request.body automatisch in JSON konvertieren lassen
    webServer.use(cookieParser()) // Cookies für JSON Web Token verwenden

    // Arrange Objekt vorbereiten
    const arrange = {
        database: database,
        webServer: webServer,
        tokenSecret: token_secret,
        apps: [],
        metadata: {},
        log: logHelper.log,
        logError: logHelper.error,
        logWarning: logHelper.warn,
        apiHelper: apiHelper,
        express: express
    }

    // Module laden
    await loadModules(modules_to_load, arrange)

    // HTTPS Server initialisieren und starten
    const httpOrHttpsServer = use_ssl === 'true' ? https.createServer({
        key: fs.readFileSync(private_key_file),
        cert: fs.readFileSync(public_certificate_file)
    }, webServer) : http.createServer(webServer)
    return new Promise(resolve => {
        httpOrHttpsServer.listen(port, () => {
            logHelper.log('[ARRANGE] Arrange läuft unter %s://127.0.0.1:%s.', use_ssl === 'true' ? 'https' : 'http', port)
            // Bei Rückgabe das arrange Objekt mitgeben, damit Module registriert werden können
            resolve(arrange)
        })
    })

}

export { start }