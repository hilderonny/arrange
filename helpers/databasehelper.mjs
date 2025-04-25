import { DatabaseSync } from 'node:sqlite'
import { randomUUID } from 'node:crypto'

import { log, warn } from './loghelper.mjs'

let database

/**
 * Erstellt eine Datenbanktabelle.
 * Wenn die Tabelle bereits existiert, passiert nichts weiter.
 * 
 * @param {string} table_name Name der Tabelle, die erstellt werden soll
 */
function createTable(table_name) {

    log('[DATABASE] Erstelle Tabelle %s', table_name)

    // Tabelle selbst erstellen, Datentypen werden als Tabellen abgebildet
    database.exec(`CREATE TABLE IF NOT EXISTS ${table_name} (id text PRIMARY KEY) STRICT;`)

}

/**
 * Erstellt ein Feld für den angegebenen Datentyp.
 * Falls ein Feld mit demselben Namen bereits existiert, wird eine Warnung ausgegeben und nichts weiter gemacht.
 * 
 * @param {string} datatype_name Name des Datentyps, für den ein Feld erstellt werden soll.
 * @param {string} field_name Feldname
 * @param {string} field_type Feldtyp
 */
function udpateDatabaseField(datatype_name, field_name, field_type) {

    log('[DATABASE] Erstelle Datenfeld %s.%s (%s)', datatype_name, field_name, field_type)

    // Feld erstellen und Fehler ignorieren, wenn das Feld bereits existiert
    try {
        database.exec(`ALTER TABLE ${datatype_name} ADD COLUMN ${field_name} ${field_type};`)
    } catch {
        warn('[DATABASE] WARNUNG: Datenfeld %s.%s (%s) wurde nicht erstellt.', datatype_name, field_name, field_type)
    }

}

/**
 * Erstellt einen Datensatz oder aktualisiert diesen, falls es bereits einen mit derselben `id` gibt.
 * Falls die gegebene Datensatzdefinition kein Feld `id` enthält, wird eines mit einer generierten UUID angelegt.
 * 
 * @param {string} datatype_name Name des Datentyps, für den ein Datensatz erstellt oder aktualisiert werden soll.
 * @param {object} value Definition des Datensatzes
 */
function updateDatabaseRecord(datatype_name, value) {

    // Id generieren, falls keine angegeben wurde
    if (!value.id) {
        value.id = randomUUID()
    }

    log('[DATABASE] Aktualisiere Datensatz in %s: %o', datatype_name, value)

    // Feldnamen extrahieren
    const fieldNames = Object.keys(value)

    // Die Werte werden immer gequoted. SQLite kümmert sich darum, aus strings Integer oder Booleans zu machen
    const fieldValues = Object.values(value).map(v => {
        switch (typeof v) {
            case 'string': return `'${v.replaceAll("'", "''")}'`
            case 'boolean': return v ? 1 : 0
            default: return v
        }
    })

    // Die Update-Zuordnungen müssen separate kontruiert werden
    const updateAssignments = []
    for (let i = 0; i < fieldNames.length; i++) {
        const fieldName = fieldNames[i]
        // Das Id Feld wird nicht aktualisiert
        if (fieldName !== 'id') updateAssignments.push(`${fieldNames[i]}=${fieldValues[i]}`)
    }

    // Statement zusammenbauzen und ausführen
    const statement = `INSERT INTO ${datatype_name}(${fieldNames.join(',')}) VALUES(${fieldValues.join(',')}) ON CONFLICT(id) DO UPDATE SET ${updateAssignments.join(',')};`
    database.exec(statement)

}

/**
 * Öffnet die Datenbank und erstellt sie bei Bedarf
 * 
 * @param {string} database_filepath Pfad zur Datenbankdatei
 */
function loadDatabase(database_filepath) {

    log('[DATABASE] Lade Datenbank von %s', database_filepath)

    database = new DatabaseSync(database_filepath)

}

export { createTable, loadDatabase, udpateDatabaseField, updateDatabaseRecord }