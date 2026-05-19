import assert from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'

function createWebSocketMock() {
    return class {

        static onmessagehandler
        static url

        set onmessage(handler) {
            this.constructor.onmessagehandler = handler
        }

        set onopen(handler) {
            handler() // Gleich aufrufen, damit Promise zurück kommt
        }

        constructor(url) {
            this.constructor.url = url
        }

        static async sendMessage(message) {
            const messageEvent = {
                data: {
                    arrayBuffer() {
                        return message
                    }
                }
            }
            await this.onmessagehandler(messageEvent)
        }
    }
}

describe('arrange.mjs connectWebSocket()', () => {

    let originalFetch
    let originalWebSocket
    const arrangeLocation = '../../../../../client/arrange/js/arrange.mjs?'

    afterEach(() => {
        global.fetch = originalFetch
        global.WebSocket = originalWebSocket
    })

    beforeEach(() => {
        originalFetch = global.fetch
        originalWebSocket = global.WebSocket
        global.fetch = () => { // Für automatische Anmeldung
            return { status: 200 }
        }
    })

    it('Der asynchrone Aufruf kommt erst zurück, wenn die Verbindung steht.', async () => {
        global.WebSocket = createWebSocketMock()
        const arrange = await import(arrangeLocation + Math.random())
        await arrange.connectWebSocket()
    })

    it('Die Verbindung wird zur URL /ws aufgebaut.', async () => {
        global.WebSocket = createWebSocketMock()
        const arrange = await import(arrangeLocation + Math.random())
        await arrange.connectWebSocket()
        assert.strictEqual(global.WebSocket.url, '/ws')
    })

    it('Der messageCallback wird bei Nachricht 0x01 mit dem Typ 0x01 und der Client-Id aufgerufen.', async () => {
        global.WebSocket = createWebSocketMock()
        const arrange = await import(arrangeLocation + Math.random())
        let callbackCalled = false
        await arrange.connectWebSocket(({ type, clientId }) => {
            assert.strictEqual(type, 0x01)
            assert.ok(clientId === 42n)
            callbackCalled = true
        })
        // Nachricht schicken
        const arrayBuffer = new ArrayBuffer(9)
        const dataView = new DataView(arrayBuffer)
        dataView.setInt8(0, 0x01)
        dataView.setBigInt64(1, 42n, true)
        await global.WebSocket.sendMessage(arrayBuffer)
        assert.strictEqual(callbackCalled, true)
    })

    it('Der messageCallback wird bei Nachricht 0x31 mit dem Typ 0x31, der Sender-Id, der Raum-Id und der Nachricht aufgerufen.', async () => {
        global.WebSocket = createWebSocketMock()
        const arrange = await import(arrangeLocation + Math.random())
        let callbackCalled = false
        await arrange.connectWebSocket(({ type, senderId, roomId, message }) => {
            assert.strictEqual(type, 0x31)
            assert.ok(senderId === 42n)
            assert.ok(roomId === 13n)
            assert.strictEqual(new TextDecoder().decode(message), 'Hallo Raum')
            callbackCalled = true
        })
        // Nachricht schicken
        const textBytes = new TextEncoder().encode('Hallo Raum')
        const arrayBuffer = new ArrayBuffer(17 + textBytes.length)
        const dataView = new DataView(arrayBuffer)
        dataView.setInt8(0, 0x31)
        dataView.setBigInt64(1, 42n, true)
        dataView.setBigInt64(9, 13n, true)
        new Uint8Array(arrayBuffer).set(textBytes, 17)
        await global.WebSocket.sendMessage(arrayBuffer)
        assert.strictEqual(callbackCalled, true)
    })

    it('Der messageCallback wird bei Nachricht 0x01 mit dem Typ 0x41, der Sender-Id und der Nachricht aufgerufen.', async () => {
        global.WebSocket = createWebSocketMock()
        const arrange = await import(arrangeLocation + Math.random())
        let callbackCalled = false
        await arrange.connectWebSocket(({ type, senderId,  message }) => {
            assert.strictEqual(type, 0x41)
            assert.ok(senderId === 42n)
            assert.strictEqual(new TextDecoder().decode(message), 'Hallo Client')
            callbackCalled = true
        })
        // Nachricht schicken
        const textBytes = new TextEncoder().encode('Hallo Client')
        const arrayBuffer = new ArrayBuffer(9 + textBytes.length)
        const dataView = new DataView(arrayBuffer)
        dataView.setInt8(0, 0x41)
        dataView.setBigInt64(1, 42n, true)
        new Uint8Array(arrayBuffer).set(textBytes, 9)
        await global.WebSocket.sendMessage(arrayBuffer)
        assert.strictEqual(callbackCalled, true)
    })

})
