/**
 * Benutzer abmelden
 */
export default function(request, response) {
    request.session = null
    response.sendStatus(200)
}
