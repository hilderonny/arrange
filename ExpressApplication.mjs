import express from 'express'
import cookieSession from 'cookie-session'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import sqlite from 'node:sqlite'
import multer from 'multer'

import config from './config.mjs'

/********** Server **********/

export default class ExpressApplication {

    /**
     * Pfad zum Verzeichnis, in dem die Datenbanken liegen
     */
    #databasePath
    
    /**
     * Erstellt eine Express-Anwendung und registriert alle Routen.
     * 
     * @param {string} dataPath Pfad zum Stammverzeichnis für Dateien der `files` API
     * @param {object} htmlPaths Map von Web-Verzeichnispfaden
     * @param {string} tokenSecret Secret Key zur Verschlüsselung der Sitzungs-Cookies.
     * @param {object} customApis Map von Custom APIs
     */
    constructor(dataPath, htmlPaths, tokenSecret, customApis) {

        this.app = express()

        // Benutzersessions
        this.app.use(cookieSession({
            name: 'session',
            secret: config.tokenSecret,
            maxAge: 365 * 24 * 60 * 60 * 1000, // 1 Jahr gültig
        }))

        // JSON in POST Daten aktivieren
        this.app.use(express.json({ limit: '100MB' }))

        // Statische HTML Seiten ausliefern, muss vor /arrange erfolgen, damit /arrange nicht überschrieben wird
        for (const [url, path] of Object.entries(config.htmlPaths)) {
            this.app.use(url, express.static(path))
        }

        // Arrange-Client-Skripte und Seiten ausliefern
        this.app.use('/arrange', express.static(path.resolve(import.meta.dirname, './client/arrange')))

        // API-Endpunkte
        for (const [method, apiDefinition] of Object.entries(config.apis)) {
            for (const [url, apiHandler] of Object.entries(apiDefinition)) {
                this.app[method](url, apiHandler.bind(this))
            }
        }
        // this.app.patch('/api/database/:databaseName', this.#handlePatchDatabase.bind(this))
        // this.app.patch('/api/database/:databaseName/:tableName/:recordId', this.#handlePatchDatabaseRecord.bind(this))
        // this.app.delete('/api/database/:databaseName/:tableName', this.#handleDeleteDatabaseTable.bind(this))
        // this.app.delete('/api/database/:databaseName/:tableName/:recordId', this.#handleDeleteDatabaseRecord.bind(this))
        // this.app.post('/api/database/:databaseName', this.#handlePostDatabaseQuery.bind(this))
    }
    

    // /********** API Funktionen **********/

    // // Datensatz löschen
    // async #handleDeleteDatabaseRecord(request, response) {
    //     try {
    //         const database = await this.loadDatabase(request.params.databaseName)
    //         const existingTable = database.prepare(`SELECT name FROM sqlite_schema WHERE type='table' AND name='${request.params.tableName}';`).get()
    //         if (existingTable) {
    //             const query = database.prepare(`DELETE FROM ${request.params.tableName} WHERE Id = '${request.params.recordId}';`)
    //             query.run()
    //         }
    //         response.sendStatus(200)
    //     } catch {
    //         response.status(500).send('Cannot delete database record')
    //     }
    // }

    // /**
    //  * Datenbanktabelle löschen
    //  */
    // async #handleDeleteDatabaseTable(request, response) {
    //     try {
    //         const database = await this.loadDatabase(request.params.databaseName)
    //         const query = database.prepare(`DROP TABLE IF EXISTS ${request.params.tableName};`)
    //         query.run()
    //         response.sendStatus(200)
    //     } catch {
    //         response.status(500).send('Cannot delete database table')
    //     }
    // }



    // /**
    //  * Speichert einen Datensatz in der Datenbank
    //  */
    // async #handlePatchDatabaseRecord(request, response) {
    //     if (!request.body?.fields) {
    //         return response.sendStatus(400)
    //     }
    //     try {
    //         const database = await this.loadDatabase(request.params.databaseName)
    //         // Prüfen, ob Tabelle existiert
    //         const existingTable = database.prepare(`SELECT name FROM sqlite_schema WHERE type='table' AND name='${request.params.tableName}';`).get()
    //         if (!existingTable) {
    //             return response.sendStatus(400)
    //         }
    //         // Existierende Spalten laden
    //         const columns = database.prepare(`SELECT name FROM pragma_table_info('${request.params.tableName}');`).all().map(column => column.name)
    //         // Prüfen, ob Datensatz bereits existiert
    //         if (database.prepare(`SELECT COUNT(*) AS anzahl FROM ${request.params.tableName} WHERE Id='${request.params.recordId}';`).get().anzahl < 1) {
    //             // Existiert noch nicht, also neu anlegen
    //             const recordToCreate = request.body.fields
    //             // Existierende Spalten filtern
    //             for (const columnName of Object.keys(recordToCreate)) {
    //                 if (!columns.includes(columnName)) {
    //                     delete recordToCreate[columnName]
    //                 }
    //             }
    //             recordToCreate.Id = request.params.recordId
    //             const queryString = [
    //                 'INSERT INTO ',
    //                 request.params.tableName,
    //                 ' (',
    //                 Object.keys(recordToCreate).join(','),
    //                 ') VALUES (',
    //                 Object.values(recordToCreate).map(value => {
    //                     if (value === null) return 'NULL'
    //                     switch (typeof(value)) {
    //                         case 'undefined': return 'NULL'
    //                         case 'boolean': return value ? '1' : '0'
    //                         case 'number': return value
    //                         default: return `'${('' + value).toString().replaceAll(`'`, `''`)}'`
    //                     }
    //                 }).join(','),
    //                 ');'
    //             ].join('')
    //             const query = database.prepare(queryString)
    //             query.run()
    //         } else {
    //             // Existiert, also ggf. aktualisieren
    //             const recordToChange = request.body.fields
    //             // Id rausfiltern, diese darf nicht verändert werden
    //             delete recordToChange.Id
    //             // Existierende Spalten filtern
    //             for (const columnName of Object.keys(recordToChange)) {
    //                 if (!columns.includes(columnName)) {
    //                     delete recordToChange[columnName]
    //                 }
    //             }
    //             // Wenn keine Felder oder keine passenden gesendet werden, muss auch nicht aktualisiert werden
    //             if (Object.keys(recordToChange).length > 0) {
    //                 const queryString = [
    //                     'UPDATE ',
    //                     request.params.tableName,
    //                     ' SET ',
    //                     Object.entries(recordToChange).map(([ columnName, value ]) => {
    //                         let setString = columnName + '='
    //                         if (value === null) {
    //                             setString += 'NULL'
    //                         } else {
    //                             switch (typeof(value)) {
    //                                 case 'undefined': setString += 'NULL'; break
    //                                 case 'boolean': setString += value ? '1' : '0'; break
    //                                 case 'number': setString += value; break
    //                                 default: setString += `'${('' + value).toString().replaceAll(`'`, `''`)}'`; break
    //                             }
    //                         }
    //                         return setString
    //                     }).join(', '),
    //                     ` WHERE Id='`,
    //                     request.params.recordId,
    //                     `';`
    //                 ].join('')
    //                 const query = database.prepare(queryString)
    //                 query.run()
    //             }
    //         }
    //         // Vollständigen Datensatz zurück geben
    //         const record = database.prepare(`SELECT * FROM ${request.params.tableName} WHERE Id='${request.params.recordId}';`).get()
    //         response.json(record)
    //     } catch {
    //         response.status(500).send('Cannot save database record')
    //     }
    // }


    // /**
    //  * Informationen aus Datenbank holen.
    //  * Es sind nur SELECT-Abfragen erlaubt und es dürfen keine Semikola (Anweisungstrenner) enthalten sein
    //  */
    // async #handlePostDatabaseQuery(request, response) {
    //     try {
    //         const database = await this.loadDatabase(request.params.databaseName)
    //         // Abfrage durchführen
    //         const query = request.body?.query?.toString()
    //         if (!query || !query.toLowerCase().startsWith('select') || query.includes(';')) {
    //             return response.sendStatus(400)
    //         }
    //         const result = database.prepare(query).all()
    //         // Ergebnisse als JSON zurück geben
    //         response.json(result)
    //     } catch {
    //         response.status(500).send('Cannot query database')
    //     }
    // }

}
