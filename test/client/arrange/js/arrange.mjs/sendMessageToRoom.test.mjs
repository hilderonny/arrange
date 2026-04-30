import assert from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'

describe('arrange.mjs sendMessageToRoom()', () => {

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
        global.WebSocket = class {
            set onopen(handler) {
                handler()
            }
        }
    })

    it('Es wird eine Nachricht 0x30 mit der Ziel-Raumnummer und der Nachricht über den Websocket gesendet.', async () => {
        let sendCalled = false
        global.WebSocket.prototype.send = (message) => {
            const buffer = Buffer.from(message)
            assert.strictEqual(buffer[0], 0x30)
            const dataView = new DataView(message)
            const roomNumber = dataView.getBigInt64(1, true)
            assert.ok(roomNumber === 13n)
            const messageContent = message.slice(9)
            assert.strictEqual(new TextDecoder().decode(messageContent), 'Hallo Raum')
            sendCalled = true
        }
        const arrange = await import(arrangeLocation + Math.random())
        await arrange.connectWebSocket()
        await arrange.sendMessageToRoom(13n, 'Hallo Raum')
        assert.strictEqual(sendCalled, true)
    })

})
