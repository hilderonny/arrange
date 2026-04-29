import assert from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'

describe('DatabaseObject', () => {

    let originalFetch
    let databaseObject
    const databaseObjectLocation = '../../../../../client/arrange/js/types/DatabaseObject.mjs?'

    afterEach(() => {
        global.fetch = originalFetch
    })

    beforeEach(async () => {
        originalFetch = global.fetch
        global.fetch = () => { // Für automatische Anmeldung
            return { status: 200 }
        }
        databaseObject = await import(databaseObjectLocation + Math.random())
    })

    it('.', async () => {
    })

})
