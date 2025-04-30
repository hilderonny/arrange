/**
 * Globale Middleware, die aus dem Request einen JSON Webtoken extrahiert (falls vorhanden) 
 * und das request.user Objekt erzeugt, welches Informationen und Hilfsfunktionen für den 
 * angemeldeten Benutzer enthält.
 * 
 * Verwendung:
 * webServer.use(identifyuser.createMiddleware(arrange))
 */
import jsonwebtoken from 'jsonwebtoken'

function hasUserPermission(arrange, user_id, permission_id) {
    const usersTable = arrange.database['users/users']
    const user = usersTable[user_id]
    if (!user || !user.usergroupids) return false
    const usergroupsTable = arrange.database['users/usergroups']
    for (const usergroupId of user.usergroupids) {
        const usergroup = usergroupsTable[usergroupId]
        if (usergroup && usergroup.permissionids && usergroup.permissionids.indexOf(permission_id) >= 0) return true // Berechtigung gefunden
    }
    // Berechtigung nirgends gefunden
    return false
}

export default (arrange) => {
    return (request, _, next) => {
        const token = request.cookies['users-token']
        if (token) {
            jsonwebtoken.verify(token, arrange.localConfig.tokensecret, (error, decodedToken) => {
                if (!error) {
                    const userId = decodedToken.userid
                    request.user = {
                        id: userId,
                        hasPermission: (permission_id) => hasUserPermission(arrange, userId, permission_id)
                    }
                }
                next()
            })
        } else {
            next()
        }
    }
}