export default (arrange) => {

    // Metainformationen über Datenbanktabelle
    arrange.webServer.get('/api/home/metadata/:table_name', async(request, response) => {
        const tableName = request.params.table_name
        const metadata = arrange.metadata[tableName]
        if (!metadata) return response.sendStatus(404)
        // Metadaten komplett zurück geben
        response.send(metadata)
    })

}