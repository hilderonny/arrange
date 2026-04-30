import fs from 'fs'
import https from 'https'
import { WebSocketServer } from 'ws'
import ExpressApplication from './ExpressApplication.mjs'


/********** Umgebungsvariablen prüfen **********/

for (const environmentVariable of [ 'ARRANGE_PORT', 'ARRANGE_DATA_PATH', 'ARRANGE_HTML_PATH', 'ARRANGE_TOKEN_SECRET', 'ARRANGE_CRT_FILE', 'ARRANGE_KEY_FILE' ]) {
    if (!process.env[environmentVariable]) {
        console.error(`Environment variable ${environmentVariable} is missing. Cannot start.`)
        process.exit()
    }
}

/********** Server **********/

// TODO Umgebungsvariable auf Kommandozeilenparameter umbauen
// TODO Mehrfache statische Seiten-Mounts zulassen

// Express Anwendung vorbereiten
const expressApplication = new ExpressApplication(process.env.ARRANGE_DATA_PATH, process.env.ARRANGE_HTML_PATH, process.env.ARRANGE_TOKEN_SECRET)

// Server vorbereiten
const httpsServer = https.createServer({
    key: fs.readFileSync(process.env.ARRANGE_KEY_FILE),
    cert: fs.readFileSync(process.env.ARRANGE_CRT_FILE),
}, expressApplication.app)

// Websocketverbindungen behandeln
const webSocketServer = new WebSocketServer({ server: httpsServer })
webSocketServer.on('connection', expressApplication.handleWebsocketConnection.bind(expressApplication))

// HTTP-Server starten, geht in Endlosschleife
httpsServer.listen(process.env.ARRANGE_PORT, () => {
    console.log('Arrange läuft an PORT ' + process.env.ARRANGE_PORT)
})
