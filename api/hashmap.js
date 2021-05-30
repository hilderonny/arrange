/**
 * API for storing and retrieving data in memory for sharing between devices.
 */
const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();

const hashmap = {};

/**
 * Retrieve list of keys
 */
router.get('/', (_, response) => {
    response.send(Object.keys(hashmap));
});

/**
 * Retrieve data of key
 */
router.get('/:key', (request, response) => {
    response.send(hashmap[request.params.key]);
});

/**
 * Post JSON data and store it in key
 */
router.post('/:key', bodyParser.text(), (request, response) => {
    const data = request.body;
    hashmap[request.params.key] = data;
    response.send(data);
});

/**
 * DELETE data in key
 */
router.delete('/:key', (request, response) => {
    delete hashmap[request.params.key];
    response.sendStatus(200);
});

module.exports = router;