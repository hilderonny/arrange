/**
 * Automatische Anmeldung anhand des Cookies
 */
export default function(request, response) {
    if (request.session && request.session.userId) {
        response.sendStatus(200)
    } else {
        response.sendStatus(401)
    }
}