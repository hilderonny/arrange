export default (arrange) => {

    // Liste von Apps für Navigation
    arrange.webServer.get('/api/home/applistforuser', async(request, response) => {
        const appTable = arrange.database['home/apps']
        // Zurückgegebene Apps sollen die Id als Property enthalten
        const mappedApps = Object.entries(appTable).map(([id, app]) => {
            if (typeof app === 'function') return undefined // Funktionen überspringen
            return {
                id: id,
                name: app.name,
                icon: app.icon,
                url: app.url,
                index: app.index,
                isdefault: app.isdefault,
                permissionid: app.permissionid
            }
        })
        // App-Liste filtern und nur die zurück geben, auf die der Benutzer Zugriff hat
        const filteredApps = mappedApps.filter(app => {
            if (!app) return false // Funktionen sind oben als undefined festgelet und sollen ignoriert werden
            if (!app.permissionid) return true // Apps ohne notwendige Berechtigungen sind für alle (auch ohne Anmeldung) zu sehen
            if (!request.user) return false // Apps, die Berechtigungen haben, erfordern einen angemeldeten Benutzer
            return request.user.hasPermission(app.permissionid)
        })
        // Liste nach Index sortieren
        filteredApps.sort((a, b) => a.index - b.index)
        response.send(filteredApps)
    })

}