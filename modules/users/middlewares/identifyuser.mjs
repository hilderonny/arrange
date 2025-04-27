/**
 * Globale Middleware, die aus dem Request einen JSON Webtoken extrahiert (falls vorhanden) 
 * und das request.user Objekt erzeugt, welches Informationen und Hilfsfunktionen für den 
 * angemeldeten Benutzer enthält.
 * 
 * Verwendung:
 * webServer.use(identifyuser.createMiddleware(arrange))
 */
import jsonwebtoken from 'jsonwebtoken'

function canUserRead(arrange, user_id, permission_name) {

}

function canUserWrite(arrange, user_id, permission_name) {

}

function createMiddleware(arrange) {
    return (request, _, next) => {
        // Token müssen entweder im HTTP-Header 'x-access-token' oder
        // bei Downloads als Request-Parameter 'token' gesendet werden
        const token = request.query.token || request.headers['x-access-token']
        if (token) {
            jsonwebtoken.verify(token, arrange.localconfig.tokensecret, (error, decodedToken) => {
                if (!error) {
                    request.user = {
                        id: decodedToken.userid,
                        canRead: (permission_name) => canUserRead(arrange, decodedToken.userid, permission_name),
                        canWrite: (permission_name) => canUserWrite(arrange, decodedToken.userid, permission_name)
                    }
                }
                // Request soll immer verarbeitet werden, auch wenn kein user Objekt erzeugt wurde
                next()
            })
        } else {
            next()
        }
    }
}

export { createMiddleware }