# Modul Benutzer

Dieses Modul stellt Datenbankstrukturen, UI, Middlewares und APIs für die Benutzerverwaltung und Authentifizierung bereit.

## Voraussetzungen

Damit das Modul korrekt funktioniert, muss in der Datei `/localconfig.json` folgender Schlüssel vorhanden sein.

|Schlüssel|Beschreibung|
|---|---|
|`tokensecret`|Zeichenkette, die den Secret Key für die JSON WebToken Verschlüsselung beinhaltet|

## Middlewares

|Middleware|Beschreibung|
|---|---|
|`identifyuser`|Globale Middleware, die aus dem Request einen JSON Webtoken extrahiert (falls vorhanden) und das `request.user` Objekt erzeugt, welches Informationen und Hilfsfunktionen für den angemeldeten Benutzer enthält|

## Berechtigungen

|Berechtigung|Beschreibung|
|---|---|
|`PERMISSION_ADMINISTRATION_USER`|Verwaltung von Benutzern, Benutzergruppen und Berechtigungen|


## API POST `/api/users/deletepermission/:permission_id`

Löscht eine Berechtigung
Erfordert Berechtigung `PERMISSION_ADMINISTRATION_USER`.

```js
const permissionId = 'user0815'
const response = await fetch('/api/users/deletepermission/' + permissionId)
const response = await fetch('/api/users/deletepermission/permissionId', { method: 'DELETE' })
// Berechtigung des angemeldeten Benutzers zur Einsicht fehlt
response.status === 403
// Berechtigung erfolgreich gelöscht oder gar nicht vorhanden
response.status === 200
```


## API GET `/api/users/listusergroups`

Listet alle Benutzergruppen mit Id und Namen auf.
Erfordert Berechtigung `PERMISSION_ADMINISTRATION_USER`.

```js
const response = await fetch('/api/users/listusergroups')
// Berechtigung fehlt
response.status === 403
// Ein erfolgreicher Aufruf liefert ein JSON-Objekt zurück.
// Es wird immer ein Feld zurück gegeben.
response.json() = [
    { id: 'usergroupid', name: 'Administratoren' }
]
```


## API GET `/api/users/listpermissions`

Listet alle Berechtigungen mit Id und Bezeichnung auf.
Erfordert Berechtigung `PERMISSION_ADMINISTRATION_USER`.

```js
const response = await fetch('/api/users/listpermissions')
// Berechtigung fehlt
response.status === 403
// Ein erfolgreicher Aufruf liefert ein JSON-Objekt zurück.
// Es wird immer ein Feld zurück gegeben.
response.json() = [
    { id: 'permissionId', name: 'Berechtigungsbezeichnung' }
]
```


## API GET `/api/users/listusers`

Listet alle Benutzer mit Id und Namen auf.
Erfordert Berechtigung `PERMISSION_ADMINISTRATION_USER`.

```js
const response = await fetch('/api/users/listusers')
// Berechtigung fehlt
response.status === 403
// Ein erfolgreicher Aufruf liefert ein JSON-Objekt zurück.
// Es wird immer ein Feld zurück gegeben (zumindest der abfragende Benutzer muss ja existieren)
response.json() = [
    { id: 'userId', name: 'Benutzername' }
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


## API GET `/api/users/permissiondetails/:permission_id`

Liefert Detailinformationen über eine bestimmte Berechtigung.
Erfordert Berechtigung `PERMISSION_ADMINISTRATION_USER`.

```js
const permissionId = 'user0815'
const response = await fetch('/api/users/permissiondetails/' + permissionId)
// Berechtigung des angemeldeten Benutzers zur Einsicht fehlt
response.status === 403
// Berechtigung mit gegebener Id nicht gefunden
response.status === 404
// Ein erfolgreicher Aufruf liefert ein JSON-Objekt mit Berechtigungsinfos zurück.
response.json() = {
    id: 'permissionId',
    name: 'Bezeichnung'
}
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

Speichert eine Berechtigung oder legt diese an.
Erfordert Berechtigung `PERMISSION_ADMINISTRATION_USER`.

```js
const response = await fetch('/api/users/savepermission', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        id: 'permissionId', // Optional. Wenn nicht angegeben, wird eine ID generiert
        name: 'Bezeichnung'
    })
})
// Berechtigung des angemeldeten Benutzers zur Einsicht fehlt
response.status === 403
// Ein erfolgreicher Aufruf liefert ein JSON-Objekt mit Berechtigungsinfos zurück.
response.json() = {
    id: 'permissionId', // Generierte Id, wenn vormals weggelassen
    name: 'Bezeichnung'
}
```


## API GET `/api/users/userdetails/:user_id`

Liefert Detailinformationen über einen bestimmten Benutzer sowie die Id's der Benutzergruppen, denen er angehört.
Erfordert Berechtigung `PERMISSION_ADMINISTRATION_USER`.

```js
const userId = 'user0815'
const response = await fetch('/api/users/userdetails/' + userId)
// Berechtigung fehlt
response.status === 403
// Benutzer mit gegebener Id nicht gefunden
response.status === 404
// Ein erfolgreicher Aufruf liefert ein JSON-Objekt mit Benutzerinfos zurück.
response.json() = {
    id: 'userId',
    name: 'Benutzername',
    usergroupids: [ 'usergroupid_1', 'usergroupid_2' ]
}
```


## API GET `/api/users/usergroupdetails/:usergroup_id`

Liefert Detailinformationen über eine bestimmte Benutzergruppe samt zugewiesener Berechtigungs-Ids.
Erfordert Berechtigung `PERMISSION_ADMINISTRATION_USER`.

```js
const usergroupId = 'user0815'
const response = await fetch('/api/users/usergroupdetails/' + usergroupId)
// Berechtigung des angemeldeten Benutzers zur Einsicht fehlt
response.status === 403
// Benutzergruppe mit gegebener Id nicht gefunden
response.status === 404
// Ein erfolgreicher Aufruf liefert ein JSON-Objekt mit Benutzergruppeninfos zurück.
response.json() = {
    id: 'usergroupId',
    name: 'Gruppenname',
    permissionids: [ 'permissionid_1', 'permissionid_2' ]
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
        id: 'random_UUID',
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
        id: 'random_UUID',
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
        id: 'random_UUID',
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
    if (!request.user.hasPermission('PERMISSION_ADMINISTRATION_USER')) {
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