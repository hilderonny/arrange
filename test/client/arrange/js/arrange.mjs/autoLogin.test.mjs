import assert from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'

describe('arrange.mjs autoLogin()', () => {

    let originalFetch
    let originalLocation
    const arrangeLocation = '../../../../../client/arrange/js/arrange.mjs?'

    afterEach(() => {
        global.fetch = originalFetch
        global.location = originalLocation
    })

    beforeEach(() => {
        originalFetch = global.fetch
        originalLocation = global.location
        global.location = { href: 'index.html' }
    })

    it('autoLogin() wird gleich beim Import aufgerufen.', async () => {
        let fetchWasCalled = false
        global.fetch = () => {
            fetchWasCalled = true
            return { status: 401 }
        }
        await import(arrangeLocation + Math.random())
        assert.strictEqual(fetchWasCalled, true)
    })

    it('Es wird die API GET /api/login aufgerufen.', async () => {
        global.fetch = (url, options) => {
            assert.strictEqual(url, '/api/autologin')
            assert.strictEqual(options, undefined)
            return { status: 401 }
        }
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        assert.ok(global.location.href.endsWith('/arrange/login.html?successurl=index.html'))
    })

    it('Ohne Sitzung wird auf login.html umgeleitet.', async () => {
        global.fetch = () => {
            return { status: 401 }
        }
        global.location = { href: 'index.html' }
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        assert.ok(global.location.href.endsWith('/arrange/login.html?successurl=index.html'))
    })

    it('Mit Sitzung erfolgt keine Umleitung.', async () => {
        global.fetch = () => {
            return { status: 200 }
        }
        global.location = { href: 'index.html' }
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        assert.strictEqual(global.location.href, 'index.html')
    })

})
