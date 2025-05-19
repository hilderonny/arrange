async function init(arrange) {
    // Berechtigungen registrieren
    const permissionsTable = arrange.database['users/permissions']
    if (!permissionsTable.get('FORENSICS_STANDARD_USER')) permissionsTable.push({ id: 'FORENSICS_STANDARD_USER', name: 'Forensik' })
    permissionsTable.save()
    // Apps registrieren
    const appTable = arrange.database['home/apps']
    if (!appTable.get('FORENSICS')) appTable.push({ id: 'FORENSICS', name: 'Forensik', icon: '/modules/forensics/images/forensics.png', url: '/modules/forensics/cases.html', index: 2000, permissionid: 'FORENSICS_STANDARD_USER' })
    appTable.save()
}

async function publishRoutes(arrange) {
    // HTML-Seiten
    arrange.webServer.use('/modules/forensics', arrange.express.static(`${import.meta.dirname}/public`))
    // Alle APIs erstellen
    arrange.apiHelper.createListApi(arrange, 'forensics/cases', '/api/forensics/listcases', [ 'FORENSICS_STANDARD_USER' ])
    arrange.apiHelper.createSaveApi(arrange, 'forensics/cases', '/api/forensics/savecase', [ 'FORENSICS_STANDARD_USER' ])
    arrange.apiHelper.createDeleteApi(arrange, 'forensics/cases', '/api/forensics/deletecase', [ 'FORENSICS_STANDARD_USER' ])
}

export { init, publishRoutes }