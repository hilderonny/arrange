const arrange = require('../index');
const assert = require('assert');

const port = process.env.PORT;
const dbUrl = process.env.DB_URL;

describe('Server instanziation', function() {

    it('When the database cannot be accessed, a message is written to the console', async function() {
        const oldLog = console.log.bind(console);
        let mongoErrorFound = false;
        console.log = function() {
            if (arguments && arguments[0] && arguments[0].toString().indexOf('MongoTimeoutError') >= 0) {
                mongoErrorFound = true;
                console.log = oldLog;
            } else {
                oldLog.apply(console, arguments);
            }
        }
        const server = new arrange.Server(port, 'unknownhost/unknowndatabase', 'testtokensecret');
        server.db('users').find();
        await new Promise(function(resolve) {
            let count = 350; // Default timeout is 30 seconds
            const interval = setInterval(function() {
                if (!mongoErrorFound && count > 0) {
                    count--;
                    return;
                }
                assert.ok(mongoErrorFound);
                clearInterval(interval);
                resolve();
            }, 100);
        });
    });

});

describe('Server start', function() {

    it('After start the port is written to the console', async function() {
        const oldLog = console.log.bind(console);
        let logFound = false;
        const matchString = 'Arrange server running at port ' + port;
        console.log = function() {
            if (arguments && arguments[0] && arguments[0].toString().indexOf(matchString) >= 0) {
                logFound = true;
                console.log = oldLog;
            } else {
                oldLog.apply(console, arguments);
            }
        }
        const server = new arrange.Server(port, dbUrl, 'testtokensecret');
        server.start();
        await new Promise(function(resolve) {
            let count = 50;
            const interval = setInterval(function() {
                if (!logFound && count > 0) {
                    count--;
                    return;
                }
                assert.ok(logFound);
                clearInterval(interval);
                resolve();
            }, 100);
        });
    });

});