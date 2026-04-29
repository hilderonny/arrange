import * as Arrange from '../arrange.mjs'

// TODO DatabaseObject testen
export default class DatabaseObject {

    static databaseName = undefined
    static tableName = undefined

    constructor(fields) {
        if (new.target === DatabaseObject) {
            throw new Error('Cannot create an instance of abstract class DatabaseObject.')
        }
        if (fields) {
            for (const schluessel of Object.keys(fields)) {
                this[schluessel] = fields[schluessel]
            }
        }
        if (!this.Id) {
            this.Id = Math.floor((Date.now() + Math.random()) * 1000).toString()
        }
    }
    
    async deleteFromDatabase() {
        return await Arrange.deleteDatabaseRecord(this.constructor.databaseName, this.constructor.tableName, this.Id)
    }

    static async loadFromDatabase(recordId) {
        const result = await Arrange.queryDatabase(this.databaseName, `SELECT * FROM ${this.tableName} WHERE Id='${recordId}'`)
        if (!result?.length) {
            return undefined
        }
        const instanz = new this()
        for (const [schluessel, wert] of Object.entries(result[0])) {
            instanz[schluessel] = wert
        }
        return instanz
    }

    static async loadListWithQuery(query) {
        const records = await Arrange.queryDatabase(this.databaseName, query)
        return records.map(record => new this(record))
    }

    async storeInDatabase() {
        const zuSpeichernderDatensatz = {}
        for (const schluessel of Object.keys(this)) {
            if (schluessel !== 'Id') {
                zuSpeichernderDatensatz[schluessel] = this[schluessel]
            }
        }
        return await Arrange.saveDatabaseRecord(this.constructor.datenbankname, this.constructor.tabellenname, this.Id, zuSpeichernderDatensatz)
    }

}