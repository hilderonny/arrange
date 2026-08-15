import cookieSession from 'cookie-session'
import express from 'express'
import fs from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path/posix'
import { WebSocketServer } from 'ws'

import config from './config.mjs'
import serverUtils from './utils/serverUtils.mjs'
import websocketUtils from './utils/websocketUtils.mjs'

// Express Anwendung vorbereiten
const expressApplication = await serverUtils.createExpressApplication()

// Server vorbereiten
let httpServer
if (config.useSSL) {
    httpServer = https.createServer({
        key: fs.readFileSync(config.keyFile),
        cert: fs.readFileSync(config.crtFile),
    }, expressApplication)
} else {
    httpServer = http.createServer(expressApplication)
}

// Websocketverbindungen behandeln
if (config.useWebsockets) {
    const webSocketServer = new WebSocketServer({ server: httpServer })
    webSocketServer.on('connection', websocketUtils.handleWebsocketConnection)
}

// Startet den Server und geht in eine Endlosschleife
httpServer.listen(config.port, () => {
    console.log(`${config.name} läuft an PORT ${config.port}`)
})