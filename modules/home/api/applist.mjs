function createAppListApi(arrange) {

    // Liste von Apps für Navigation
    arrange.webServer.get('/api/home/applist', async(_, response) => {
        response.send(arrange.apps)
    })

}

export { createAppListApi }