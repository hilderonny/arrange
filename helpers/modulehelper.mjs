import fs from 'node:fs'
import { log } from './loghelper.mjs'
import path from 'node:path'

/**
 * Lädt alle angegebenen Module und initialisiert diese
 * 
 * @param {string} modules_to_load Liste von Modulverzeichnissen, die geladen werden sollen
 * @param {object} arrange Arrange-Objekt, das Konfigurationen und Hilfsfunktionen enthält
 */
async function loadModules(modules_to_load, arrange) {

    const allModules = []

    for (const modulePath of modules_to_load) {
        console.log(modulePath, path.resolve(modulePath))
        if (fs.existsSync(modulePath)) {
            log('[MODULES] Lade Modul %s.', modulePath)
            const module = await import(`../${modulePath}`)
            allModules.push(module)
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