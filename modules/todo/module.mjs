import path from 'node:path'

async function init(arrange) {
    // Berechtigung registrieren
    const permissionsTable = arrange.database['users/permissions']
    if (!permissionsTable.get('TODO_TODO')) permissionsTable.push({ id: 'TODO_TODO', name: 'Aufgaben' })
    permissionsTable.save()
    // Apps registrieren
    const appTable = arrange.database['home/apps']
    if (!appTable.get('TODO_TODO')) appTable.push({ id: 'TODO_TODO', name: 'Aufgaben', icon: '/modules/todo/images/list.png', url: '/modules/todo/index.html', index: 11000, permissionid: 'TODO_TODO' })
    appTable.save()
}

async function publishRoutes(arrange) {
    // HTML-Seiten aus Unterverzeichnis `./public` an URL `/modules/todo` veröffentlichen
    arrange.webServer.use('/modules/todo', arrange.express.static(`${import.meta.dirname}/public`))
    // Alle APIs erstellen
    await arrange.apiHelper.loadApis(arrange, path.resolve(import.meta.dirname, './api'))
}

export { init, publishRoutes }
 