/**
 * Globale Middleware, die aus dem Request einen JSON Webtoken extrahiert (falls vorhanden) 
 * und das request.user Objekt erzeugt, welches Informationen und Hilfsfunktionen für den 
 * angemeldeten Benutzer enthält.
 * 
 * Verwendung:
 * webServer.use(identifyuser.createMiddleware(arrange))
 */
import jsonwebtoken from 'jsonwebtoken'

// TODO: hasUserPermission dokumentieren
function hasUserPermission(arrange, user_id, permission_ids) {
    const usersTable = arrange.database['users/users']
    const user = usersTable.get(user_id)
    if (!user || !user.usergroupids) return false
    const usergroupsTable = arrange.database['users/usergroups']
    for (const usergroupId of user.usergroupids) {
        const usergroup = usergroupsTable.get(usergroupId)
        if (usergroup && usergroup.permissionids && usergroup.permissionids.some(permissionId => permission_ids.includes(permissionId))) return true // Mindestens eine der Berechtigungen gefunden
    }
    // Berechtigung nirgends gefunden
    return false
}

// TODO: identifyuser dokumentieren
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