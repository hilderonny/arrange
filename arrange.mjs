import fs from 'fs'
import http from 'http'
import https from 'https'
import { WebSocketServer } from 'ws'
import ExpressApplication from './ExpressApplication.mjs'

export default {

    /**
     * createServer - options
     *
     * @typedef {Object} CreateServerOptions
     * @property {string} [crtFile] - Dateipfad zum SSL-Zertifikat. Nur notwendig mit useSSL:true.
     * @property {string} [dataPath] - Verzeichnispfad, in welchem sämtliche Daten abgelegt werden sollen. Default: "./data".
     * @property {Object} [htmlPaths] - Zuordnungen von Sub-Urls (Objekt-Key) zu Verzeichnispfaden (Objekt-Wert), z.B. '{ "/": "./html", "/wiki", "../wiki/html" }
     * @property {string} [keyFile] - Dateipfad zum privaten SSL-Schlüssel. Nur notwendig mit useSSL:true.
     * @property {string} [name] - Name der Anwendung, wie sie in Log-Ausgaben erscheinen soll. Default: "Arrange".
     * @property {number} [port] - Port, an dem der Server lauschen soll. Default: 8080.
     * @property {string} [tokenSecret] - Zeichenkette, mit der die Benutzer-Sessions verschlüsselt werden sollen. Wenn nicht angegeben, wird bei jedem Start ein zufälliger Token generiert.
     * @property {boolean} [useSSL] - Gibt an, ob SSL verwendet werden soll. Default: false.
     * @property {boolean} [useWebsockets] - Gibt an, ob Websockets bereitgestellt werden sollen. Default: false.
     */

    /**
     * createServer - return value
     *
     * @typedef {Object} CreateServerReturn
     * @property {typeof ExpressApplication.prototype.serveStatic} serveStatic
     * @property {() => void} start Startet den Server und geht in eine Endlosschleife
     */

    /**
     * Erstellt einen Arrange-Server.
     * Der Server wird noch nicht gestartet, um noch zusätzliche Routen definieren zu können.
     * 
     * @param {CreateServerOptions} [options] - Einstellungen
     * @returns {CreateServerReturn} Serverinstanz
    */
    createServer(options) {
        // Express Anwendung vorbereiten
        const expressApplication = new ExpressApplication(
            options.dataPath || './data',
            options.htmlPaths || [],
            options.tokenSecret || Math.random().toString()
        )
        // Server vorbereiten
        let server
        if (options.useSSL) {
            server = https.createServer({
                key: fs.readFileSync(options.keyFile),
                cert: fs.readFileSync(options.crtFile),
            }, expressApplication.app)
        } else {
            server = http.createServer(expressApplication.app)
        }
        // Websocketverbindungen behandeln
        if (options.useWebsockets) {
            const webSocketServer = new WebSocketServer({ server: server })
            webSocketServer.on('connection', expressApplication.handleWebsocketConnection.bind(expressApplication))
        }
        return {
            start() {
                // HTTP-Server starten, geht in Endlosschleife
                server.listen(options.port, () => {
                    console.log(`${options.name} läuft an PORT ${options.port}`)
                })
            }
        }
    }

}