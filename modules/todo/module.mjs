import express from 'express'
import { loadApis } from '../../helpers/apihelper.mjs'

async function init(arrange) {
    // Berechtigung registrieren
    const permissionsTable = arrange.database['users/permissions']
    if (!permissionsTable.get('TODO_TODO')) permissionsTable.push({ id: 'TODO_TODO', name: 'Aufgaben' })
    permissionsTable.save()
    // Apps registrieren
    const appTable = arrange.database['home/apps']
    if (!appTable.get('TODO_TODO')) appTable.push({ id: 'TODO_TODO', name: 'Aufgaben', icon: '/modules/todo/images/favicon_192x192.png', url: '/modules/todo/index.html', index: 11000, permissionid: 'TODO_TODO' })
    appTable.save()
}

async function publishRoutes(arrange) {
    // HTML-Seiten aus Unterverzeichnis `./public` an URL `/modules/todo` veröffentlichen
    arrange.webServer.use('/modules/todo', express.static(`${import.meta.dirname}/public`))
    // Alle APIs erstellen
    await loadApis(arrange, './modules/todo/api')
}

export { init, publishRoutes }
 