import express from 'express'
import { createAppListApi } from './api/applist.mjs'

async function init(arrange) {
    // App registrieren
    arrange.apps.push({ id: 'home-home', label: 'Home', icon: '/images/house.png', url: '/home.html', default: true })
}

async function publishRoutes(arrange) {
    // HTML-Seiten aus Unterverzeichnis `./public` an URL `/` veröffentlichen
    arrange.webServer.use('/', express.static(`${import.meta.dirname}/public`))
    // API für Anwendungsliste in Navigation und Home-Seite
    createAppListApi(arrange)
}
 
export { init, publishRoutes }
 