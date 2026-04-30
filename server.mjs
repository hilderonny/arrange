import fs from 'fs'
import https from 'https'
import { WebSocketServer } from 'ws'
import { ArgumentParser } from 'argparse'
import ExpressApplication from './ExpressApplication.mjs'

/********** Kommandozeilenparameter prüfen **********/

const argumentParser = new ArgumentParser( { description: 'Arrange SSL Webserver' })
argumentParser.add_argument('--port', { default: '8443', help: 'Port to listen to (default: 8443)' })
argumentParser.add_argument('--datapath', { default: './data', help: 'Path where the application data files live (default: ./data)' })
argumentParser.add_argument('--crtfile', { default: './server.crt', help: 'Path to the TLS certificate file (default: ./server.crt)' })
argumentParser.add_argument('--keyfile', { default: './server.key', help: 'Path to the TLS private key file (default: ./server.key)' })
argumentParser.add_argument('--tokensecret', { help: 'Secret for encrypting session tokens' })
argumentParser.add_argument('--htmlpath', { action: 'append', help: 'Mount path for static HTML content. Can be defined multiply, e.g. "--htmlpath /=/var/www --htmlpath /subfolder=/var/subfolder"' })
const commandLineArguments = argumentParser.parse_args()

const htmlPaths = {}
for (const assignment of commandLineArguments.htmlpath) {
    const parts = assignment.split('=')
    htmlPaths[parts[0]] = parts[1]
}

/********** Server **********/

// Express Anwendung vorbereiten
const expressApplication = new ExpressApplication(commandLineArguments.datapath, htmlPaths, commandLineArguments.tokensecret)

// Server vorbereiten
const httpsServer = https.createServer({
    key: fs.readFileSync(commandLineArguments.keyfile),
    cert: fs.readFileSync(commandLineArguments.crtfile),
}, expressApplication.app)

// Websocketverbindungen behandeln
const webSocketServer = new WebSocketServer({ server: httpsServer })
webSocketServer.on('connection', expressApplication.handleWebsocketConnection.bind(expressApplication))

// HTTP-Server starten, geht in Endlosschleife
httpsServer.listen(commandLineArguments.port, () => {
    console.log('Arrange läuft an PORT ' + commandLineArguments.port)
})
