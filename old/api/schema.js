/**
 * API for manipulating the database
 */
const express = require('express');
const router = express.Router();
const { Client } = require('pg');

// Connect to database
const client = new Client();
client.connect();

/**
 * Expects an SQL query as text body and returns the result as JSON
 */
router.post('/query', express.text(), async (request, response) => {
    try {
        const result = await client.query(request.body);
        response.send(result);
    } catch (e) {
        console.log(e);
        response.status(400).send(e);
    }
});

module.exports = router;