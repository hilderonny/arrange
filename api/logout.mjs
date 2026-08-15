/**
 * Benutzer abmelden
 */
export default function(config, databaseUtils, userUtils) {

    return function(request, response) {
        request.session = null
        response.sendStatus(200)
    }

}
