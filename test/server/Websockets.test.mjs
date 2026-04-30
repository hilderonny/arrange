import path from 'node:path'
import fs from 'node:fs'
import { afterEach, beforeEach, describe, it } from 'node:test'
import supertest from 'supertest'
import ExpressApplication from '../../ExpressApplication.mjs'
import assert from 'node:assert'

function createWebsocketMock() {
    return {
        eventListeners: {},
        on: function (eventName, callback) {
            if (!this.eventListeners[eventName]) {
                this.eventListeners[eventName] = []
            }
            this.eventListeners[eventName].push(callback)
        },
        send: () => {},
        sendEvent: async function (eventName, message) {
            if (this.eventListeners[eventName]) {
                for (const callback of this.eventListeners[eventName]) {
                    await callback(message)
                }
            }
        },
    }
}

function prepareJoinRoomMessage(roomNumber) {
    const arrayBuffer = new ArrayBuffer(9)
    const dataView = new DataView(arrayBuffer)
    dataView.setInt8(0, 0x10)
    dataView.setBigInt64(1, roomNumber, true)
    return Buffer.from(arrayBuffer)
}

function prepareLeaveRoomMessage(roomNumber) {
    const arrayBuffer = new ArrayBuffer(9)
    const dataView = new DataView(arrayBuffer)
    dataView.setInt8(0, 0x20)
    dataView.setBigInt64(1, roomNumber, true)
    return Buffer.from(arrayBuffer)
}

function prepareMessageToClient(clientId, textMessage) {
    const textBytes = new TextEncoder().encode(textMessage)
    const arrayBuffer = new ArrayBuffer(9 + textBytes.length)
    const dataView = new DataView(arrayBuffer)
    dataView.setInt8(0, 0x40)
    dataView.setBigInt64(1, clientId, true)
    new Uint8Array(arrayBuffer).set(textBytes, 9)
    return Buffer.from(arrayBuffer)
}

function prepareMessageToRoom(roomNumber, textMessage) {
    const textBytes = new TextEncoder().encode(textMessage)
    const arrayBuffer = new ArrayBuffer(9 + textBytes.length)
    const dataView = new DataView(arrayBuffer)
    dataView.setInt8(0, 0x30)
    dataView.setBigInt64(1, roomNumber, true)
    new Uint8Array(arrayBuffer).set(textBytes, 9)
    return Buffer.from(arrayBuffer)
}

describe('Websockets', () => {

    let expressApplication

    beforeEach(async () => {
        const dataPath = './test/data'
        const fullPath = path.resolve(dataPath)
        if (fs.existsSync(fullPath)) {
            fs.rmSync(fullPath, { recursive: true })
        }
        expressApplication = new ExpressApplication(
            dataPath,
            { '/': './test/html/root' }, // htmlPaths
            'test_secret', // tokenSecret
        )
        // Benutzer anlegen
        await supertest(expressApplication.app).post('/api/register').send({ username: 'testusername', password: 'testpassword' }).expect(200)
    })

    afterEach(() => {
        expressApplication.shutDown()
    })
    
    it('Erhält keine Nachrichten, die mit 0x10 beginnen.', async () => {
        // Erhalt eigener Nachrichten prüfen
        const meinWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(meinWebsocket)
        meinWebsocket.send = (message) => {
            assert.notStrictEqual(message[0], 0x10)
        }
        // So tun, als ob anderer Websocket eine Nachricht schickt
        const andererWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(andererWebsocket)
        andererWebsocket.sendEvent('message', prepareJoinRoomMessage(13n))
    })
    
    it('Erhält keine Nachrichten, die mit 0x20 beginnen.', async () => {
        // Erhalt eigener Nachrichten prüfen
        const meinWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(meinWebsocket)
        meinWebsocket.send = (message) => {
            assert.notStrictEqual(message[0], 0x20)
        }
        // So tun, als ob anderer Websocket eine Nachricht schickt
        const andererWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(andererWebsocket)
        andererWebsocket.sendEvent('message', prepareJoinRoomMessage(13n))
        andererWebsocket.sendEvent('message', prepareLeaveRoomMessage(13n))
    })
    
    it('Erhält keine Nachrichten, die mit 0x30 beginnen.', async () => {
        // Erhalt eigener Nachrichten prüfen
        const meinWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(meinWebsocket)
        meinWebsocket.send = (message) => {
            console.log(message)
            assert.notStrictEqual(message[0], 0x30)
        }
        // So tun, als ob anderer Websocket eine Nachricht schickt
        const andererWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(andererWebsocket)
        andererWebsocket.sendEvent('message', prepareMessageToRoom(13n, 'Hallo Raum'))
    })
    
    it('Erhält keine Nachrichten, die mit 0x40 beginnen.', async () => {
        // Erhalt eigener Nachrichten prüfen
        const meinWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(meinWebsocket)
        meinWebsocket.send = (message) => {
            assert.notStrictEqual(message[0], 0x40)
        }
        // So tun, als ob anderer Websocket eine Nachricht schickt
        const andererWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(andererWebsocket)
        andererWebsocket.sendEvent('message', prepareMessageToClient(meinWebsocket.id, 'Hallo Du da'))
    })
    
    it('Wenn anderer Teilnehmer 0x30 Nachricht sendet und man im selben Raum ist, wird 0x31 Nachricht erhalten.', async () => {
        // Erhalt eigener Nachrichten prüfen
        const meinWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(meinWebsocket)
        meinWebsocket.sendEvent('message', prepareJoinRoomMessage(13n)) // Raum betreten
        meinWebsocket.send = (message) => {
            assert.strictEqual(message[0], 0x31)
        }
        // So tun, als ob anderer Websocket eine Nachricht schickt
        const andererWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(andererWebsocket)
        andererWebsocket.sendEvent('message', prepareMessageToRoom(13n, 'Hallo Raum'))
    })
    
    it('Wenn anderer Teilnehmer 0x30 Nachricht sendet und man im selben Raum mehrmals angemeldet ist, wird 0x31 Nachricht mehrmals erhalten.', async () => {
        // Erhalt eigener Nachrichten prüfen
        const meinWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(meinWebsocket)
        meinWebsocket.sendEvent('message', prepareJoinRoomMessage(13n)) // Raum betreten
        meinWebsocket.sendEvent('message', prepareJoinRoomMessage(13n)) // Raum nochmal betreten
        let callCount = 0
        meinWebsocket.send = (message) => {
            assert.strictEqual(message[0], 0x31)
            callCount++
        }
        // So tun, als ob anderer Websocket eine Nachricht schickt
        const andererWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(andererWebsocket)
        andererWebsocket.sendEvent('message', prepareMessageToRoom(13n, 'Hallo Raum'))
        assert.strictEqual(callCount, 2)
    })
    
    it('Wenn anderer Teilnehmer 0x30 Nachricht sendet nachdem man einen Raum verlassen hat, wird keine 0x31 Nachricht erhalten.', async () => {
        // Erhalt eigener Nachrichten prüfen
        const meinWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(meinWebsocket)
        meinWebsocket.sendEvent('message', prepareJoinRoomMessage(13n)) // Raum betreten
        meinWebsocket.sendEvent('message', prepareLeaveRoomMessage(13n)) // Raum verlassen
        meinWebsocket.send = (message) => {
            assert.notStrictEqual(message[0], 0x31)
        }
        // So tun, als ob anderer Websocket eine Nachricht schickt
        const andererWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(andererWebsocket)
        andererWebsocket.sendEvent('message', prepareMessageToRoom(13n, 'Hallo Raum'))
    })
    
    it('Wenn anderer Teilnehmer 0x30 Nachricht sendet und man im selben Raum mehrmals angemeldet war und sich einmal abgemeldet hat, wird 0x31 Nachricht nur noch einmal erhalten.', async () => {
        // Erhalt eigener Nachrichten prüfen
        const meinWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(meinWebsocket)
        meinWebsocket.sendEvent('message', prepareJoinRoomMessage(13n)) // Raum betreten
        meinWebsocket.sendEvent('message', prepareJoinRoomMessage(13n)) // Raum nochmal betreten
        meinWebsocket.sendEvent('message', prepareLeaveRoomMessage(13n)) // Raum verlassen
        let callCount = 0
        meinWebsocket.send = (message) => {
            assert.strictEqual(message[0], 0x31)
            callCount++
        }
        // So tun, als ob anderer Websocket eine Nachricht schickt
        const andererWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(andererWebsocket)
        andererWebsocket.sendEvent('message', prepareMessageToRoom(13n, 'Hallo Raum'))
        assert.strictEqual(callCount, 1)
    })
    
    it('Wenn anderer Teilnehmer 0x30 Nachricht sendet und man nicht im selben Raum ist, wird keine 0x31 Nachricht erhalten.', async () => {
        // Erhalt eigener Nachrichten prüfen
        const meinWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(meinWebsocket)
        meinWebsocket.send = (message) => {
            assert.notStrictEqual(message[0], 0x31)
        }
        // So tun, als ob anderer Websocket eine Nachricht schickt
        const andererWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(andererWebsocket)
        andererWebsocket.sendEvent('message', prepareMessageToRoom(13n, 'Hallo Raum'))
    })
    
    it('Wenn anderer Teilnehmer 0x40 Nachricht an dritten Teilnehmer sendet, erhält man selbst keine 0x41 Nachricht.', async () => {
        // Erhalt eigener Nachrichten prüfen
        const meinWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(meinWebsocket)
        meinWebsocket.send = (message) => {
            assert.notStrictEqual(message[0], 0x41)
        }
        // So tun, als ob anderer Websocket eine Nachricht schickt
        const andererWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(andererWebsocket)
        const dritterWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(dritterWebsocket)
        andererWebsocket.sendEvent('message', prepareMessageToClient(dritterWebsocket.id, 'Hallo Dritter'))
    })
    
    it('Wenn anderer Teilnehmer 0x40 Nachricht an mich schickt, erhalte ich 0x41 Nachricht.', async () => {
        // Erhalt eigener Nachrichten prüfen
        const meinWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(meinWebsocket)
        meinWebsocket.sendEvent('message', prepareJoinRoomMessage(13n)) // Raum betreten
        let messageReceived = false
        meinWebsocket.send = (message) => {
            assert.strictEqual(message[0], 0x41)
            messageReceived = true
        }
        // So tun, als ob anderer Websocket eine Nachricht schickt
        const andererWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(andererWebsocket)
        andererWebsocket.sendEvent('message', prepareMessageToClient(meinWebsocket.id, 'Hallo Du da'))
        assert.ok(messageReceived)
    })
    
    it('0x01 Nachricht enthält Websocket-ID.', async () => {
        // Vorher ein paar andere Websockets registrieren
        for (let i = 0; i < 15; i++) {
            expressApplication.handleWebsocketConnection(createWebsocketMock())
        }
        const meinWebsocket = createWebsocketMock()
        let websocketIdReceived = false
        meinWebsocket.send = (message) => {
            const buffer = Buffer.from(message)
            assert.strictEqual(buffer[0], 0x01)
            const dataView = new DataView(message)
            const senderId = dataView.getBigInt64(1, true)
            assert.ok(senderId === 15n)
            websocketIdReceived = true
        }
        expressApplication.handleWebsocketConnection(meinWebsocket)
        assert.strictEqual(websocketIdReceived, true)
    })
    
    it('0x31 Nachricht enthält Sender-Websocket-ID.', async () => {
        // Erhalt eigener Nachrichten prüfen
        const meinWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(meinWebsocket)
        meinWebsocket.sendEvent('message', prepareJoinRoomMessage(13n)) // Raum betreten
        meinWebsocket.send = (message) => {
            const arrayBuffer = message.buffer
            const dataView = new DataView(arrayBuffer)
            const senderId = dataView.getBigInt64(1, true)
            assert.ok(senderId === 1n) // Das muss der zweite registrierte Websocket sein
        }
        // So tun, als ob anderer Websocket eine Nachricht schickt
        const andererWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(andererWebsocket)
        andererWebsocket.sendEvent('message', prepareMessageToRoom(13n, 'Hallo Raum'))
    })
    
    it('0x31 Nachricht enthält Raum-ID.', async () => {
        // Erhalt eigener Nachrichten prüfen
        const meinWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(meinWebsocket)
        meinWebsocket.sendEvent('message', prepareJoinRoomMessage(13n)) // Raum betreten
        meinWebsocket.send = (message) => {
            const arrayBuffer = message.buffer
            const dataView = new DataView(arrayBuffer)
            const roomId = dataView.getBigInt64(9, true)
            assert.ok(roomId === 13n)
        }
        // So tun, als ob anderer Websocket eine Nachricht schickt
        const andererWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(andererWebsocket)
        andererWebsocket.sendEvent('message', prepareMessageToRoom(13n, 'Hallo Raum'))
    })
        
    it('0x31 Nachricht enthält Nachricht.', async () => {
        // Erhalt eigener Nachrichten prüfen
        const meinWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(meinWebsocket)
        meinWebsocket.sendEvent('message', prepareJoinRoomMessage(13n)) // Raum betreten
        meinWebsocket.send = (message) => {
            const arrayBuffer = message.buffer
            const messageContent = arrayBuffer.slice(17)
            assert.strictEqual(new TextDecoder().decode(messageContent), 'Hallo Raum')
        }
        // So tun, als ob anderer Websocket eine Nachricht schickt
        const andererWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(andererWebsocket)
        andererWebsocket.sendEvent('message', prepareMessageToRoom(13n, 'Hallo Raum'))
    })
    
    it('0x41 Nachricht enthält Sender-Websocket-ID.', async () => {
        // Erhalt eigener Nachrichten prüfen
        const meinWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(meinWebsocket)
        meinWebsocket.sendEvent('message', prepareJoinRoomMessage(13n)) // Raum betreten
        let messageReceived = false
        meinWebsocket.send = (message) => {
            const arrayBuffer = message.buffer
            const dataView = new DataView(arrayBuffer)
            const senderId = dataView.getBigInt64(1, true)
            assert.ok(senderId === 1n) // Das muss der zweite registrierte Websocket sein
            messageReceived = true
        }
        // So tun, als ob anderer Websocket eine Nachricht schickt
        const andererWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(andererWebsocket)
        andererWebsocket.sendEvent('message', prepareMessageToClient(meinWebsocket.id, 'Hallo Du da'))
        assert.ok(messageReceived)
    })
        
    it('0x41 Nachricht enthält Nachricht.', async () => {
        // Erhalt eigener Nachrichten prüfen
        const meinWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(meinWebsocket)
        meinWebsocket.sendEvent('message', prepareJoinRoomMessage(13n)) // Raum betreten
        let messageReceived = false
        meinWebsocket.send = (message) => {
            const arrayBuffer = message.buffer
            const messageContent = arrayBuffer.slice(9)
            assert.strictEqual(new TextDecoder().decode(messageContent), 'Hallo Du da')
            messageReceived = true
        }
        // So tun, als ob anderer Websocket eine Nachricht schickt
        const andererWebsocket = createWebsocketMock()
        expressApplication.handleWebsocketConnection(andererWebsocket)
        andererWebsocket.sendEvent('message', prepareMessageToClient(meinWebsocket.id, 'Hallo Du da'))
        assert.ok(messageReceived)
    })

})
