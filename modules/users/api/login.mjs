import { createHash } from 'node:crypto'
import jsonwebtoken from 'jsonwebtoken'

function createLoginApi(arrange) {

    // Benutzer anmelden
    arrange.webServer.post('/api/users/login', async(request, response) => {
        const username = request.body.username
        const password = request.body.password
        // Passwort hashen
        const hashedPassword = createHash('sha256').update(password).digest('hex')
        // Benutzerdatenbank öffnen
        const usersTable = arrange.database['users/users']
        // Prüfen, ob es den Benutzer mit dem gegebenen Benutzernamen schon gibt
        const existingUser = usersTable.find(user => user.name === username && user.password === hashedPassword)
        if (!existingUser) {
            // Benutzer nicht gefunden oder Passwort falsh
            return response.sendStatus(403)
        }
        // JSON Web Token generieren
        const token = jsonwebtoken.sign({ userid: existingUser[0] }, arrange.localConfig.tokensecret)
        response.send({ token: token })
    })

}

export { createLoginApi }