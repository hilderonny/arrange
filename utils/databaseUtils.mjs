import fs from 'node:fs'
import path from 'node:path/posix'
import sqlite from 'node:sqlite'

import config from '../config.mjs'

const databases = {}

export default {

    deleteDatabase(databaseName) {
        const database = databases[databaseName]
        if (database) {
            if (database.isOpen) {
                database.close()
            }
            delete databases[databaseName]
        }
        const fullPath = path.resolve(config.databasesPath, databaseName + '.sqlite')
        if (fs.existsSync(fullPath)) {
            fs.rmSync(fullPath)
        }
    },

    async loadDatabase(databaseName) {
        let database = databases[databaseName]
        if (!database) {
            const absolutePath = path.resolve(config.databasesPath, databaseName + '.sqlite')
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
            database = new sqlite.DatabaseSync(absolutePath)
            databases[databaseName] = database
        }
        return database
    },

}
