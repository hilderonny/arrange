import cookieSession from 'cookie-session'
import express from 'express'
import path from 'node:path/posix'

import config from '../config.mjs'

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

        // Uploads landen direkt im Dateisystem ohne RAM-Zwischenspeicherung
        // this.fileUpload = multer({
        //     storage: multer.diskStorage({
        //         destination: (request, file, callback) => {
        //             const absoluteFilePath = path.resolve(config.filesPath, request.params.userId, ...request.params.filePath)
        //             if (fs.existsSync(absoluteFilePath) && !fs.statSync(absoluteFilePath).isFile()) {
        //                 callback('Requested path is an existing directory')
        //                 return
        //             }
        //             const dirPath = path.dirname(absoluteFilePath)
        //             fs.mkdirSync(dirPath, { recursive: true })
        //             callback(null, dirPath)
        //         },
        //         filename: (request, file, callback) => {
        //             const absoluteFilePath = path.resolve(this.#filesPath, request.params.userId, ...request.params.filePath)
        //             callback(null, path.basename(absoluteFilePath))
        //         },
                
        //     })
        // }).any()

        // Arrange-Client-Skripte und Seiten ausliefern
        expressApplication.use('/arrange', express.static(path.resolve(path.dirname(import.meta.dirname), './client/arrange')))

        // API-Endpunkte
        for (const [method, apiDefinition] of Object.entries(config.apis)) {
            for (const [url, apiScriptFile] of Object.entries(apiDefinition)) {
                console.log(path.resolve(apiScriptFile))
                const apiHandler = await import(path.resolve(apiScriptFile))
                expressApplication[method](url, apiHandler.default)
            }
        }
        // this.app.get('/api/autologin', this.#handleGetAutoLogin.bind(this))
        // this.app.post('/api/login', this.#handlePostLogin.bind(this))
        // this.app.get('/api/logout', this.#handleGetLogout.bind(this))
        // this.app.post('/api/register', this.#handlePostRegister.bind(this))
        // this.app.delete('/api/files/:userId/*filePath', this.#handleDeletePath.bind(this))
        // this.app.get('/api/files/:userId/*filePath', this.#handleGetPath.bind(this))
        // this.app.post('/api/files/:userId/*filePath', this.#handlePostFile.bind(this))
        // this.app.put('/api/files/:userId/*directoryPath', this.#handlePutDirectoryPath.bind(this))
        // this.app.patch('/api/database/:databaseName', this.#handlePatchDatabase.bind(this))
        // this.app.patch('/api/database/:databaseName/:tableName/:recordId', this.#handlePatchDatabaseRecord.bind(this))
        // this.app.delete('/api/database/:databaseName/:tableName', this.#handleDeleteDatabaseTable.bind(this))
        // this.app.delete('/api/database/:databaseName/:tableName/:recordId', this.#handleDeleteDatabaseRecord.bind(this))
        // this.app.post('/api/database/:databaseName', this.#handlePostDatabaseQuery.bind(this))

        return expressApplication
    }

}