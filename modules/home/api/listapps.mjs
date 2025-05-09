export default (arrange) => {

    // Apps auflisten
    arrange.webServer.get('/api/home/listapps', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('HOME_APPMANAGEMENT')) return response.sendStatus(403)
        // App-Tabelle öffnen
        const appsTable = arrange.database['home/apps']
        const appList = appsTable.entries().map(([appId, app]) => { 
            return {
                id: appId,
                name: app.name,
                icon: app.icon,
                url: app.url,
                index: app.index,
                isdefault: app.isdefault,
                permissionid: app.permissionid,
            }
        })
        // Liste alphabetisch sortieren
        appList.sort((a, b) => a.name.localeCompare(b.name))
        response.send(appList)
    })

}