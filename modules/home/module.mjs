import express from 'express'
import fs from 'node:fs'

async function init(arrange) {
    // Apps registrieren
    const appTable = arrange.database['home/apps']
    appTable['HOME_HOME'] = { name: 'Home', icon: '/images/house.png', url: '/home.html', index: 0, isdefault: true }
    if (!appTable['HOME_APPMANAGEMENT']) appTable['HOME_APPMANAGEMENT'] = { name: 'App-Verwaltung', icon: '/images/apps.png', url: '/appmanagement.html', index: 10000, permissionid: 'HOME_APPMANAGEMENT' }
    appTable.save()
    // Berechtigung für App-Verwaltung erstellen
    const permissionsTable = arrange.database['users/permissions']
    if (!permissionsTable['HOME_APPMANAGEMENT']) permissionsTable['HOME_APPMANAGEMENT'] = { name: 'App-Verwaltung' }
    permissionsTable.save()
}

async function publishRoutes(arrange) {
    // HTML-Seiten aus Unterverzeichnis `./public` an URL `/` veröffentlichen
    arrange.webServer.use('/', express.static(`${import.meta.dirname}/public`))
    // Alle APIs laden
    for (const fileName of fs.readdirSync('./modules/home/api')) {
        if (fileName.endsWith('.mjs')) {
            arrange.log('[MODULE HOME] Lade API %s.', fileName)
            const api = await import(`./api/${fileName}`)
            api.default(arrange)
        }
    }
}
 
export { init, publishRoutes }
 