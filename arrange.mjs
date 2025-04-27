import express from 'express'
import * as databasehelper from './helpers/databasehelper.mjs'
import { loadModules } from './helpers/modulehelper.mjs'
import https from 'https'
import fs from 'fs'
import * as logHelper from './helpers/loghelper.mjs'


logHelper.log('[ARRANGE] Arrange wird gestartet.')

// Konfigurationsdatei laden
import localConfig  from './localconfig.json' with { type: 'json' }


(async () => {

    // Datenbank initialisieren
    databasehelper.loadDatabase(localConfig.sqlitefilepath)

    // Webserver initialisieren
    const webServer = express()

    // Arrange Objekt vorbereiten
    const arrange = {
        databaseHelper: databasehelper,
        webServer: webServer,
        localConfig: localConfig,
        apps: [],
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