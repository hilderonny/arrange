import fs from 'node:fs'

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