function createAppListApi(arrange) {

    // Liste von Apps für Navigation
    arrange.webServer.get('/api/home/applist', async(request, response) => {
        // App-Liste filtern und nur die zurück geben, auf die der Benutzer Zugriff hat
        const filteredApps = arrange.apps.filter(app => {
            if (!app.permission) return true // Apps ohne notwendige Berechtigungen sind für alle (auch ohne Anmeldung) zu sehen
            if (!request.user) return false // Apps, die Berechtigungen haben, erfordern einen angemeldeten Benutzer
            return request.user.hasPermission(app.permission)
        })
        response.send(filteredApps)
    })

}

export { createAppListApi }