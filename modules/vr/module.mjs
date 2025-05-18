async function init(arrange) {
    // Berechtigung registrieren
    const permissionsTable = arrange.database['users/permissions']
    if (!permissionsTable.get('VR_VIEW')) permissionsTable.push({ id: 'VR_VIEW', name: 'VR' })
    permissionsTable.save()
    // Apps registrieren
    const appTable = arrange.database['home/apps']
    if (!appTable.get('VR')) appTable.push({ id: 'VR', name: 'VR', icon: '/modules/vr/images/vr.png', url: '/modules/vr/index.html', index: 11000, permissionid: 'VR_VIEW' })
    appTable.save()
}

async function publishRoutes(arrange) {
    // HTML-Seiten aus Unterverzeichnis `./public` an URL `/modules/vr` veröffentlichen
    arrange.webServer.use('/modules/vr', arrange.express.static(`${import.meta.dirname}/public`))
}

export { init, publishRoutes }
 