import express from 'express'
 
 async function publishRoutes(arrange) {
    // HTML-Seiten aus Unterverzeichnis `./public` an URL `/` veröffentlichen
    arrange.app.use('/', express.static(`${import.meta.dirname}/public`))
 }
 
 export { publishRoutes }
 