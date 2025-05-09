import express from 'express'
import fs from 'node:fs'

async function init(arrange) {
    // Berechtigung registrieren
    const permissionsTable = arrange.database['users/permissions']
    if (!permissionsTable['TODO_TODO']) permissionsTable['TODO_TODO'] = { name: 'Aufgaben' }
    permissionsTable.save()
    // Apps registrieren
    const appTable = arrange.database['home/apps']
    if (!appTable['TODO_TODO']) appTable['TODO_TODO'] = { name: 'Aufgaben', icon: '/modules/todo/images/to-do-list.png', url: '/modules/todo/todolist.html', index: 11000, permissionid: 'TODO_TODO' }
    appTable.save()
}

async function publishRoutes(arrange) {
    // HTML-Seiten aus Unterverzeichnis `./public` an URL `/modules/todo` veröffentlichen
    arrange.webServer.use('/modules/todo', express.static(`${import.meta.dirname}/public`))
    // Alle APIs laden
    for (const fileName of fs.readdirSync('./modules/todo/api')) {
        if (fileName.endsWith('.mjs')) {
            arrange.log('[MODULE TODO] Lade API %s.', fileName)
            const api = await import(`./api/${fileName}`)
            api.default(arrange)
        }
    }
}

export { init, publishRoutes }
 