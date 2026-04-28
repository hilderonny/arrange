import * as Arrange from '../arrange.mjs'

export default class Datenbankobjekt {

    static get datenbankname() { return undefined }
    static get tabellenname() { return undefined }

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

    static async aktualisiereDatensatz(id, felder) {
        return await Arrange.speichereDatensatz(this.datenbankname, this.tabellenname, id, felder)
    }

    static async ladeAusDatenbank(id) {
        const abfrageergebnis = await Arrange.macheDatenbankabfrage(this.datenbankname, `SELECT * FROM ${this.tabellenname} WHERE Id='${id}'`)
        if (!abfrageergebnis?.length) {
            return undefined
        }
        const instanz = new this()
        for (const [schluessel, wert] of Object.entries(abfrageergebnis[0])) {
            instanz[schluessel] = wert
        }
        return instanz
    }

    static async ladeListeMitAbfrage(abfrage) {
        const listeAusDatenbank = await Arrange.macheDatenbankabfrage(this.datenbankname, abfrage)
        return listeAusDatenbank.map(elementAusDatenbank => new this(elementAusDatenbank))
    }
    
    async loescheAusDatenbank() {
        return await Arrange.loescheDatensatz(this.constructor.datenbankname, this.constructor.tabellenname, this.Id)
    }

    async speichereInDatenbank() {
        const zuSpeichernderDatensatz = {}
        for (const schluessel of Object.keys(this)) {
            if (schluessel !== 'Id') {
                zuSpeichernderDatensatz[schluessel] = this[schluessel]
            }
        }
        return await Arrange.speichereDatensatz(this.constructor.datenbankname, this.constructor.tabellenname, this.Id, zuSpeichernderDatensatz)
    }

}