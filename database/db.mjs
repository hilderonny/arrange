import { DatabaseSync } from 'node:sqlite'

const database = new DatabaseSync('./database/database.sqlite', { open: false })

function init() {

    database.open()
    database.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY
        ) STRICT
    `)
    database.close()

}

export { init }