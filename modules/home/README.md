# Modul Home

Dieses Modul stellt die Startseite `/` sowie die Navigation bereit.
Zusätzlich werden Buttons zum Anmelden und Registrieren von Benutzern über das `users` Modul angezeigt.

Außerdem gibt dieses Modulden prinzipiellen Aufbau der UI vor.
Es werden Funktionen und Templates für UI-Karten bereitgestellt.
Diese wiederum erfordern Metainformationen über die Datenbankstrukturen.
Diese Metastrukturen werden hier definiert und müssen von den Modulen, die die Funktionen
verwenden wollen, gefüllt werden.

Das Modul verwendet `arrange.apps[]`, um anzuzeigende Anwendungen zu ermitteln.
Diese Liste muss von anderen Modulen gefüllt werden.

Das Modul benutzt außerdem `arrange.metadata`, welches die Aufbauten der Datenbanktabellen beschreibt, damit die UI Automatismen Listen und Detailkarten generieren kann.

## Struktur von `arrange.apps[]`

```js
app = {
    navigationIcon // URL zu kleinem Icon für die Navigation
    homeIcon // URL zu großen Icon für Home Screen
    name // Name der Anwendung, wird in Navigation und auf Home-Screen angezeigt
    permission // Optional. Id der Berechtigung, die notwendig ist, um die App zu verwenden
}
```

## Struktur von `arrange.metadata`

```js
arrange.metadata = {
    'users/users': { // Name der Tabelle, die beschrieben wird
        'id': { // Name des beschriebenen Feldes
            type: 'text', // Feldtyp. Bestimmt Rendering an Oberfläche
            label: 'Id' // Bezeichnung, die als Label an UI angezeigt wird
        },
        'name': {
            type: 'text',
            label: 'Benutzername',
            istitle: true // Wenn true, dann wird dieses Feld für Listen und Überschriften verwendet
        },
        'usergroupids': {
            type: 'reference', // Verweis auf eine andere Tabelle, bzw. auf die Id's darin
            label: 'Benutzergruppen',
            table: 'users/usergroups' // Verwiesene Tabelle
        }
    }
}
```

## API GET `/api/home/applist`

Liefert Liste aller in `arrange.apps` registrierten Apps zurück.
Wird für den Aufbau der Navigation und des Home-Screens verwendet.

```js
response = [
    {
        name: 'users-users', // Eindeutiger identifizierer für HTML IDs. Sollte aus Modulnamen und Appnamen bestehen
        name: 'Benutzer',
        icon: '/modules/users/images/users.png',
        url: '/modules/users/index.html,
        default: true // Wenn Home-Modul diese Anwendung standardmäßig anzeigen soll
   }
]
```

## API GET `/api/home/metadata/:table_name`

Liefert Metainformationen für eine Datenbanktabelle zurück.
Wird für den automatisierten Aufbau von UI-Elementen verwendet.

```js
const tableName = 'users/users'
const response = await fetch('/api/home/metadata/' + tableName)
// Tabelle mit angegebenem Namen nicht gefunden
response.status === 404
// Ein erfolgreicher Aufruf liefert ein JSON-Objekt zurück.
response.json() = {
    'id': { // Name des beschriebenen Feldes
        type: 'text', // Feldtyp. Bestimmt Rendering an Oberfläche
        label: 'Id' // Bezeichnung, die als Label an UI angezeigt wird
    },
    'name': {
        type: 'text',
        label: 'Benutzername',
        istitle: true // Wenn true, dann wird dieses Feld für Listen und Überschriften verwendet
    },
    'usergroupids': {
        type: 'reference', // Verweis auf eine andere Tabelle, bzw. auf die Id's darin
        label: 'Benutzergruppen',
        table: 'users/usergroups' // Verwiesene Tabelle
    }
}
```

## Navigationsselektion erzwingen

Das geht über eine Nachricht, die die Anweisung zum Selektieren und die App-ID enthält.

```js
// Modul "home", App "home" selektieren
parent.postMessage({ action: 'selectApp', appid: 'home-home' })
```