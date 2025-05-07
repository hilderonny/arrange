import express from 'express'
import { loadDatabase } from './database/database.mjs'
import { loadModules } from './helpers/modulehelper.mjs'
import https from 'https'
import fs from 'fs'
import * as logHelper from './helpers/loghelper.mjs'
import cookieParser from 'cookie-parser'

/**
 * Erstellt und starten eine arrange Instanz
 * 
 * @param {string} database_directory Pfad zum Verzeichnis, in dem alle Datenbandateien liegen
 * @param {string} modules_path Verzeichnispfad, in dem die Module zu finden sind
 * @param {string} private_key_file Pfad zur privaten SSL Schlüsseldatei
 * @param {string} public_certificate_file Pfad zum öffentlichen SSL Zertifikat
 * @param {int} https_port Port, an dem arrange als Webanwendung lauschen soll
 * @param {string} token_secret Schlüssel, der für JSON WebTokens verwendet wird
 * @returns arrange-Objekt
 */
async function start(database_directory, modules_path, private_key_file, public_certificate_file, https_port, token_secret) {

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
        logWarning: logHelper.warn
    }

    // Module laden
    await loadModules(modules_path, arrange)

    // HTTPS Server initialisieren und starten
    const httpsOptions = {
        key: fs.readFileSync(private_key_file),
        cert: fs.readFileSync(public_certificate_file)
    }
    const httpsServer = https.createServer(httpsOptions, webServer)
    return new Promise(resolve => {
        httpsServer.listen(https_port, () => {
            logHelper.log('[ARRANGE] Arrange läuft unter https://127.0.0.1:%s.', https_port)
            // Bei Rückgabe das arrange Objekt mitgeben, damit Module registriert werden können
            resolve(arrange)
        })
    })

}

export { start }