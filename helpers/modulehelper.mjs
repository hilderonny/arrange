import fs from 'fs'
import { log } from './loghelper.mjs'

/**
 * Lädt alle Module im Modulverzeichnispfad und initialisiert diese
 * 
 * @param {string} modules_path Verzeichnispfad, in dem die Modulunterverzeichnisse liegen
 * @param {object} arrange Arrange-Objekt, das Konfigurationen und Hilfsfunktionen enthält
 */
async function loadModules(modules_path, arrange) {

    log('[MODULES] Lade Module von %s.', modules_path)

    const allModules = []

    // Alle Unterverzeichnisse in modules_path suchen und Module laden
    for (const file of fs.readdirSync(modules_path)) {
        const fullPath = `${modules_path}${file}`
        if (fs.statSync(fullPath).isDirectory()) {
            const moduleFilePath = `${fullPath}/module.mjs`
            if (fs.existsSync(moduleFilePath)) {
                log('[MODULES] Lade Modul %s.', moduleFilePath)
                const module = await import(`../${moduleFilePath}`)
                allModules.push(module)
            }
        }
    }

    // Alle Module initialisieren
    log('[MODULES] Initialisiere Module.')
    for (const module of allModules) {
        if (module.init) await module.init(arrange)
    }

    // Alle Middlewares aus den Modulen veröffentlichen
    log('[MODULES] Veröffentliche Middlewares.')
    for (const module of allModules) {
        if (module.publishMiddlewares) await module.publishMiddlewares(arrange)
    }

    // Alle Routen aus den Modulen veröffentlichen
    log('[MODULES] Veröffentliche Routen.')
    for (const module of allModules) {
        if (module.publishRoutes) await module.publishRoutes(arrange)
    }

}

export { loadModules }