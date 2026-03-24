import * as Arrange from '../arrange.js'

export default class Datenbankobjekt {

    constructor(datenbankname, tabellenname, id) {
        this.datenbankname = datenbankname
        this.tabellenname = tabellenname
        this.Id = (id || Math.floor((Date.now() + Math.random()) * 1000)).toString()
    }

    static async ladeAusDatenbank(objektvorlageMitId) {
        const abfrageergebnis = await Arrange.macheDatenbankabfrage(objektvorlageMitId.datenbankname, `SELECT * FROM ${objektvorlageMitId.tabellenname} WHERE Id='${objektvorlageMitId.Id}'`)
        if (!abfrageergebnis?.length) {
            return undefined
        }
        for (const [schluessel, wert] of Object.entries(abfrageergebnis[0])) {
            objektvorlageMitId[schluessel] = wert
        }
        return objektvorlageMitId
    }
    
    async loescheAusDatenbank() {
        return await Arrange.loescheDatensatz(this.datenbankname, this.tabellenname, this.Id)
    }

    async speichereInDatenbank() {
        const zuSpeichernderDatensatz = {}
        for (const schluessel of Object.keys(this).filter(schluessel => !['datenbankname', 'tabellenname'].includes(schluessel))) {
            zuSpeichernderDatensatz[schluessel] = this[schluessel]
        }
        return await Arrange.speichereDatensatz(this.datenbankname, this.tabellenname, this.Id, zuSpeichernderDatensatz)
    }

}