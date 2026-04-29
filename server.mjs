import fs from 'fs'
import https from 'https'
// import { WebSocketServer } from 'ws'
import ExpressApplication from './ExpressApplication.mjs'


/********** Umgebungsvariablen prüfen **********/

for (const environmentVariable of [ 'ARRANGE_PORT', 'ARRANGE_DATA_PATH', 'ARRANGE_HTML_PATH', 'ARRANGE_TOKEN_SECRET', 'ARRANGE_CRT_FILE', 'ARRANGE_KEY_FILE' ]) {
    if (!process.env[environmentVariable]) {
        console.error(`Environment variable ${environmentVariable} is missing. Cannot start.`)
        process.exit()
    }
}

// /********** Konstanten und globale Variable **********/

// let NAECHSTE_WEBSOCKET_ID = 0

// const WEBSOCKETS = {}
// const WEBSOCKET_RAEUME = {}


// /********** API Funktionen **********/

// // Websocket Verbindung wurde aufgebaut
// function behandleWebSocketVerbindung(webSocket) {
//     webSocket.on('message', nachricht => behandleWebSocketNachricht(webSocket, nachricht))
//     // Websocket-ID an Client senden
//     const webSocketId = BigInt(NAECHSTE_WEBSOCKET_ID++)
//     webSocket.id = webSocketId // Für Wiedererkennung
//     WEBSOCKETS[webSocketId] = webSocket
//     webSocket.on('close', () => { delete WEBSOCKETS[webSocketId] })
//     const arrayBuffer = new ArrayBuffer(9)
//     const dataView = new DataView(arrayBuffer)
//     dataView.setInt8(0, 0x01)
//     dataView.setBigInt64(1, webSocketId, true)
//     webSocket.send(arrayBuffer)
// }

// // Websocket Nachricht empfangen
// async function behandleWebSocketNachricht(webSocket, nachricht) {
//     const type = nachricht[0]
//     switch (type) {
//         case 0x10: { // Raum betreten
//             const raumnummer = nachricht.readBigUInt64LE(1)
//             if (!WEBSOCKET_RAEUME[raumnummer]) {
//                 WEBSOCKET_RAEUME[raumnummer] = []
//             }
//             WEBSOCKET_RAEUME[raumnummer].push(webSocket)
//         } break
//         case 0x20: { // Raum verlassen
//             const raumnummer = nachricht.readBigUInt64LE(1)
//             if (WEBSOCKET_RAEUME[raumnummer]) {
//                 WEBSOCKET_RAEUME[raumnummer].splice(WEBSOCKET_RAEUME[raumnummer].indexOf(webSocket), 1)
//             }
//         } break
//         case 0x30: { // Nachricht an Raum senden
//             const raumnummer = nachricht.readBigUInt64LE(1)
//             const raum = WEBSOCKET_RAEUME[raumnummer]
//             if (raum?.length) {
//                 const nachrichteninhalt = nachricht.slice(9)
//                 const ausgehendeNachricht = Buffer.alloc(17 + nachrichteninhalt.length)
//                 ausgehendeNachricht[0] = 0x31
//                 ausgehendeNachricht.writeBigUint64LE(webSocket.id, 1)
//                 ausgehendeNachricht.writeBigUint64LE(raumnummer, 9)
//                 nachrichteninhalt.copy(ausgehendeNachricht, 17)
//                 for (const zielWebSocket of raum) {
//                     zielWebSocket.send(ausgehendeNachricht)
//                 }
//             }
//         } break
//         case 0x40: { // Nachricht an anderen Client senden
//             const zielWebSocket = WEBSOCKETS[nachricht.readBigUInt64LE(1)]
//             if (zielWebSocket) {
//                 const nachrichteninhalt = nachricht.slice(9)
//                 const ausgehendeNachricht = Buffer.alloc(9 + nachrichteninhalt.length)
//                 ausgehendeNachricht[0] = 0x41
//                 ausgehendeNachricht.writeBigUint64LE(webSocket.id, 1)
//                 nachrichteninhalt.copy(ausgehendeNachricht, 9)
//                 zielWebSocket.send(ausgehendeNachricht)
//             }
//         } break
//     }
// }

// /********** Server **********/

// Express Anwendung vorbereiten
const expressApplication = new ExpressApplication(process.env.ARRANGE_DATA_PATH, process.env.ARRANGE_HTML_PATH, process.env.ARRANGE_TOKEN_SECRET)

// Server vorbereiten
const httpsServer = https.createServer({
    key: fs.readFileSync(process.env.ARRANGE_KEY_FILE),
    cert: fs.readFileSync(process.env.ARRANGE_CRT_FILE),
}, expressApplication.app)

// TODO Websocketserver testbar implementieren
// TODO Tests für Websockets
// // Websocketverbindungen behandeln
// const webSocketServer = new WebSocketServer({ server: httpsServer })
// webSocketServer.on('connection', behandleWebSocketVerbindung)

// HTTP-Server starten, geht in Endlosschleife
httpsServer.listen(process.env.ARRANGE_PORT, () => {
    console.log('Arrange läuft an PORT ' + process.env.ARRANGE_PORT)
})
