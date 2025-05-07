import { createHash } from 'node:crypto'
import jsonwebtoken from 'jsonwebtoken'

export default (arrange) => {

    // Benutzer anmelden
    arrange.webServer.post('/api/users/login', async(request, response) => {
        const username = request.body.username
        const password = request.body.password
        // Passwort hashen
        const hashedPassword = createHash('sha256').update(password).digest('hex')
        // Benutzertabelle öffnen
        const usersTable = arrange.database['users/users']
        // Prüfen, ob es den Benutzer mit dem gegebenen Benutzernamen schon gibt
        const existingUser = usersTable.find(user => user.name === username && user.password === hashedPassword)
        if (!existingUser) {
            // Benutzer nicht gefunden oder Passwort falsch
            return response.sendStatus(403)
        }
        // JSON Web Token generieren und in Cookie speichern
        const token = jsonwebtoken.sign({ userid: existingUser[0] }, process.env.ARRANGE_TOKEN_SECRET)
        response.cookie('users-token', token, { maxAge: 24*60*60*1000 })
        response.sendStatus(200)
    })

}