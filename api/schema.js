/**
 * API for manipulating the database
 */
const router = require('express').Router();
const { Client } = require('pg');

// Connect to database
const client = new Client();
client.connect();

/**
 * List of all tables in the database
 */
router.get('/tables', async (_, response) => {
    const result = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
    response.send(result.rows.map((row => row['table_name'])));
});

/**
 * Deletes a table with the given tablename
 */
router.delete('/tables/:tablename', async (request, response) => {
    try {
        await client.query(`DROP TABLE ${request.params.tablename};`);
        response.sendStatus(200);
    } catch {
        response.sendStatus(400);
    }
});

/**
 * Creates a table with the given tablename
 */
router.post('/tables/:tablename', async (request, response) => {
    try {
        await client.query(`CREATE TABLE ${request.params.tablename} (id SERIAL PRIMARY KEY);`);
        response.sendStatus(200);
    } catch {
        response.sendStatus(400);
    }
});

/**
 * List of all columns in the given tablename table
 */
router.get('/columns/:tablename', async (request, response) => {
    try {
        const result = await client.query(`SELECT * FROM information_schema.columns WHERE TABLE_NAME = '${request.params.tablename}';`);
        const columns = {};
        for (const col of result.rows) {
            columns[col['column_name']] = col['data_type'];
        }
        response.send(columns);
    } catch {
        response.sendStatus(400);
    }
});

/**
 * Deletes a column with the given columnname in the tablename
 */
router.delete('/columns/:tablename/:columnname', async (request, response) => {
    try {
        await client.query(`ALTER TABLE ${request.params.tablename} DROP COLUMN ${request.params.columnname};`);
        response.sendStatus(200);
    } catch {
        response.sendStatus(400);
    }
});

/**
 * Creates a column with the given columnname in the tablename
 */
router.post('/columns/:tablename/:columnname/:datatype', async (request, response) => {
    try {
        await client.query(`ALTER TABLE ${request.params.tablename} ADD COLUMN ${request.params.columnname} ${request.params.datatype};`);
        response.sendStatus(200);
    } catch {
        response.sendStatus(400);
    }
});

module.exports = router;