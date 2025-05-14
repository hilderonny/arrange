
async function init(arrange) {
    // Apps registrieren
    const appTable = arrange.database['home/apps']
    if (!appTable.get('HOME_HOME')) appTable.push({ id: 'HOME_HOME', name: 'Home', icon: '/images/house.png', url: '/home.html', index: 0, isdefault: true })
    if (!appTable.get('HOME_APPMANAGEMENT')) appTable.push({ id: 'HOME_APPMANAGEMENT', name: 'App-Verwaltung', icon: '/images/apps.png', url: '/appmanagement.html', index: 10000, permissionid: 'HOME_APPMANAGEMENT' })
    appTable.save()
    // Berechtigung für App-Verwaltung erstellen
    const permissionsTable = arrange.database['users/permissions']
    if (!permissionsTable.get('HOME_APPMANAGEMENT')) permissionsTable.push({ id: 'HOME_APPMANAGEMENT', name: 'App-Verwaltung' })
    permissionsTable.save()
}

async function publishRoutes(arrange) {
    // HTML-Seiten aus Unterverzeichnis `./public` an URL `/` veröffentlichen
    arrange.webServer.use('/', arrange.express.static(`${import.meta.dirname}/public`))
    // Alle APIs erstellen
    arrange.apiHelper.createListForPermissionApi(arrange, 'home/apps', '/api/home/applistforuser')
    arrange.apiHelper.createListApi(arrange, 'home/apps', '/api/home/listapps', [ 'HOME_APPMANAGEMENT' ])
    arrange.apiHelper.createSaveApi(arrange, 'home/apps', '/api/home/saveapp', [ 'HOME_APPMANAGEMENT' ])
    arrange.apiHelper.createDeleteApi(arrange, 'home/apps', '/api/home/deleteapp', [ 'HOME_APPMANAGEMENT' ])
}
 
export { init, publishRoutes }