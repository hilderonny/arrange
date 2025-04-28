function createLogoutApi(arrange) {

    // Benutzer abmelden
    arrange.webServer.get('/api/users/logout', async(request, response) => {
        response.clearCookie('users-token')
        response.sendStatus(200)
    })

}

export { createLogoutApi }