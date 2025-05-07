import { createHash, randomUUID } from 'node:crypto'

export default function (arrange) {

    // Benutzer speichern oder anlegen, es wird immer der vollständige Benutzerdatensatz erwartet
    arrange.webServer.post('/api/users/saveuser', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('PERMISSION_ADMINISTRATION_USER')) return response.sendStatus(401)
        // Benutzertabelle öffnen
        const usersTable = arrange.database['users/users']
        // Benutzerdatensatz vorbereiten, immer from scratch
        const userFromRequest = request.body
        const userId = userFromRequest.id || randomUUID()
        const user = usersTable[userId] || {} // Wenn Benutzer noch nicht existiert, dann neu anlegen
        // Daten einzeln aus Request übernehmen
        user.name = userFromRequest.name
        if (userFromRequest.password) user.password = createHash('sha256').update(userFromRequest.password).digest('hex') // Passwort nur nehmen, wenn im Request angegeben.
        user.usergroupids = userFromRequest.usergroupids
        // Benutzer speichern
        usersTable[userId] = user
        usersTable.save()
        // Rückgabe zusammenbasteln, aber ohne Passwort
        const userToReturn = JSON.parse(JSON.stringify(user))
        userToReturn.id = userId
        delete userToReturn.password
        response.send(userToReturn)
    })

}