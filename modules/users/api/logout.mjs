export default (arrange) => {

    // Benutzer abmelden
    arrange.webServer.get('/api/users/logout', async(_, response) => {
        response.clearCookie('users-token')
        response.sendStatus(200)
    })

}