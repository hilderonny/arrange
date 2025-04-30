import express from 'express'
import { loadDatabase } from './database/database.mjs'
import { loadModules } from './helpers/modulehelper.mjs'
import https from 'https'
import fs from 'fs'
import * as logHelper from './helpers/loghelper.mjs'
import cookieParser from 'cookie-parser'

logHelper.log('[ARRANGE] Arrange wird gestartet.')

// Konfigurationsdatei laden
import localConfig  from './localconfig.json' with { type: 'json' }


(async () => {

    // Datenbank laden
    const database = loadDatabase(localConfig.databasedirectory, logHelper.log)

    // Webserver initialisieren
    const webServer = express()
    webServer.use(express.json()) // request.body automatisch in JSON konvertieren lassen
    webServer.use(cookieParser()) // Cookies für JSON Web Token verwenden

    // Arrange Objekt vorbereiten
    const arrange = {
        database: database,
        webServer: webServer,
        localConfig: localConfig,
        apps: [],
        metadata: {},
        log: logHelper.log,
        logError: logHelper.error,
        logWarning: logHelper.warn
    }

    // Module laden
    await loadModules(localConfig.modulespath, arrange)

    // HTTPS Server initialisieren und starten
    const httpsOptions = {
        key: fs.readFileSync(localConfig.privatekeyfile),
        cert: fs.readFileSync(localConfig.publiccertificatefile)
    }
    const httpsServer = https.createServer(httpsOptions, webServer)
    httpsServer.listen(localConfig.httpsport, () => {
        logHelper.log('[ARRANGE] Arrange läuft unter https://127.0.0.1:%s.', localConfig.httpsport)
    })

})()