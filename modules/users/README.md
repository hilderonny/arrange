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

## Objekt `request.user`

Wenn die Middleware `identifyuser` den Benutzer erfolgreich identifiziert und authentifiziert hat, legt diese am `request` der Expressinstanz eine Property `user` an.
Ohne Anmeldung existiert diese Eigenschaft nicht.

```js
request.user = { // Optional vorhanden. Wenn vorhanden, ist Benutzer angemeldet
    id, // Id des Benutzers
    canRead(permission_name),  // Optional vorhandene Funktion. 
                               // Prüft, ob angemeldeter Benutzer bestimmte Leseberechtigung hat
    canWrite(permission_name), // Optional vorhandene Funktion. 
                               //Prüft, ob angemeldeter Benutzer bestimmte Schreibberechtigung hat
}
```

## Prüfung der Anmeldung

Wenn Module das `user` Objekt benutzen wollen, müssen sie gewährleisten, dass der Benutzer angemeldet ist.
Das können sie tun, indem sie in den jeweiligen APIs auf das Vorhandensein des Objektes testen und beim Fehlen den Status Code `401 Unauthorized` zurück senden.
Das Client-Skript muss sich dann darum kümmern, den Benutzer auf die `/login` Seite umzuleiten.

**Beispiel API**

```js
arrange.app.get('/api/example', (request, response) => {
    if (!request.user) {
        response.sendStatus(401)
        return
    }
    // Oder kürzer
    if (!request.user) return response.sendStatus(401)
})
```

**Beispiel Client Script**

```js
const response = await fetch('/api/example')
if (response.status === 401) {

    // Umleitung zur Login-Seite
    location.replace('/login')

    // Oder Anzeige der Login-Webkomponente
    const loginModule = await import('/users/webcomponents/login.mjs')
    loginModule.showLoginForm()
    
}