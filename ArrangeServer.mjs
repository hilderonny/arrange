import fs from 'fs'
import http from 'node:http'
import https from 'node:https'
import { WebSocketServer } from 'ws'
import ExpressApplication from './ExpressApplication.mjs'

export default class ArrangeServer {

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
     * Optionen
     */
    #options

    /**
     * Erstellt einen Arrange-Server.
     * Der Server wird noch nicht gestartet.
     * 
     * @param {CreateServerOptions} [options] - Einstellungen
    */
    constructor(options = {}) {
        this.#options = options
        // Default-Werte festlegen
        if (!options.dataPath) options.dataPath = './data'
        if (!options.htmlPaths) options.htmlPaths = {}
        if (!options.name) options.name = 'Arrange'
        if (!options.htmlPaths) options.htmlPaths = {}
        if (!options.port) options.port = 8080
        if (!options.tokenSecret) options.tokenSecret = Math.random().toString()
        // Express Anwendung vorbereiten
        this.expressApplication = new ExpressApplication(
            options.dataPath,
            options.htmlPaths,
            options.tokenSecret
        )
        // Server vorbereiten
        if (options.useSSL) {
            this.httpServer = https.createServer({
                key: fs.readFileSync(options.keyFile),
                cert: fs.readFileSync(options.crtFile),
            }, this.expressApplication.app)
        } else {
            this.httpServer = http.createServer(this.expressApplication.app)
        }
        // Websocketverbindungen behandeln
        if (options.useWebsockets) {
            this.webSocketServer = new WebSocketServer({ server: this.httpServer })
            this.webSocketServer.on('connection', this.expressApplication.handleWebsocketConnection.bind(this.expressApplication))
        }
    }

    /**
     * Startet den Server und geht in eine Endlosschleife
     */
    start() {
        // HTTP-Server starten, geht in Endlosschleife
        this.httpServer.listen(this.#options.port, () => {
            console.log(`${this.#options.name} läuft an PORT ${this.#options.port}`)
        })
    }

}