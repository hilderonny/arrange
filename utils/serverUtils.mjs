import cookieSession from 'cookie-session'
import express from 'express'
import path from 'node:path/posix'

import config from '../config.mjs'
import databaseUtils from './databaseUtils.mjs'
import userUtils from './userUtils.mjs'

export default {

    async createExpressApplication() {

        // Express Anwendung vorbereiten
        const expressApplication = new express()

        // Benutzersessions aktivieren
        expressApplication.use(cookieSession({
            name: 'session',
            secret: config.tokenSecret,
            maxAge: 365 * 24 * 60 * 60 * 1000, // 1 Jahr gültig
        }))

        // JSON in POST Daten aktivieren
        expressApplication.use(express.json({ limit: '100MB' }))

        // Statische HTML Seiten ausliefern, muss vor /arrange erfolgen, damit /arrange nicht überschrieben wird
        for (const [url, path] of Object.entries(config.htmlPaths)) {
            expressApplication.use(url, express.static(path))
        }

        // Arrange-Client-Skripte und Seiten ausliefern
        expressApplication.use('/arrange', express.static(path.resolve(path.dirname(import.meta.dirname), './client/arrange')))

        // API-Endpunkte
        for (const [method, apiDefinition] of Object.entries(config.apis)) {
            for (const [url, apiScriptFile] of Object.entries(apiDefinition)) {
                const apiModule = await import(path.resolve(apiScriptFile))
                const apiHandler = apiModule.default(config, databaseUtils, userUtils)
                expressApplication[method](url, apiHandler)
            }
        }

        // Datenbanken initialisieren
        for (const [databaseName, schema] of Object.entries(config.databases)) {
            await databaseUtils.updateDatabaseSchema(databaseName, schema)
        }

        return expressApplication
    }

}