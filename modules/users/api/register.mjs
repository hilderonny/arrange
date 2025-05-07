import { createHash, randomUUID } from 'node:crypto'
import jsonwebtoken from 'jsonwebtoken'

export default (arrange) => {

    // Neuen Benutzer registrieren
    arrange.webServer.post('/api/users/register', async(request, response) => {
        const username = request.body.username
        const password = request.body.password
        // Passwort hashen
        const hashedPassword = createHash('sha256').update(password).digest('hex')
        // Benutzer generieren
        const userId = randomUUID()
        const user = {
            name: username, 
            password: hashedPassword, 
            usergroupids: []
        }
        // Benutzertabelle öffnen
        const usersTable = arrange.database['users/users']
        // Prüfen, ob es den Benutzer mit dem gegebenen Benutzernamen schon gibt
        const existingUser = usersTable.find(u => u.name === username)
        if (existingUser) {
            // Benutzer existiert bereits
            return response.sendStatus(409)
        }
        // Wenn es noch keinen Benutzer in der Datenbank gibt, dann wird dieser erste Benutzer der Administratoren-Gruppe zugeordnet
        const isFirstUser = usersTable.size() < 1
        if (isFirstUser) {
            user.usergroupids.push('USERGROUP_ADMIN')
        }
        // Benutzer zu Benutzertabelle hinzufügen und speichern
        usersTable[userId] = user
        usersTable.save()
        // JSON Web Token generieren und in Cookie speichern
        const token = jsonwebtoken.sign({ userid: userId }, process.env.ARRANGE_TOKEN_SECRET)
        response.cookie('users-token', token, { maxAge: 24*60*60*1000 })
        response.sendStatus(200)
    })

}