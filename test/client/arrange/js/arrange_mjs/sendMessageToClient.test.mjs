import assert from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'

describe('arrange.mjs sendMessageToClient()', () => {

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

    it('Es wird eine Nachricht 0x40 mit der Ziel-Websocket-Id und der Nachricht über den Websocket gesendet.', async () => {
        let sendCalled = false
        global.WebSocket.prototype.send = (message) => {
            const buffer = Buffer.from(message)
            assert.strictEqual(buffer[0], 0x40)
            const dataView = new DataView(message)
            const targetClientId = dataView.getBigInt64(1, true)
            assert.ok(targetClientId === 42n)
            const messageContent = message.slice(9)
            assert.strictEqual(new TextDecoder().decode(messageContent), 'Hallo Client')
            sendCalled = true
        }
        const arrange = await import(arrangeLocation + Math.random())
        await arrange.connectWebSocket()
        await arrange.sendMessageToClient(42n, 'Hallo Client')
        assert.strictEqual(sendCalled, true)
    })

})
