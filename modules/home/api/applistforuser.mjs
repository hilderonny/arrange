export default (arrange) => {

    // Liste von Apps für Navigation
    arrange.webServer.get('/api/home/applistforuser', async(request, response) => {
        const appTable = arrange.database['home/apps']
        // App-Liste filtern und nur die zurück geben, auf die der Benutzer Zugriff hat
        const filteredApps = appTable.filter(app => {
            if (!app.permissionid) return true // Apps ohne notwendige Berechtigungen sind für alle (auch ohne Anmeldung) zu sehen
            if (!request.user) return false // Apps, die Berechtigungen haben, erfordern einen angemeldeten Benutzer
            return request.user.hasPermission([app.permissionid])
        })
        // Liste nach Index sortieren
        filteredApps.sort((a, b) => a.index - b.index)
        response.send(filteredApps)
    })

}