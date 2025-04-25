import fs from 'fs'
import path from 'path'
import { createDatatype, udpateDatabaseField, updateDatabaseRecord } from './databasehelper.mjs'
import { error, log } from './loghelper.mjs'

/**
 * Erstellt Felder für den angegebenen Datentyp
 * 
 * @param {object} datatype Objekt mit Spaltendefinitionen in `fields`
 */
function udpateDatabaseFields(datatype) {

    for (const field of datatype.fields) {
        
        udpateDatabaseField(datatype.name, field)

    }

}

/**
 * Erstellt vordefinierte Datensätze oder aktualisiert diese für den angegebenen Datentyp
 * 
 * @param {object} datatype Objekt mit vordefinierten Datensätzen in `values`
 */
function updateDatabaseRecords(datatype) {

    for (const value of datatype.values) {

        updateDatabaseRecord(datatype.name, value)

    }

}

/**
 * Aktualisiert die Datenbank, indem Tabellen erstellt oder erweitert werden,
 * die im Modul definiert sind.
 * 
 * @param {array} datatypes Liste von Datentypdefinitionen
 */
function updateDatabase(datatypes) {

    for (const datatype of datatypes) {

        log('[MODULES] Aktualisiere Datentyp %s.', datatype.name)

        // Tabelle selbst erstellen, Datentypen werden als Tabellen abgebildet
        createDatatype(datatype.name)
        // Felder erstellen
        udpateDatabaseFields(datatype)
        // Vordefinierte Datensätze erstellen
        if (datatype.values) updateDatabaseRecords(datatype)

    }

}

/**
 * Lädt ein Modul und initialisiert es
 * 
 * @param {string} module_path Pfad zum Modul
 * @param {object} app Expressinstanz, wird für Routenerweiterung durch Module benutzt
 */
function loadModule(module_path, app) {

    log('[MODULES] Suche Modul in %s', module_path)

    // Lädt die Konfigurationsdaten des Moduls
    const moduleConfigFile = path.join(module_path, 'moduleconfig.json')
    if (!fs.existsSync(moduleConfigFile)) {
        error('[MODULE] FEHLER: Modulkonfiguration %s nicht gefunden.', moduleConfigFile)
        return
    }
    const moduleConfig = JSON.parse(fs.readFileSync(moduleConfigFile))
    log('[MODULES] Lade Modul %s.', moduleConfig.name)

    // Datenbankeinstellungen lesen und Datenbank aktualisieren
    if (moduleConfig.datatypes) {
        updateDatabase(moduleConfig.datatypes)
    }

}

/**
 * Lädt alle Module im Modulverzeichnispfad und initialisiert diese
 * 
 * @param {string} modules_path Verzeichnispfad, in dem die Modulunterverzeichnisse liegen
 * @param {object} app Expressinstanz, wird für Routenerweiterung durch Module benutzt
 * @param {object} database Datenbankinstanz, wird an Module weiter gereicht
 */
function loadModules(modules_path, app, database) {

    log('[MODULES] Lade Module von %s.', modules_path)

    // Alle Unterverzeichnisse in modules_path suchen, als Module interpretieren und laden
    for (const file of fs.readdirSync(modules_path)) {
        const fullPath = path.join(modules_path, file)
        if (fs.statSync(fullPath).isDirectory()) {
            loadModule(fullPath, app, database)
        }
    }

}

export { loadModules }