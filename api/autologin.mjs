/**
 * Automatische Anmeldung anhand des Cookies
 */
export default function(config, databaseUtils, userUtils) {

    return function(request, response) {
        if (request.session && request.session.userId) {
            response.sendStatus(200)
        } else {
            response.sendStatus(401)
        }
    }

}

