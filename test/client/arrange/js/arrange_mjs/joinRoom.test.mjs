import assert from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'

describe('arrange.mjs joinRoom()', () => {

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

    it('Es wird eine Nachricht 0x10 mit der Raumnummer über den Websocket gesendet.', async () => {
        let sendCalled = false
        global.WebSocket.prototype.send = (message) => {
            const buffer = Buffer.from(message)
            assert.strictEqual(buffer[0], 0x10)
            const dataView = new DataView(message)
            const roomId = dataView.getBigInt64(1, true)
            assert.ok(roomId === 13n)
            sendCalled = true
        }
        const arrange = await import(arrangeLocation + Math.random())
        await arrange.connectWebSocket()
        await arrange.joinRoom(13n)
        assert.strictEqual(sendCalled, true)
    })

})
