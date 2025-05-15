# Modul Home

Dieses Modul stellt die Startseite `/` sowie die Navigation bereit.
Zusätzlich werden Buttons zum Anmelden und Registrieren von Benutzern über das `users` Modul angezeigt.

Außerdem gibt dieses Modulden prinzipiellen Aufbau der UI vor.
Es werden Funktionen und Templates für UI-Karten bereitgestellt.
Diese wiederum erfordern Metainformationen über die Datenbankstrukturen.
Diese Metastrukturen werden hier definiert und müssen von den Modulen, die die Funktionen
verwenden wollen, gefüllt werden.

Das Modul verwendet die Datenbanktabelle `home/apps`, um anzuzeigende Anwendungen zu ermitteln.
Diese Tabelle muss von anderen Modulen gefüllt werden.

## Berechtigungen


|Berechtigung|Beschreibung|
|---|---|
|`HOME_APPMANAGEMENT`|Verwaltung von Apps.|

## Datenbanktabelle `home/apps`

Speichert alle Apps.

|Feldname|Datentyp|Label|Beschreibung|Titelfeld|
|---|---|---|---|---|
|`id`|text|Id|Id der App. Bei vorgegebenen Apps sollte diese ID aus dem Modulnamen und dem Appnamen bestehen.||
|`name`|text|Name|Name der App, wie sie in UI angezeigt wird|Ja|
|`icon`|text|Icon|URL des Icons für die App. Kann relativ oder absolut sein.||
|`url`|text|URL|URL der App. Wird in IFRAME geladen. Kann extern sein.||
|`index`|int|Index|Reihenfolge-Index für Auflistungen. Module sollten ihre Indizes zusammenhalten. Index >= 10.000 sind Admin-Apps, Index >= 100.000 sind Profil und System-Apps.||
|`isdefault`|boolean|Ist Standard-App|Wenn `true`, wird diese App beim Öffnen von arrange angezeigt.||
|`permissionid`|text|Berechtigung|Optional. Wenn angegeben, braucht der Benutzer genau diese Berechtigung, um die App in der Liste anzuzeigen.||

```js
arrange.database['home/apps'] = {
    'HOME_HOME' : {
        name: 'Home',
        icon: '/images/house.png',
        url: '/home.html',
        index: 100,
        isdefault: true,
        permissionid: 'HOME_HOME'
    }
}
```

## API GET `/api/home/applistforuser`

Liefert Liste aller registrierten Apps zurück, auf die der Benutzer Zugriff hat.
Wird für den Aufbau der Navigation und des Home-Screens verwendet.

```js
response = [
    {
        id: 'HOME_HOME', // Eindeutiger identifizierer für HTML IDs. Sollte aus Modulnamen und Appnamen bestehen
        name: 'Benutzerverwaltung',
        icon: '/modules/users/images/group.png',
        url: '/modules/users/uermanagement.html',
        index: 100, // Reihenfolge in App-Listen
        isdefault: false, // Wenn Home-Modul diese Anwendung standardmäßig anzeigen soll
        permissionid: 'USERS_ADMINISTRATION_USER'
   }
]
```

## API DELETE `/api/home/deleteapp`

Löscht eine App.
Erfordert Berechtigung `HOME_APPMANAGEMENT`.
Die zu löschende App muss als JSON-Objekt im Body übergeben werden und muss ein Feld `id` enthalten.

```js
const appToDelete = { id: 'HOME_HOME' }
const response = await fetch('/api/home/deleteapp', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appToDelete)
})
// Berechtigung des angemeldeten Benutzers zur Verwendung der API fehlt
response.status === 403
// App erfolgreich gelöscht oder gar nicht vorhanden
response.status === 200
```

## API GET `/api/home/listapps`

Listet alle Apps für die App-Verwaltung auf.
Erfordert Berechtigung `HOME_APPMANAGEMENT`.

```js
const response = await fetch('/api/home/listapps')
// Berechtigung fehlt
response.status === 403
// Ein erfolgreicher Aufruf liefert ein JSON-Array zurück.
response.json() = [
    { id: 'HOME_HOME', name: 'Benutzerverwaltung', icon: '/modules/users/images/group.png', url: '/modules/users/uermanagement.html', index: 100, isdefault: true, permissionid: 'USERS_ADMINISTRATION_USER' }
]
```

## API POST `/api/home/saveapp`

Speichert eine app.
Erfordert Berechtigung `HOME_APPMANAGEMENT`.
Wenn die übergebene App kein `id` Feld hat, wird sie als neue App interpretiert, eine Id generiert und gespeichert.
Der Response enthält die gespeicherte App mit `id`.

```js
const appToSave = {
    id: 'appId', 
    name: 'Benutzerverwaltung', 
    icon: '/modules/users/images/group.png', 
    url: '/modules/users/uermanagement.html',
    index: 100,
    isdefault: false,
    permissionid: 'USERS_ADMINISTRATION_USER'
}
const response = await fetch('/api/home/saveapp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appToSave)
})
// Berechtigung des angemeldeten Benutzers zur Verwendung der API fehlt
response.status === 403
// App erfolgreich gespeichert bzw. angelegt
response.status === 200
response.json() = {
    id: 'appId', 
    name: 'Benutzerverwaltung', 
    icon: '/modules/users/images/group.png', 
    url: '/modules/users/uermanagement.html', 
    index: 100,
    isdefault: false,
    permissionid: 'USERS_ADMINISTRATION_USER'
}
```

## Navigationsselektion erzwingen

Das geht über eine Nachricht, die die Anweisung zum Selektieren und die App-ID enthält.

```js
// Modul "home", App "home" selektieren
parent.postMessage({ action: 'selectApp', appid: 'home-home' })
```

## Stylesheets

Die hier aufgeführten Funktionen verlassen sich auf das Vorhandensein der Stylesheets, die das Home-Modul mitbringt.

```html
<!DOCTYPE html>
<html>
    <head>
        <link rel="stylesheet" href="/styles/base.css">
    </head>
</html>
```

Die CSS-Klassen am `body`-Element an jeder Seite bestimmen, wie deren Inhalt gerendert wird.

|CSS-Klasse|Beschreibung|
|---|---|
|`cards`|Wird von Modulen benutzt, die auf den horizontalen Karten (Listen- und Detailansichten) basieren|
|`form`|Formulare, wie Anmelde- und Registrierseiten|
|`icongrid`|Das Home-Modul benutzt diese Klasse, um Icons und Labels in Form eines Home-Screens in einem Gitter darzustellen|
|`root`|Wird für die alles umgebende Root-Seite verwendet, die die Navigation und die Modul-IFrames enthält|

## Listen- und Detailansichten für Datenbankobjekt

```js
// Funktionen importieren
import { createListAndDetailsCards } from '/js/cardhelper.mjs'
// Metainformationen für Liste und Detailansicht
const metadata = {
    listTitle: 'Benutzergruppen', // Titel für Listenkarte
    identifierPropertyName: 'id', // Feld mit Identifizierer, der für Vorselektionen genutzt wird. Üblicherweise `id`.
    titlePropertyName: 'name', // Feld, welches in der Liste und im Kopf der Detailansicht angezeigt wird
    iconPropertyName: 'icon', // Feld mit Icon, individuall für jeden Eintrag
    icon: './images/user.png', // Icon-URL für Listen, die gleichartige Elemente enthalöten und dieselben Icons anzeigen sollen
    listApi: '/api/users/listusergroups', // API für Auflistung der Objekte
    saveApi: '/api/users/saveusergroup', // Optional. API zum Speichern und Neuanlegen eines Datensatzes
    deleteApi: '/api/users/deleteusergroup', // Optional. API zum Löschen eines Datensatzes
    canCreate: true, // Gibt an, ob der Neu-Button angezeigt wird. Erfordert saveApi. Ist z.B. bei der Berechtigungsverwaltung auf false gesetzt, damit keine neuen Berechtigungen erstellt werden.
    fields: [ // Wird in Detailansicht benötigt
        { // Reihenfolge im Array bestimmt Anzeigereihenfolge
            property: 'id',
            label: 'Id',
            type: 'text', 
            readonly: true
        },
        {
            property: 'name',
            label: 'Gruppenname',
            type: 'text'
        },
        {
            property: 'permissionids',
            label: 'Berechtigungen', // Überschrift über allen Select-Feldern
            type: 'multiselect', // Dynamisches Erweitern und Löschen der Select-Felder
            options: [
                {
                    value: 'USERS_ADMINISTRATION_USER',
                    label: 'Benutzerverwaltung',
                }
            ]
        }
    ]
}
// Es wird die Listenkarte zurück gegeben.
// Wenn `saveApi` in den Metadaten angegeben ist, werden die Neu- und Speichern-Buttons angezeigt.
// Der Löschen-Button wird nur dann angezeigt, wenn `deleteApi` in den Metadaten angegeben ist.
const listCard = await createListAndDetailsCards(metadata)
document.body.appendChild(listCard)
```

### Metadaten

#### `listApi`

`GET` API, die ein Array mit allen Objektdaten zurück gibt.
Die Inhalte der Einzelobjekte müssen so vollständig sein, dass sie so, wie sie sind, wieder an die `saveApi` und an die `deleteApi` übergeben werden können, und diese APIs damit was anfangen können.
Die API muss sich darum kümmern, dass die Elemente bereits sortiert zurück gegeben werden.

#### `saveApi`

`POST` API, die im Body das zu speichernde Objekt als JSON-Struktur bekommt.
Die API muss sich um die Neuanlage kümmern, wenn beispielsweise kein `id` Feld enthalten ist.
Die API soll bei Erfolg den Status `200` sowie das gespeicherte Objekt als JSON zurück geben.

#### `deleteApi`

`DELETE` API, die als Body das zu löschende Objekt bekommt.
Anhand dieses Objektes muss die API fähig sein, das Objekt zu löschen.
Im Erfolgsfall wird einfach ein Status `200` erwartet.

## Listenkarten

```js
// Funktionen importieren
import { createListCard } from '/js/cardhelper.mjs'
// Anzuzeigende Liste
const data = [
    { id: 'USERGROUP_ADMIN', name: 'Administratoren', icon: './images/group.png' }
]
// Metadatan über die Listeninhalte
const metadata = {
    listTitle: 'Benutzergruppen', // Titel für Listenkarte
    titlePropertyName: 'name', // Feld, welches die Bezeichnung enthält
    iconPropertyName: 'icon', // Feld mit Icon, individuall für jeden Eintrag
    icon: './images/user.png', // Icon-URL für Listen, die gleichartige Elemente enthalöten und dieselben Icons anzeigen sollen
}
// Selektions-Callback, bekommt ganzes Objekt als Parameter
const selectHandler = async (selected_object) => {
    // selected_object = { id: 'USERGROUP_ADMIN', name: 'Administratoren', icon: './images/group.png' }
    // ... Detailkarte anzeigen, oder so
}
// Callback für Neu-Button. Wenn undefined, wird kein Neu-Button angezeigt
const newHandler = async () => {
    // ... Machwas
}
// Listenkarte erstellen
const listCard = createListCard(data, metadata, selectHandler, newHandler)
// Karte einbinden
document.body.appendChild(listCard)
```

## Detailkarten

```js
// Funktionen importieren
import { createDetailsCard } from '/js/cardhelper.mjs'
// Wird von Handlern referenziert
let detailsCard
// Anzuzeigendes Objekt
const data = {
    id: 'USERGROUP_ADMIN',
    name: 'Administratoren',
    permissionids: [ 'USERS_ADMINISTRATION_USER' ]
}
// Feldname, der Titel enthält, der oben angezeigt wird
const titlePropertyName = 'name'
// Metadaten über das anzuzeigende Objekt
const metadata = [
    { // Reihenfolge im Array bestimmt Anzeigereihenfolge
        property: 'id',
        label: 'Id',
        type: 'text', 
        readonly: true
    },
    {
        property: 'name',
        label: 'Gruppenname',
        type: 'text'
    },
    {
        property: 'permissionids',
        label: 'Berechtigungen', // Überschrift über allen Select-Feldern
        type: 'multiselect', // Dynamisches Erweitern und Löschen der Select-Felder
        options: [
            {
                value: 'USERS_ADMINISTRATION_USER',
                label: 'Benutzerverwaltung',
            }
        ]
    }
}
// Speichern-Callback, asynchron
const saveHandler = async (object_to_save) => {
    // Das ursprüngliche data-Objekt wird nicht automatisch überschrieben, sondern ein neues angelegt
    data.name = object_to_save.name // Name für Aktualisierung übernehmen
    // ... Speichern-API aufrufen
    alert('Datensatz wurde gespeichert' )
    // Detailkarte mit aktualisiertem data-Objekt neu aufbauen, sofern nötig
    detailsCard.refresh()
}
// Löschen-Callback
const deleteHandler = async (object_to_delete) => {
    // object_to_delete kann genutzt werden, um Warnung zu individualisieren
    if (!confirm(`Soll ${object_to_delete.name} wirklich gelöscht werden?`)) return false
    // ... Löschen-API aufrufen
    // Detailkarte schließen
    detailsCard.parentNode.removeChild(detailsCard)
}
// Detailkarte erstellen. Wenn einer der Handler undefined ist, wird der entsprechende Button nicht angezeigt
detailsCard = createDetailsCard(titlePropertyName, data, metadata, saveHandler, deleteHandler)
// Karte einbinden
document.body.appendChild(detailsCard)
```