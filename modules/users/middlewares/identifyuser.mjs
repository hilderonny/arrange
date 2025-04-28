/**
 * Globale Middleware, die aus dem Request einen JSON Webtoken extrahiert (falls vorhanden) 
 * und das request.user Objekt erzeugt, welches Informationen und Hilfsfunktionen für den 
 * angemeldeten Benutzer enthält.
 * 
 * Verwendung:
 * webServer.use(identifyuser.createMiddleware(arrange))
 */
import jsonwebtoken from 'jsonwebtoken'

function hasUserPermission(arrange, user_id, permission_name) {
    const usergroupassignmentsTable = arrange.database['users/usergroupassignments']
    const assignedUsergroupIds = usergroupassignmentsTable.filter(a => a.userid === user_id).map(kvp => kvp[1].usergroupid)
    const permissionAssignmentsTable = arrange.database['users/permissionassignments']
    const hasPermission = permissionAssignmentsTable.find(pa => assignedUsergroupIds.indexOf(pa.usergroupid) > -1 && pa.permissionid === permission_name)
    return !!hasPermission
}

function createMiddleware(arrange) {
    return (request, _, next) => {
        const token = request.cookies['users-token']
        if (token) {
            jsonwebtoken.verify(token, arrange.localConfig.tokensecret, (error, decodedToken) => {
                if (!error) {
                    const userId = decodedToken.userid
                    request.user = {
                        id: userId,
                        hasPermission: (permission_name) => hasUserPermission(arrange, userId, permission_name)
                    }
                }
                next()
            })
        } else {
            next()
        }
    }
}

export { createMiddleware }