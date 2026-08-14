import crypto from 'node:crypto'

import userUtils from '../utils/userUtils.mjs'

/**
 * Benutzer anmelden
 */
export default function(request, response) {
    const username = request.body.username
    const password = request.body.password
    if (!username || !password) return response.sendStatus(400)
    const user = userUtils.getUserForUsername(username)
    if (!user) return response.sendStatus(401)
    const passwortHash = crypto.createHash('sha256').update(password).digest('hex')
    if (user.password !== passwortHash) return response.sendStatus(401)
    userUtils.createUserSession(request, user.id)
    response.json({
        id: user.id,
        username: user.username,
    })
}