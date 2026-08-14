import crypto from 'node:crypto'

import userUtils from '../utils/userUtils.mjs'

/**
 * Benutzer registrieren
 */
export default function(request, response) {
    const username = request.body.username
    const password = request.body.password
    if (!username || !password) return response.sendStatus(400)
    const existingUser = userUtils.getUserForUsername(username)
    if (existingUser) return response.sendStatus(409)
    const passwortHash = crypto.createHash('sha256').update(password).digest('hex')
    const newuser = {
        id: Date.now().toString() + Math.floor(Math.random() * 1000000),
        password: passwortHash,
        username: username,
    }
    userUtils.addUser(newuser)
    userUtils.saveUsers()
    userUtils.createUserSession(request, newuser.id)
    response.json({
        id: newuser.id,
        username: newuser.username,
    })
}