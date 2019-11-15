const bcryptjs = require('bcryptjs');
const bodyParser = require('body-parser');
const compression = require('compression');
const cors = require('cors');
const express = require('express');
const http = require('http');
const jsonwebtoken = require('jsonwebtoken');
const monk = require('monk');

class Server {

    /**
     * Server initialisieren.
     * @param {number} port Port, an dem der Server lauschen soll.
     * @param {string} dbUrl URL, an der die MongoDB erreichbar ist. Muss angegeben sein.
     * @param {string} tokenSecret Passphrase, mit der der Auth-Token verschlüsselt wird.
     */
    constructor(port, dbUrl, tokenSecret) {
        this.port = port;
        this.database = monk(dbUrl);
        this.database.catch(function(err) { console.log(err); });
        this.tokenSecret = tokenSecret;
        this.app = express();
        this.app.use(compression());
        this.app.use(cors());
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        // Einbindung in HTML-Seite mit <script src="/arrange/arrange.js"></script>
        this.app.use('/arrange', express.static(__dirname + '/client'));
        // APIs registrieren
        this.app.post('/api/arrange/addreadableby/:table/:id', this.addreadableby.bind(this));
        this.app.post('/api/arrange/addwritableby/:table/:id', this.addwritableby.bind(this));
        this.app.delete('/api/arrange/delete/:table/:id', this.delete.bind(this));
        this.app.post('/api/arrange/details/:table/:id', this.details.bind(this));
        this.app.post('/api/arrange/list/:table', this.list.bind(this));
        this.app.get('/api/arrange/listusers', this.listusers.bind(this));
        this.app.post('/api/arrange/login', this.login.bind(this));
        this.app.post('/api/arrange/register', this.register.bind(this));
        this.app.post('/api/arrange/removereadableby/:table/:id', this.removereadableby.bind(this));
        this.app.post('/api/arrange/removewritableby/:table/:id', this.removewritableby.bind(this));
        this.app.post('/api/arrange/save/:table', this.save.bind(this));
        this.app.post('/api/arrange/setpassword', this.setpassword.bind(this));
        this.app.post('/api/arrange/setpubliclyreadable/:table/:id/:value', this.setpubliclyreadable.bind(this));
        this.app.post('/api/arrange/setpubliclywritable/:table/:id/:value', this.setpubliclywritable.bind(this));
        this.app.post('/api/arrange/transferownership/:table/:entityid/:userid', this.transferownership.bind(this));
    }

    /**
     * API zum Zufügen von Leseberechtigungen
     */
    addreadableby(request, response) {
        const self = this;
        self.auth(request, response, function() {
            const tablename = request.params.table;
            if (tablename === 'users') return response.status(403).json({ error: 'Access to users table forbidden' });
            self.validateparamid('id')(request, response, function() {
                const entityid = request.params.id;
                self.validatebodyid('userid')(request, response, async function() {
                    const userid = request.body.userid;
                    if (!userid) return response.status(400).json({error: 'Target userid is missing' });
                    const collection = self.db(tablename);
                    const user = await self.db('users').findOne(userid);
                    if (!user) return response.status(404).json({error: 'User not found' });
                    const entity = await collection.findOne(entityid);
                    if (!entity) return response.status(404).json({error: 'Entity not found' });
                    if (entity._ownerid !== request.user._id.toString()) {
                        return response.status(403).json({ error: 'Only the entity owner can do this' });
                    }
                    const entityToWrite = {
                        _readableby: entity._readableby ? entity._readableby : []
                    }
                    if (entityToWrite._readableby.indexOf(userid) < 0) entityToWrite._readableby.push(userid);
                    await collection.update(entityid, { $set: entityToWrite });
                    response.status(200).send();
                });
            });
        });
    }

    /**
     * API zum Zufügen von Schreibberechtigungen
     */
    addwritableby(request, response) {
        const self = this;
        self.auth(request, response, function() {
            const tablename = request.params.table;
            if (tablename === 'users') return response.status(403).json({ error: 'Access to users table forbidden' });
            self.validateparamid('id')(request, response, function() {
                const entityid = request.params.id;
                self.validatebodyid('userid')(request, response, async function() {
                    const userid = request.body.userid;
                    if (!userid) return response.status(400).json({error: 'Target userid is missing' });
                    const collection = self.db(tablename);
                    const user = await self.db('users').findOne(userid);
                    if (!user) return response.status(404).json({error: 'User not found' });
                    const entity = await collection.findOne(entityid);
                    if (!entity) return response.status(404).json({error: 'Entity not found' });
                    if (entity._ownerid !== request.user._id.toString()) {
                        return response.status(403).json({ error: 'Only the entity owner can do this' });
                    }
                    const entityToWrite = {
                        _writableby: entity._writableby ? entity._writableby : []
                    }
                    if (entityToWrite._writableby.indexOf(userid) < 0) entityToWrite._writableby.push(userid);
                    await collection.update(entityid, { $set: entityToWrite });
                    response.status(200).send();
                });
            });
        });
    }

    /**
     * Middleware zur Benutzerauthentifizierung.
     * Liefert response 401, wenn Benutzer nicht authentifizierbar ist.
     * Schreibt request.user mit _id und username.
     * Verwendung: arrangeInstance.app.post('/api/myapi', arrangeInstance.auth.bind(arrangeInstance), function(req, res) { ... });
     */
    auth(request, response, next) {
        const self = this;
        const token = request.header('x-access-token');
        if (!token) return response.status(401).json({ error: 'Token is missing' });
        jsonwebtoken.verify(token, self.tokenSecret, function(error, tokenUser) {
            if (error) return response.status(401).json({ error: 'Token cannot be validated' });
            self.db('users').findOne(tokenUser._id, { projection: { '_id': 1, 'username': 1 }}).then(function(user) {
                if (!user) return response.status(401).json({ error: 'User not found' });
                request.user = user;
                user._id = user._id.toString(); // Convert ObjectID to string for compatibility
                next();
            });
        });
    }

    /**
     * Middleware zum Prüfen, ob ein Datenbankobjekt vom angemeldeten Benutzer lesbar ist.
     * Verwendung: arrangeInstance.app.get('/api/myapi/:tablename/:id', arrangeInstance.canread.bind(arrangeInstance)('tablename', 'id'), function(req, res) { ... });
     */
    canread(tablenameparam, entityidparam) {
        const self = this;
        return function(request, response, next) {
            const tablename = request.params[tablenameparam];
            if (!tablename) return response.status(400).json({error: 'Parameter ' + tablenameparam + ' is not given' });
            self.auth(request, response, function() {
                const userid = request.user._id;
                self.validateparamid(entityidparam)(request, response, async function() {
                    const id = request.params[entityidparam];
                    const entity = await self.database.get(tablename).findOne(id, { projection: { '_ownerid': 1, '_publiclyreadable': 1, '_readableby': 1 } });
                    if (!entity) return response.status(404).json({error: 'Entity not found' });
                    if (entity._ownerid !== userid && !entity._publiclyreadable && (!entity._readableby || entity._readableby.indexOf(userid) < 0)) {
                        return response.status(403).json({ error: 'Reading not allowed' });
                    }
                    next();
                });
            });
        };
    }

    /**
     * Middleware zum Prüfen, ob ein Datenbankobjekt vom angemeldeten Benutzer schreibbar ist.
     * Im body muss _id enthalten sein, damit das geht.
     * Verwendung: arrangeInstance.app.post('/api/myapi', arrangeInstance.canwrite.bind(arrangeInstance)('mytable'), function(req, res) { ... });
     */
    canwrite(tablenameparam) {
        const self = this;
        return function(request, response, next) {
            const tablename = request.params[tablenameparam];
            if (!tablename) return response.status(400).json({error: 'Parameter ' + tablenameparam + ' is not given' });
            self.auth(request, response, function() {
                self.validatebodyid('_id')(request, response, async function() {
                    const id = request.body._id;
                    if (!id) return next(); // Bei fehlender _id kann immer geschrieben werden. Das ist dann halt ein Anlegen eines Datensatzes.
                    const userid = request.user._id.toString();
                    const entity = await self.database.get(tablename).findOne(id, { projection: { '_ownerid': 1, '_publiclywritable': 1, '_writableby': 1 } });
                    if (!entity) return response.status(404).json({error: 'Entity not found' });
                    if (entity._ownerid !== userid && !entity._publiclywritable && (!entity._writableby || entity._writableby.indexOf(userid) < 0)) {
                        return response.status(403).json({ error: 'Writing not allowed' });
                    }
                    next();
                });
            });
        };
    }

    /**
     * Liefert Zugriff auf eine bestimmte Datenbanktabelle
     */
    db(collectionName) {
        return this.database.get(collectionName);
    }

    /**
     * Löscht ein Objekt
     */
    delete(request, response) {
        const self = this;
        self.auth(request, response, function() {
            const tablename = request.params.table;
            if (tablename === 'users') return response.status(403).json({ error: 'Access to users table forbidden' });
            self.validateparamid('id')(request, response, async function() {
                const collection = self.db(tablename);
                const entity = await collection.findOne(request.params.id, { projection: { '_ownerid': 1 } });
                if (!entity) return response.status(404).json({error: 'Entity not found' });
                if (entity._ownerid !== request.user._id) return response.status(403).json({error: 'Only the owner can delete the entity' });
                await collection.remove(request.params.id);
                response.status(200).send();
            });
        });
    }

    /**
     * Liefert Details über ein Objekt
     */
    details(request, response) {
        const self = this;
        async function callback(publiconly) {
            const tablename = request.params.table;
            if (tablename === 'users') return response.status(403).json({ error: 'Access to users table forbidden' });
            const query = publiconly ? {
                $and: [
                    { _publiclyreadable: true },
                    { _id: request.params.id }
                ]
            } : request.params.id;
            var options = self.parsefieldfilter(request.body);
            const collection = self.db(tablename);
            try {
                const entity = await collection.findOne(query, options);
                if (!entity) return response.status(404).json({error: 'Entity not found' });
                response.status(200).json(entity);
            } catch(ex) {
                // Filter is errornous
                response.status(400).json({ error: 'Filter is invalid' });
            }
        };
        if (request.header('x-access-token')) { // Try authentication only when token was sent
            self.canread('table', 'id')(request, response, callback);
        } else {
            callback(true);
        }
    }

    /**
     * API zum Auflisten aller Objekte eines Typs
     */
    list(request, response) {
        const self = this;
        async function callback() {
            const tablename = request.params.table;
            if (tablename === 'users') return response.status(403).json({ error: 'Access to users table forbidden' });
            const collection = self.db(tablename);
            if (!request.body || (!request.body.query && !request.body.result)) return response.status(400).json({ error: 'No filters sent' });
            try {
                const orPart = [ { _publiclyreadable: true } ];
                const userid = request.user._id;
                if (userid) {
                    orPart.push({ _ownerid: userid });
                    orPart.push({ _readableby: userid });
                }
                const queryfilter = {
                    $and: [
                        { $or: orPart },
                        request.body.query ? request.body.query : { }
                    ]
                };
                var options = self.parsefieldfilter(request.body.result);
                const result = await collection.find(queryfilter, options);
                response.status(200).json(result);
            } catch(ex) {
                // Filter is errornous
                response.status(400).json({ error: 'Filter is invalid' });
            }
        }
        if (request.header('x-access-token')) { // Try authentication only when token was sent
            self.auth(request, response, callback);
        } else {
            request.user = {};
            callback();
        }
    }

    /**
     * API zum Auflisten aller Benutzer mit _id und _username.
     */
    listusers(request, response) {
        const self = this;
        self.auth(request, response, async function() {
            const users = await self.db('users').find({}, { projection: { '_id': 1, 'username': 1 } });
            response.json(users);
        });
    }

    /**
     * API für Benutzer-Login.
     * Erwartet als Post-Parameter "username" und "password".
     */
    async login(request, response) {
        if (!request.body.username) return response.status(400).json({ error: 'Username required' });
        if (!request.body.password) return response.status(400).json({ error: 'Password required' });
        const user = await this.db('users').findOne({ username: request.body.username }, { projection: { '_id': 1, 'username': 1, 'password': 1 } });
        if (user && bcryptjs.compareSync(request.body.password, user.password)) {
            delete user.password; // Das Passwort wird nicht zurück gegeben, nur _id und token.
            user.token = jsonwebtoken.sign({
                _id: user._id,
                time: Date.now()
            }, this.tokenSecret, {
                expiresIn: '24h'
            });
            response.json(user);
        } else {
            response.status(403).json({ error: 'Login failed' });
        }
    }

    /**
     * API für Benutzer-Registrierung.
     * Erwartet als Post-Parameter "username" und "password".
     */
    async register(request, response) {
        if (!request.body.username) return response.status(400).json({ error: 'Username required' });
        if (!request.body.password) return response.status(400).json({ error: 'Password required' });
        const collection = this.db('users');
        const existingUser = await collection.findOne({ username: request.body.username }, { projection: { '_id': 1 } });
        if (existingUser) return response.status(400).json({ error: 'Username already taken' });
        const createdUser = await collection.insert({ username: request.body.username, password: bcryptjs.hashSync(request.body.password) });
        delete createdUser.password;
        createdUser.token = jsonwebtoken.sign({
            _id: createdUser._id,
            time: Date.now()
        }, this.tokenSecret, {
            expiresIn: '24h'
        });
        response.json(createdUser);
    }

    /**
     * API zum Entfernen von Leseberechtigungen
     */
    removereadableby(request, response) {
        const self = this;
        self.auth(request, response, function() {
            const tablename = request.params.table;
            if (tablename === 'users') return response.status(403).json({ error: 'Access to users table forbidden' });
            self.validateparamid('id')(request, response, function() {
                const entityid = request.params.id;
                self.validatebodyid('userid')(request, response, async function() {
                    const userid = request.body.userid;
                    if (!userid) return response.status(400).json({error: 'Target userid is missing' });
                    const collection = self.db(tablename);
                    const entity = await collection.findOne(entityid);
                    if (!entity) return response.status(404).json({error: 'Entity not found' });
                    if (entity._ownerid !== request.user._id.toString()) {
                        return response.status(403).json({ error: 'Only the entity owner can do this' });
                    }
                    const entityToWrite = {
                        _readableby: entity._readableby ? entity._readableby : []
                    }
                    const index = entityToWrite._readableby.indexOf(userid);
                    if (index >= 0) entityToWrite._readableby.splice(index, 1);
                    await collection.update(entityid, { $set: entityToWrite });
                    response.status(200).send();
                });
            });
        });
    }

    /**
     * API zum Entfernen von Schreibberechtigungen
     */
    removewritableby(request, response) {
        const self = this;
        self.auth(request, response, function() {
            const tablename = request.params.table;
            if (tablename === 'users') return response.status(403).json({ error: 'Access to users table forbidden' });
            self.validateparamid('id')(request, response, function() {
                const entityid = request.params.id;
                self.validatebodyid('userid')(request, response, async function() {
                    const userid = request.body.userid;
                    if (!userid) return response.status(400).json({error: 'Target userid is missing' });
                    const collection = self.db(tablename);
                    const entity = await collection.findOne(entityid);
                    if (!entity) return response.status(404).json({error: 'Entity not found' });
                    if (entity._ownerid !== request.user._id.toString()) {
                        return response.status(403).json({ error: 'Only the entity owner can do this' });
                    }
                    const entityToWrite = {
                        _writableby: entity._writableby ? entity._writableby : []
                    }
                    const index = entityToWrite._writableby.indexOf(userid);
                    if (index >= 0) entityToWrite._writableby.splice(index, 1);
                    await collection.update(entityid, { $set: entityToWrite });
                    response.status(200).send();
                });
            });
        });

    }

    /**
     * API zum Speichern und Erzeugen von Objekten.
     * Erwartet als URL Parameter den Tabellennamen.
     */
    save(request, response) {
        const self = this;
        self.canwrite('table')(request, response, async function() {
            const tablename = request.params.table;
            if (tablename === 'users') return response.status(403).json({ error: 'Access to users table forbidden' });
            const collection = self.db(tablename);
            const data = request.body;
            const _id = data._id;
            const keysToDatabase = Object.keys(data).filter(function(element) {
                return ['_id', '_ownerid', '_publiclyreadable', '_publiclywritable', '_readableby', '_writableby'].indexOf(element) < 0;
            });
            const dataToDatabase = {};
            keysToDatabase.forEach(function(key) {
                dataToDatabase[key] = data[key];
            });
            if (!_id) { // Create
                dataToDatabase._ownerid = request.user._id.toString(); // Assign the object to the current user as owner
                const createdEntity = await collection.insert(dataToDatabase);
                response.json({ _id: createdEntity._id.toString() });
            } else { // Update
                await collection.update(_id, { $set: dataToDatabase });
                response.json({ _id: _id });
            }
        });
    }

    /**
     * API für Passwortänderung.
     * Erwartet als Post-Parameter "password" (neues Passwort).
     * Danach ist alter Token ungültig.
     * Der Benutzer muss vorher angemeldet sein.
     */
    setpassword(request, response) {
        const self = this;
        self.auth(request, response, async function() {
            if (!request.body.password) return response.status(400).json({ error: 'Password required' });
            const user = request.user;
            await self.db('users').update(user._id, { $set: { password: bcryptjs.hashSync(request.body.password) } });
            response.status(200).send();
        });
    }

    /**
     * API zum Fsetlegen von öffentlichen Lesebrechtigungen
     */
    setpubliclyreadable(request, response) {
        const self = this;
        self.auth(request, response, function() {
            const tablename = request.params.table;
            if (tablename === 'users') return response.status(403).json({ error: 'Access to users table forbidden' });
            self.validateparamid('id')(request, response, async function() {
                const entityid = request.params.id;
                const value = request.params.value;
                if (value !== 'false' && value !== 'true') return response.status(400).json({ error: 'Invalid value' });
                const collection = self.db(tablename);
                const entity = await collection.findOne(entityid);
                if (!entity) return response.status(404).json({error: 'Entity not found' });
                if (entity._ownerid !== request.user._id.toString()) {
                    return response.status(403).json({ error: 'Only the entity owner can do this' });
                }
                await collection.update(entityid, { $set: { _publiclyreadable: value === 'true' ? true : false } });
                response.status(200).send();
            });
        });
    }

    /**
     * API zum Fsetlegen von öffentlichen Schreibbrechtigungen
     */
    setpubliclywritable(request, response) {
        const self = this;
        self.auth(request, response, function() {
            const tablename = request.params.table;
            if (tablename === 'users') return response.status(403).json({ error: 'Access to users table forbidden' });
            self.validateparamid('id')(request, response, async function() {
                const entityid = request.params.id;
                const value = request.params.value;
                if (value !== 'false' && value !== 'true') return response.status(400).json({ error: 'Invalid value' });
                    const collection = self.db(tablename);
                const entity = await collection.findOne(entityid);
                if (!entity) return response.status(404).json({error: 'Entity not found' });
                if (entity._ownerid !== request.user._id.toString()) {
                    return response.status(403).json({ error: 'Only the entity owner can do this' });
                }
                await collection.update(entityid, { $set: { _publiclywritable: value === 'true' ? true : false } });
                response.status(200).send();
            });
        });
    }

    /**
     * Server starten
     */
    start() {
        const port = this.port;
        // Server erstellen
        this.server = http.createServer(this.app);
        this.server.listen(port, function () {
            console.log('Arrange server running at port ' + port);
        });
    }

    /**
     * Übergibt den Beistz eines Objektes an einen anderen Benutzer. Der ursprüngliche Besitzer
     * hat danach immernoch Lese- und Schreibrechte.
     */
    transferownership(request, response) {
        const self = this;
        self.auth(request, response, function() {
            self.validateparamid('entityid')(request, response, function() {
                self.validateparamid('userid')(request, response, async function() {
                    const tablename = request.params.table;
                    if (tablename === 'users') return response.status(400).send();
                    const userid = request.user._id.toString();
                    const targetuserid = request.params.userid;
                    const targetuser = await self.db('users').findOne(targetuserid, { projection: { '_id': 1 } });
                    if (!targetuser) return response.status(404).json({ error: 'User not found' });
                    const entityid = request.params.entityid;
                    const entity = await self.db(tablename).findOne(entityid, { projection: { '_id': 1, '_readableby': 1, '_writableby': 1 } });
                    if (!entity) return response.status(404).json({ error: 'Entity not found' });
                    if (entity._ownerid.toString() !== userid) return response.status(403).send();
                    delete entity._id;
                    entity._ownerid = targetuserid;
                    if (!entity._readableby) entity._readableby = [];
                    entity._readableby.push(userid);
                    if (!entity._writableby) entity._writableby = [];
                    entity._writableby.push(userid);
                    await self.db(tablename).update(entityid, { $set: entity });
                    response.status(200).send();
                });
            });
        });
    }

    /**
     * Middleware zum Prüfen, ob das _id Attribut im Body eine valide
     * MongoDB-ID darstellt (24 Zeichen lang). Wenn keine _id enthalten ist,
     * wird es als valide anerkannt. Verwendung:
     * arrangeInstance.app.post('/api/myapi/', arrangeInstance.validatebodyid('_id'), function(req, res) { ... });
     */
    validatebodyid(attributename) {
        return function(request, response, next) {
            const id = request.body[attributename];
            if (id && id.length !== 24) return response.status(400).json({error: attributename + ' is no valid id' });
            next();
        }
    }

    /**
     * Middleware zum Prüfen, ob ein bestimmter request-Parameter eine korrekte
     * MongoDB-ID darstellt (24 Zeichen lang). Verwendung:
     * arrangeInstance.app.post('/api/myapi/:param1', arrangeInstance.validateparamid('param1'), function(req, res) { ... });
     */
    validateparamid(parametername) {
        return function(request, response, next) {
            const param = request.params[parametername];
            if (!param) return response.status(400).json({error: 'Parameter ' + parametername + ' is not given' });
            if (param.length !== 24) return response.status(400).json({error: 'Parameter ' + parametername + ' is no valid id' });
            next();
        }
    }

    /**
     * Analysiert das gegebene Objekt, ob es entweder ein Array von Feldnamen oder ein Objekt mit
     * Felddefinitionen ist, die an MongoDB als Filter gegeben werden können.
     * Gibt ein options-Objekt für die MongoDB-Abfragen zurück.
     */
    parsefieldfilter(obj) {
        if (!obj) return undefined; // No filter at all
        var options = { projection: {} };
        if (Array.isArray(obj)) {
            obj.forEach(function(fieldname) {
                options.projection[fieldname] = 1;
            });
        } else {
            Object.keys(obj).forEach(function(fieldname) {
                options.projection[fieldname] = obj[fieldname];
            });
        }
        return options;
    }

}

module.exports = {
    Server: Server
}
