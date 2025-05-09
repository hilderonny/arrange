export default (arrange) => {

    // App löschen
    arrange.webServer.delete('/api/home/deleteapp', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('HOME_APPMANAGEMENT')) return response.sendStatus(401)
        // App-ID aus Request holen
        const appId = request.body.id
        if (appId) {
            // App-tabelle öffnen und App löschen
            const appsTable = arrange.database['home/apps']
            if (appsTable[appId]) {
                delete appsTable[appId]
                appsTable.save()
            }
        }
        // Einfach immer 200 senden, auch wenn App gar nicht existiert hat
        response.sendStatus(200)
    })

}