/**
 * Liste aller verbundenen Websocket-Verbindungen
 */
const allWebsockets = []

/**
 * Nächste verfügbare Id für Websocket-Verbindung
 */
let nextWebsocketId = 0

/**
 * Websocket-Räume
 */
const webSocketRooms = {}

/**
 * Websocket Nachricht empfangen
 */
function handleWebsocketMessage(webSocket, message) {
    const type = message[0]
    switch (type) {
        case 0x10: { // Raum betreten
            const roomNumber = message.readBigUInt64LE(1)
            if (!webSocketRooms[roomNumber]) {
                webSocketRooms[roomNumber] = []
            }
            webSocketRooms[roomNumber].push(webSocket)
        } break
        case 0x20: { // Raum verlassen
            const roomNumber = message.readBigUInt64LE(1)
            if (webSocketRooms[roomNumber]) {
                webSocketRooms[roomNumber].splice(webSocketRooms[roomNumber].indexOf(webSocket), 1)
            }
        } break
        case 0x30: { // Nachricht an Raum senden
            const roomNumber = message.readBigUInt64LE(1)
            const roomParticipants = webSocketRooms[roomNumber]
            if (roomParticipants?.length) {
                const messageContent = message.slice(9)
                const outgoingMessage = Buffer.alloc(17 + messageContent.length)
                outgoingMessage[0] = 0x31
                outgoingMessage.writeBigUint64LE(webSocket.id, 1)
                outgoingMessage.writeBigUint64LE(roomNumber, 9)
                messageContent.copy(outgoingMessage, 17)
                for (const targetWebsocket of roomParticipants) {
                    targetWebsocket.send(outgoingMessage)
                }
            }
        } break
        case 0x40: { // Nachricht an anderen Client senden
            const targetWebsocket = allWebsockets[message.readBigUInt64LE(1)]
            if (targetWebsocket) {
                const messageContent = message.slice(9)
                const outgoingMessage = Buffer.alloc(9 + messageContent.length)
                outgoingMessage[0] = 0x41
                outgoingMessage.writeBigUint64LE(webSocket.id, 1)
                messageContent.copy(outgoingMessage, 9)
                targetWebsocket.send(outgoingMessage)
            }
        } break
    }
}

export default {

    /**
     * Websocket Verbindung wurde aufgebaut
     */
    handleWebsocketConnection(webSocket) {
        webSocket.on('message', message => handleWebsocketMessage(webSocket, message))
        // Websocket-ID an Client senden
        const webSocketId = BigInt(nextWebsocketId++)
        webSocket.id = webSocketId // Für Wiedererkennung
        allWebsockets[webSocketId] = webSocket
        webSocket.on('close', () => { delete allWebsockets[webSocketId] })
        const arrayBuffer = new ArrayBuffer(9)
        const dataView = new DataView(arrayBuffer)
        dataView.setInt8(0, 0x01)
        dataView.setBigInt64(1, webSocketId, true)
        webSocket.send(arrayBuffer)
    }

}