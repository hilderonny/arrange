import fs from 'node:fs'
import path from 'node:path'

function loadDatabase(database_directory, log) {

    /**
     * Lädt eine Tabelle aus seiner JSON-Datei.
     * Wenn noch keine Datei für die Tabelle existiert, wird eine leere angelegt.
     * 
     * @param {string} table_name Name der zu ladenden Tabelle
     * @returns Objekt mit Tabelleninhalt. Kann leer sein.
     */
    function loadOrCreateTable(table_name) {
        const fileName = database_directory + table_name + '.json'
        // Wenn die JSON-Datei noch nicht existiert, wird sie erstellt und mit einem leeren Objekt befüllt
        if (!fs.existsSync(fileName)) {
            log('[DATABASE] Erstelle Datenbank %s.', table_name)
            saveTable(table_name, {})
        }
        log('[DATABASE] Lade Datenbankdatei %s.', table_name)
        const tableContent = JSON.parse(fs.readFileSync(fileName))
        // Über die save() - Funktion kann eine Tabelle gezielt gespeichert werden.
        tableContent.save = () => {
            saveTable(table_name, tableContent)
        }
        // Entries ohne Funktionen
        tableContent.entries = () => {
            return Object.entries(tableContent).filter(kvp => typeof kvp[1] === 'object')
        }
        // Die size() - Funktion gibt die Anzahl der Einträge ohne Funktionen zurück
        tableContent.size = () => {
            return tableContent.entries().length
        }
        // Die find() - Funktion ist eine Weiterleitung zur Suche über die Werte
        // Liefert ein Array zurück, in dem der 0. Eintrag die Id und der 1. Eintrag der Inhalt ist
        tableContent.find = (fn) => tableContent.entries().find((kvp) => fn(kvp[1]))
        // Die filter() - Funktion ist eine Weiterleitung zur Suche über die Werte
        // Liefert ein Array von Arrays zurück, in dem der 0. Eintrag die Id und der 1. Eintrag der Inhalt ist
        tableContent.filter = (fn) => tableContent.entries().filter((kvp) => fn(kvp[1]))
        return tableContent
    }

    /**
     * Speichert den Inhalt einer Tabelle in einer JSON-Datei mit gegebenem Tabellennamen
     * 
     * @param {string} table_name Name der Tabelle
     * @param {object} table_content Inhalt der Tabelle als Objekt
     */
    function saveTable(table_name, table_content) {
        const fileName = database_directory + table_name + '.json'
        log('[DATABASE] Speichere Datenbankdatei %s.', fileName)
        // Sicherstellen, dass Verzeichnisstruktur existiert
        fs.mkdirSync(path.dirname(fileName), { recursive: true })
        // Datei speichern
        fs.writeFileSync(fileName, JSON.stringify(table_content))
    }

    // Proxy-Handler, der Zugriffe auf Datenbanktabellen abfängt
    const databaseHandler = {
        // Lesender Zugriff auf eine Datenbanktabelle
        get: function(dataObject, tableName) {
            let tableContent = dataObject[tableName]
            // Wenn die Tabelle noch nicht geladen wurde, dann laden
            if (!tableContent) {
                tableContent = loadOrCreateTable(tableName)
                dataObject[tableName] = tableContent
            }
            return tableContent
        }
    }
    
    const database = new Proxy({}, databaseHandler)
    return database
    
}

export { loadDatabase }