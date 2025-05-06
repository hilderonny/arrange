import { createHash, randomUUID } from 'node:crypto'

export default (arrange) => {

    // Beutzer speichern oder anlegen
    arrange.webServer.post('/api/users/saveuser', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('PERMISSION_ADMINISTRATION_USER')) return response.sendStatus(401)
        // Benutzertabelle öffnen
        const usersTable = arrange.database['users/users']
        // Benutzer in Tabelle suchen oder anlegen, wenn keine Id angegeben ist
        let userId = request.body.id
        let user
        if (userId) {
            user = usersTable[userId]
        } else {
            userId = randomUUID()
            user = {}
        }
        console.log('BEFORE', userId, user)
        // Daten aus Request übernehmen
        for (const [propertyKey, propertyValue] of Object.entries(request.body)) {
            if (propertyKey === 'id') {
                continue // Id wird nicht im Datensatz selbst gespeichert
            } else if (propertyKey === 'password') {
                // Passwörter verschlüsseln und nur dann aktualisieren, wenn wirklich eines übergeben wurde
                console.log(propertyValue, propertyValue.length, propertyValue.length < 1)
                if (!propertyValue || propertyValue.length < 1) continue
                const hashedPassword = createHash('sha256').update(propertyValue).digest('hex')
                user[propertyKey] = hashedPassword
            } else {
                user[propertyKey] = propertyValue
            }
        }
        // Benutzer speichern
        usersTable[userId] = user
        console.log('AFTER', userId, user)
        usersTable.save()
        // Rückgabe zusammenbasteln, aber ohne Passwort
        const userToReturn = JSON.parse(JSON.stringify(user))
        userToReturn.id = userId
        delete userToReturn.password
        response.send(userToReturn)
    })

}