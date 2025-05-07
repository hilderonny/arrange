import express from 'express'
import { loadDatabase } from './database/database.mjs'
import { loadModules } from './helpers/modulehelper.mjs'
import https from 'https'
import fs from 'fs'
import * as logHelper from './helpers/loghelper.mjs'
import cookieParser from 'cookie-parser'

(async () => {

    logHelper.log('[ARRANGE] Arrange wird gestartet.')

    // Datenbank laden
    const database = loadDatabase(process.env.ARRANGE_DATABASE_DIRECTORY, logHelper.log)

    // Webserver initialisieren
    const webServer = express()
    webServer.use(express.json()) // request.body automatisch in JSON konvertieren lassen
    webServer.use(cookieParser()) // Cookies für JSON Web Token verwenden

    // Arrange Objekt vorbereiten
    const arrange = {
        database: database,
        webServer: webServer,
        apps: [],
        metadata: {},
        log: logHelper.log,
        logError: logHelper.error,
        logWarning: logHelper.warn
    }

    // Module laden
    await loadModules(process.env.ARRANGE_MODULES_PATH, arrange)

    // HTTPS Server initialisieren und starten
    const httpsOptions = {
        key: fs.readFileSync(process.env.ARRANGE_PRIVATE_KEY_FILE),
        cert: fs.readFileSync(process.env.ARRANGE_PUBLIC_CERTIFICATE_FILE)
    }
    const httpsServer = https.createServer(httpsOptions, webServer)
    httpsServer.listen(process.env.ARRANGE_HTTPS_PORT, () => {
        logHelper.log('[ARRANGE] Arrange läuft unter https://127.0.0.1:%s.', process.env.ARRANGE_HTTPS_PORT)
    })

})()