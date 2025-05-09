import { randomUUID } from 'node:crypto'

export default function (arrange) {

    // App speichern oder anlegen, es wird immer der vollständige Datensatz erwartet
    arrange.webServer.post('/api/home/saveapp', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('HOME_APPMANAGEMENT')) return response.sendStatus(403)
        // App-Tabelle öffnen
        const appsTable = arrange.database['home/apps']
        // Appdatensatz vorbereiten, immer from scratch
        const appFromRequest = request.body
        const appId = appFromRequest.id || randomUUID()
        const app = appsTable[appId] || {} // Wenn App noch nicht existiert, dann neu anlegen
        // Daten einzeln aus Request übernehmen
        app.name = appFromRequest.name
        app.icon = appFromRequest.icon
        app.url = appFromRequest.url
        app.index = appFromRequest.index
        app.isdefault = appFromRequest.isdefault
        app.permissionid = appFromRequest.permissionid
        // App speichern
        appsTable[appId] = app
        appsTable.save()
        // Rückgabe zusammenbasteln
        const appToReturn = JSON.parse(JSON.stringify(app))
        appToReturn.id = appId
        response.send(appToReturn)
    })

}