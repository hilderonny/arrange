import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'fs'

const database = new DatabaseSync('./database/database.sqlite')

/**
 * Erstellt Felder für die angegebene Tabelle
 * 
 * @param {object} table Tabellenobjekt mit Spaltendefinitionen in `fields`
 */
function createFields(table) {

    // Über Felddefinitionen iterieren
    for (const field of table.fields) {
        
        let fieldType = 'text' // Standardmäßig ist jedes Feld vom Typ Text
        // TODO: fieldType abhängig von field.type ändern, z.B. boolean

        // Feld erstellen und Fehler ignorieren, wenn das Feld bereits existiert
        try {
            database.exec(`ALTER TABLE ${table.name} ADD COLUMN ${field.name} ${fieldType};`)
        } catch {
            console.warn(`Tabellenfeld ${table.name}.${field.name} (${fieldType}) wurde nicht erstellt.`)
        }

    }

}

/**
 * Erstellt vordefinierte Datensätze oder aktualisiert diese für die angegebene Tabelle
 * 
 * @param {object} table Tabellenobjekt mit vordefinierten Datensätzen in `values`
 */
function createRecords(table) {

    // Über Datensätze iterieren
    for (const value of table.values) {

        // Feldnamen extrahieren
        const fieldNames = Object.keys(value)

        // Die Werte werden immer gequoted. SQLite kümmert sich darum, aus strings Integer oder Booleans zu machen
        const fieldValues = Object.values(value).map(v => `'${v.replaceAll("'", "''")}'`)

        // Die Update-Zuordnungen müssen separate kontruiert werden
        const updateAssignments = []
        for (let i = 0; i < fieldNames.length; i++) {
            const fieldName = fieldNames[i]
            // Das Id Feld wird nicht aktualisiert
            if (fieldName !== 'id') updateAssignments.push(`${fieldNames[i]}=${fieldValues[i]}`)
        }

        // Statement zusammenbauzen und ausführen
        const statement = `INSERT INTO ${table.name}(${fieldNames.join(',')}) VALUES(${fieldValues.join(',')}) ON CONFLICT(id) DO UPDATE SET ${updateAssignments.join(',')};`
        database.exec(statement)

    }

}

/**
 * Erstellt und aktualisiert die Datenbankstruktur. Sollte einmal bei jedem Anwendungsstart aufgerufen werden.
 */
function init() {

    // Konfiguration aus Datei laden
    const fileContent = readFileSync('./database/dbstructure.json')
    const dbStructure = JSON.parse(fileContent)

    // Tabellen behandeln
    for (const table of dbStructure.tables) {
        // Tabelle selbst erstellen
        database.exec(`CREATE TABLE IF NOT EXISTS ${table.name} (id text PRIMARY KEY) STRICT;`)
        // Felder erstellen
        createFields(table)
        // Vordefinierte Datensätze erstellen
        if (table.values) createRecords(table)
    }

}

export { init }