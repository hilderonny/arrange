import * as Arrange from '../arrange.mjs'

export default class DatabaseObject {

    static get databasename() { return undefined }
    static get tablename() { return undefined }

    constructor(felder) {
        if (felder) {
            for (const schluessel of Object.keys(felder)) {
                this[schluessel] = felder[schluessel]
            }
        }
        if (!this.Id) {
            this.Id = Math.floor((Date.now() + Math.random()) * 1000).toString()
        }
    }

    static async updateRecord(id, felder) {
        return await Arrange.speichereDatensatz(this.databasename, this.tablename, id, felder)
    }

    static async loadFromDatabase(id) {
        const abfrageergebnis = await Arrange.macheDatenbankabfrage(this.databasename, `SELECT * FROM ${this.tablename} WHERE Id='${id}'`)
        if (!abfrageergebnis?.length) {
            return undefined
        }
        const instanz = new this()
        for (const [schluessel, wert] of Object.entries(abfrageergebnis[0])) {
            instanz[schluessel] = wert
        }
        return instanz
    }

    static async loadListWithQuery(abfrage) {
        const listeAusDatenbank = await Arrange.macheDatenbankabfrage(this.databasename, abfrage)
        return listeAusDatenbank.map(elementAusDatenbank => new this(elementAusDatenbank))
    }
    
    async deleteFromDatabase() {
        return await Arrange.loescheDatensatz(this.constructor.datenbankname, this.constructor.tabellenname, this.Id)
    }

    async storeInDatabase() {
        const zuSpeichernderDatensatz = {}
        for (const schluessel of Object.keys(this)) {
            if (schluessel !== 'Id') {
                zuSpeichernderDatensatz[schluessel] = this[schluessel]
            }
        }
        return await Arrange.speichereDatensatz(this.constructor.datenbankname, this.constructor.tabellenname, this.Id, zuSpeichernderDatensatz)
    }

}