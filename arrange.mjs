import express from 'express'
import { loadDatabase } from './helpers/databasehelper.mjs'
import { loadModules } from './helpers/modulehelper.mjs'
import https from 'https'
import fs from 'fs'
import { log } from './helpers/loghelper.mjs'


log('[ARRANGE] Arrange wird gestartet.')


// Konfigurationsdatei laden
import localConfig  from './localconfig.json' with { type: 'json' }

// Datenbank initialisieren
loadDatabase(localConfig.sqlitefilepath)

// Webanwendung initialisieren
const app = express()

// Module laden
loadModules(localConfig.modulespath, app)

// HTTPS Server initialisieren und starten
const httpsOptions = {
  key: fs.readFileSync(localConfig.privatekeyfile),
  cert: fs.readFileSync(localConfig.publiccertificatefile)
}
const httpsServer = https.createServer(httpsOptions, app)
httpsServer.listen(localConfig.httpsport, () => {
  log('[ARRANGE] Arrange läuft unter http://127.0.0.1:%s.', localConfig.httpsport)
})