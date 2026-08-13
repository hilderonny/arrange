import assert from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'

describe('arrange.mjs autoLogin()', () => {

    let originalFetch
    let originalLocation
    let originalLocalStorage
    const arrangeLocation = '../../../../../client/arrange/js/arrange.mjs?'

    afterEach(() => {
        global.fetch = originalFetch
        global.location = originalLocation
        global.localStorage = originalLocalStorage
    })

    beforeEach(() => {
        originalFetch = global.fetch
        originalLocation = global.location
        global.location = { href: 'index.html' }
        originalLocalStorage = global.localStorage
        global.localStorage = {
            items: {},
            getItem(key) { return global.localStorage.items[key] },
            removeItem(key) { delete global.localStorage.items[key] },
            setItem(key, value) { global.localStorage.items[key] = value },
        }
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

    it('Es wird die API GET /api/autologin aufgerufen.', async () => {
        let fetchWasCalled = false
        global.fetch = (url, options) => {
            assert.strictEqual(url, '/api/autologin')
            assert.strictEqual(options, undefined)
            fetchWasCalled = true
            return { status: 401 }
        }
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        assert.strictEqual(fetchWasCalled, true)
    })

    it('Ohne Sitzung und mit gespeicherten Anmeldedaten wird die API GET /api/login aufgerufen.', async () => {
        global.localStorage.items = {
            'username': 'testusername',
            'password': 'testpassword',
        }
        let fetchWasCalled = 0
        let expectedApiUrl = '/api/autologin'
        global.fetch = (url, options) => {
            assert.strictEqual(url, expectedApiUrl)
            fetchWasCalled++
            expectedApiUrl = '/api/login' // Beim nächsten Aufruf muss /api/login aufgerufen werden
            return { status: 401 }
        }
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        assert.strictEqual(fetchWasCalled, 2) // Muss zweimal aufgerufen worden sein
    })

    it('Ohne Sitzung und mit korrekten gespeicherten Anmeldedaten erfolgt keine Umleitung.', async () => {
        global.localStorage.items = {
            'username': 'testusername',
            'password': 'testpassword',
        }
        const responseStatuses = {
            '/api/autologin': 401,
            '/api/login': 200,
        }
        global.fetch = (url, options) => {
            return { status: responseStatuses[url], async json() { return { id: 'testuserid'} } }
        }
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        assert.strictEqual(global.location.href, 'index.html')
    })

    it('Ohne Sitzung und ohne gespeicherte Anmeldedaten wird auf login.html umgeleitet.', async () => {
        global.fetch = (url, options) => {
            return { status: 401 }
        }
        global.location = { href: 'index.html' }
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        assert.ok(global.location.href.endsWith('/arrange/login.html?successurl=index.html'))
    })

    it('Ohne Sitzung und mit falschem gespeicherten Benutzernamen wird auf login.html umgeleitet.', async () => {
        global.localStorage.items = {
            'username': 'wrongusername',
            'password': 'testpassword',
        }
        let fetchWasCalled = 0
        global.fetch = (url, options) => {
            fetchWasCalled++
            return { status: 401 } // Auch beim zweiten Aufruf Fehlschlag
        }
        global.location = { href: 'index.html' }
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        assert.strictEqual(fetchWasCalled, 2)
        assert.ok(global.location.href.endsWith('/arrange/login.html?successurl=index.html'))
    })

    it('Ohne Sitzung und mit falschem gespeicherten Passwort wird auf login.html umgeleitet.', async () => {
        global.localStorage.items = {
            'username': 'testusername',
            'password': 'wrongpassword',
        }
        let fetchWasCalled = 0
        global.fetch = (url, options) => {
            fetchWasCalled++
            return { status: 401 } // Auch beim zweiten AUfruf Fehlschlag
        }
        global.location = { href: 'index.html' }
        const arrange = await import(arrangeLocation + Math.random())
        assert.ok(arrange)
        assert.strictEqual(fetchWasCalled, 2)
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
