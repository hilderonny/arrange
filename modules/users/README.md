# Modul Benutzer

Dieses Modul stellt Datenbankstrukturen, UI, Middlewares und APIs für die Benutzerverwaltung und Authentifizierung bereit.

## Voraussetzungen

Damit das Modul korrekt funktioniert, muss folgende arrange-Variable definiert sein.

|Schlüssel|Beschreibung|
|---|---|
|`tokenSecret`|Zeichenkette, die den Secret Key für die JSON WebToken Verschlüsselung beinhaltet|

## Middlewares

|Middleware|Beschreibung|
|---|---|
|`identifyuser`|Globale Middleware, die aus dem Request einen JSON Webtoken extrahiert (falls vorhanden) und das `request.user` Objekt erzeugt, welches Informationen und Hilfsfunktionen für den angemeldeten Benutzer enthält|

## Berechtigungen

Alle vordefinierten Berechtigungen sollten IDs in der Form `<MODULNAME>_<PERMISSIONNAME>` erhalten.

|Berechtigung|Beschreibung|
|---|---|
|`USERS_ADMINISTRATION_USER`|Verwaltung von Benutzern, Benutzergruppen und Berechtigungen|


## API DELETE `/api/users/deleteuser`

Löscht einen Benutzer.
Erfordert Berechtigung `USERS_ADMINISTRATION_USER`.
Der zu löschende Benutzer muss als JSON-Objekt im Body übergeben werden und muss ein Feld `id` enthalten.

```js
const userToDelete = { id: 'user0815' }
const response = await fetch('/api/users/deleteuser', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userToDelete)
})
// Berechtigung des angemeldeten Benutzers zur Verwendung der API fehlt
response.status === 403
// Benutzer erfolgreich gelöscht oder gar nicht vorhanden
response.status === 200
```


## API DELETE `/api/users/deleteusergroup`

Löscht eine Benutzergruppe.
Erfordert Berechtigung `USERS_ADMINISTRATION_USER`.
Die zu löschende Benutzergruppe muss als JSON-Objekt im Body übergeben werden und muss ein Feld `id` enthalten.

```js
const usergroupToDelete = { id: 'usergroup4711' }
const response = await fetch('/api/users/deleteusergroup', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(usergroupToDelete)
})
// Berechtigung des angemeldeten Benutzers zur Verwendung der API fehlt
response.status === 403
// Benutzergruppe erfolgreich gelöscht oder gar nicht vorhanden
response.status === 200
```


## API GET `/api/users/listpermissions`

Listet alle Berechtigungen mit Id und Bezeichnung auf.
Erfordert Berechtigung `USERS_ADMINISTRATION_USER`.

```js
const response = await fetch('/api/users/listpermissions')
// Berechtigung fehlt
response.status === 403
// Ein erfolgreicher Aufruf liefert ein JSON-Array zurück.
response.json() = [
    { id: 'permissionId', name: 'Berechtigungsbezeichnung' }
]
```


## API GET `/api/users/listusergroups`

Listet alle Benutzergruppen mit Id, Namen und zugehörigen Berechtigungs-IDs auf.
Erfordert Berechtigung `USERS_ADMINISTRATION_USER`.

```js
const response = await fetch('/api/users/listusergroups')
// Berechtigung fehlt
response.status === 403
// Ein erfolgreicher Aufruf liefert ein JSON-Array zurück.
response.json() = [
    { id: 'usergroupid', name: 'Administratoren', permissionids: [ 'USERS_ADMINISTRATION_USER' ] }
]
```


## API GET `/api/users/listusers`

Listet alle Benutzer mit Id, Namen und Benutzergruppen-IDs auf.
Erfordert Berechtigung `USERS_ADMINISTRATION_USER`.
Jeder Benutzer hat außerdem ein Icon.

```js
const response = await fetch('/api/users/listusers')
// Berechtigung fehlt
response.status === 403
// Ein erfolgreicher Aufruf liefert ein JSON-Array zurück.
// Es wird immer ein gefülltes Feld zurück gegeben (zumindest der abfragende Benutzer muss ja existieren)
response.json() = [
    { id: 'userId', name: 'Benutzername', icon: './images/user.png', usergroupids: [ 'USERGROUP_ADMIN' ] }
]
```


## API POST `/api/users/login`

Meldet einen Benutzer an.

```js
const response = await fetch('/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username, password: password })
})
// Benutzer existiert nicht oder falsches Passwort
response.status === 403
// Anmeldung war erfolgreich, es wird ein Cookie 'users-token' mit dem JSON Web Token als Wert gesetzt
response.status === 200
```


## API GET `/api/users/logout`

Meldet einen Benutzer ab.

```js
const response = await fetch('/api/users/logout')
// Das Cookie 'users-token' wird gelöscht
```


## API POST `/api/users/register`

Registriert einen neuen Benutzer.
Der erste registrierte Benutzer wird automatisch der `Administratoren`-Benutzergruppe zugeordnet.

```js
const response = await fetch('/api/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username, password: password })
})
// Benutzer mit demselben Namen existiert bereits
response.status === 409
// Registrierung war erfolgreich, es wird ein Cookie 'users-token' mit dem JSON Web Token als Wert gesetzt
response.status === 200
```


## API POST `/api/users/savepermission`

Speichert eine Berechtigung.
Erfordert Berechtigung `USERS_ADMINISTRATION_USER`.
Die übergebene Berechtigung muss eine Id haben, es können keine neuen Berechtigungen angelegt werden.
Der Response enthält die gespeicherte Berechtigung.

```js
const permissionToSave = {
    id: 'USERS_ADMINISTRATION_USER', 
    name: 'Administration'
}
const response = await fetch('/api/users/savepermission', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(permissionToSave)
})
// Berechtigung des angemeldeten Benutzers zur Verwendung der API fehlt
response.status === 403
// Berechtigung nicht vorhanden
response.status === 404
// Berechtigung erfolgreich gespeichert
response.status === 200
response.json() = {
    id: 'USERS_ADMINISTRATION_USER',
    name: 'Administration',
    icon: './images/unlock.png' // Dynamisch vergebenes Icon für Listen
}
```


## API POST `/api/users/saveuser`

Speichert einen Benutzer.
Erfordert Berechtigung `USERS_ADMINISTRATION_USER`.
Wenn im übergebenen Benutzer ein Passwort enthalten ist, wird das Passwort überschrieben.
Ansonsten bleibt das Passwort des Benutzers unverändert.
Wenn der übergebene Benutzer kein `id` Feld hat, wird er als neuer Benutzer interpretiert, eine Id generiert und gespeichert.
Der Response enthält den gespeicherten Benutzer mit `id` aber ohne `password`.

```js
const userToSave = {
    id: 'userId', 
    name: 'Benutzername',
    password: 'newpassword',
    usergroupids: [ 'USERGROUP_ADMIN' ]
}
const response = await fetch('/api/users/saveuser', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userToSave)
})
// Berechtigung des angemeldeten Benutzers zur Verwendung der API fehlt
response.status === 403
// Benutzer erfolgreich gespeichert bzw. angelegt
response.status === 200
response.json() = {
    id: 'userid', // Generierte Id, wenn vormals weggelassen
    name: 'Benutzername',
    icon: './images/icon.png', // Dynamisch vergebenes Icon für Listen
    usergroupids: [ 'USERGROUP_ADMIN' ]
}
```


## API POST `/api/users/saveusergroup`

Speichert eine Benutzergruppe.
Erfordert Berechtigung `USERS_ADMINISTRATION_USER`.
Wenn die übergebene Benutzergruppe kein `id` Feld hat, wird sie als neue Benutzergruppe interpretiert, eine Id generiert und gespeichert.
Der Response enthält die gespeicherte Benutzergruppe mit `id`.

```js
const usergroupToSave = {
    id: 'usergroupId', 
    name: 'Gruppenname',
    permissionids: [ 'USERS_ADMINISTRATION_USER' ]
}
const response = await fetch('/api/users/saveusergroup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(usergroupToSave)
})
// Berechtigung des angemeldeten Benutzers zur Verwendung der API fehlt
response.status === 403
// Benutzergruppe erfolgreich gespeichert bzw. angelegt
response.status === 200
response.json() = {
    id: 'userid', // Generierte Id, wenn vormals weggelassen
    name: 'Gruppenname',
    icon: './images/group.png', // Dynamisch vergebenes Icon für Listen
    permissionids: [ 'USERS_ADMINISTRATION_USER' ]
}
```




## Datenbanktabelle `users/users`

Speichert alle Benutzer, die Zugriff auf das System haben.

|Feldname|Datentyp|Label|Beschreibung|Titelfeld|
|---|---|---|---|---|
|`id`|text|Id|UUID des Benutzers. Wird beim Erstellen generiert, wenn nicht angegeben.||
|`name`|text|Benutzername|Eindeutiger Name des Benutzers. Kommt nicht mehrmals vor.|Ja|
|`password`|text|Passwort|Mit `crypto` verschlüsseltes Passwort||
|`usergroupids`|reference|Benutzergruppen|Liste von Benutzergruppen-IDs, denen der Benutzer angehört||

```js
arrange.database['users/users'] = {
    'user_id' : {
        name: 'ronny',
        password: 'jiovrlwuqhvnr4728oz7rtn',
        usergroupids: [ 'usergroupid_1', 'usergroupid_2' ]
    }
}
```


## Datenbanktabelle `users/usergroups`

Speichert Benutzergruppen.
Benutzer können Benutzergruppen angehören.
Benutzergruppen wiederum können Berechtigungen zugewiesen werden.

|Feldname|Datentyp|Label|Beschreibung|Titelfeld|
|---|---|---|---|---|
|`id`|text|Id|UUID der Benutzergruppe. Wird beim Erstellen generiert, wenn nicht angegeben.||
|`name`|text|Name|Name der Benutzergruppe.|Ja|
|`permissionids`|reference|Berechtigungen|Liste von Berechtigungs-IDs, über die die Benutzergruppe verfügt||

```js
arrange.database['users/usergroups'] = {
    'usergroup_id' : { 
        name: 'Administratoren',
        permissionids: [ 'permission_1', 'permission_2' ]
    }
}
```


## Datenbanktabelle `users/permissions`

Speichert Berechtigungen.

|Feldname|Datentyp|Label|Beschreibung|Titelfeld|
|---|---|---|---|---|
|`id`|text|Id|UUID der Berechtigung. Wird beim Erstellen generiert, wenn nicht angegeben.||
|`name`|text|Name|Name der Berechtigung.|Ja|

```js
arrange.database['users/permissions'] = {
    'permission_id' : { 
        name: 'Benutzerverwaltung',
    }
}
```


## Objekt `request.user`

Wenn die Middleware `identifyuser` den Benutzer erfolgreich identifiziert und authentifiziert hat, legt diese am `request` der Expressinstanz eine Property `user` an.
Ohne Anmeldung existiert diese Eigenschaft nicht.

```js
request.user = { // Optional vorhanden. Wenn vorhanden, ist Benutzer angemeldet
    id, // Id des Benutzers
    hasPermission(permission_name),  // Optional vorhandene Funktion. 
                                     // Prüft, ob angemeldeter Benutzer bestimmte Berechtigung hat
}
```

## Prüfung der Anmeldung

Wenn Module das `user` Objekt benutzen wollen, müssen sie gewährleisten, dass der Benutzer angemeldet ist.
Das können sie tun, indem sie in den jeweiligen APIs auf das Vorhandensein des Objektes testen und beim Fehlen den Status Code `401 Unauthorized` zurück senden.
Das Client-Skript muss sich dann darum kümmern, den Benutzer auf die `/login` Seite umzuleiten.

**Beispiel API**

```js
arrange.webServer.get('/api/example', (request, response) => {
    if (!request.user) {
        response.sendStatus(401)
        return
    }
    // Oder kürzer
    if (!request.user) return response.sendStatus(401)
    // Berechtigung prüfen
    if (!request.user.hasPermission('USERS_ADMINISTRATION_USER')) {
        return response.sendStatus(401)
    }
})
```

**Beispiel Client Script**

```js
const response = await fetch('/api/example')
if (response.status === 401) {

    // Umleitung zur Login-Seite
    location.replace('/login')

    // Oder Anzeige der Login-Webkomponente
    const loginModule = await import('/modules/users/components/login.mjs')
    loginModule.showLoginForm()
    
}