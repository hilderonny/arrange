import express from 'express'
import fs from 'node:fs'

async function init(arrange) {
    // App registrieren
    arrange.apps.push({ id: 'home-home', label: 'Home', icon: '/images/house.png', url: '/home.html', default: true })
}

async function publishRoutes(arrange) {
    // HTML-Seiten aus Unterverzeichnis `./public` an URL `/` veröffentlichen
    arrange.webServer.use('/', express.static(`${import.meta.dirname}/public`))
    // Alle APIs laden
    for (const fileName of fs.readdirSync('./modules/home/api')) {
        if (fileName.endsWith('.mjs')) {
            arrange.log('[MODULE USERS] Lade API %s.', fileName)
            const api = await import(`./api/${fileName}`)
            api.default(arrange)
        }
    }
}
 
export { init, publishRoutes }
 