/**
 * Globale Middleware, die aus dem Request einen JSON Webtoken extrahiert (falls vorhanden) 
 * und das request.user Objekt erzeugt, welches Informationen und Hilfsfunktionen für den 
 * angemeldeten Benutzer enthält.
 * 
 * Verwendung:
 * arrange.webServer.use((await import('./middlewares/identifyuser.mjs')).default(arrange))
 */
import jsonwebtoken from 'jsonwebtoken'

/**
 * Prüft, ob der übergebene Benutzer über mindestens eine der angegebenen
 * Berechtigungen verfügt.
 * 
 * @param {object} arrange Verweis auf arrange Instanz
 * @param {string} user_id Id des zu prüfenden Benutzers
 * @param {string[]} permission_ids Feld mit Berechtigungs-Ids, die geprüft werden.
 */
function hasUserPermission(arrange, user_id, permission_ids) {
    const usersTable = arrange.database['users/users']
    // Gucken, ob es den Benutzer mit der Id überhaupt gibt
    const user = usersTable.get(user_id)
    if (!user || !user.usergroupids) return false
    // Über alle Benutzergruppen des Benutzers iterieren und von dort die Berechtigungen zusammenfassen
    const usergroupsTable = arrange.database['users/usergroups']
    for (const usergroupId of user.usergroupids) {
        const usergroup = usergroupsTable.get(usergroupId)
        // Der benutzer muss mindestens eine der übergebenen Berechtigungen haben
        if (usergroup && usergroup.permissionids && usergroup.permissionids.some(permissionId => permission_ids.includes(permissionId))) return true // Mindestens eine der Berechtigungen gefunden
    }
    // Berechtigung nirgends gefunden
    return false
}

/**
 * Middleware zum Identifizieren eines Benutzers anhand seines WebTokens, das im Cookie "users-token" gespeichert ist.
 */
export default (arrange) => {
    return (request, _, next) => {
        const token = request.cookies['users-token']
        if (token) {
            jsonwebtoken.verify(token, arrange.tokenSecret, (error, decodedToken) => {
                if (!error) {
                    const userId = decodedToken.userid
                    request.user = {
                        id: userId,
                        hasPermission: (permission_ids) => hasUserPermission(arrange, userId, permission_ids)
                    }
                }
                next()
            })
        } else {
            next()
        }
    }
}