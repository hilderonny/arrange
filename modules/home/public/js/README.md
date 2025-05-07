# UI Vorlagen

TODO: Diese Doku in Modul-README integrieren

## Listen- und Detailansichten für Datenbankobjekt

```js
// Funktionen importieren
import { createListAndDetailsCards } from '/js/cardhelper.mjs'
// Metainformationen für Liste und Detailansicht
const metadata = {
    listTitle: 'Benutzergruppen', // Titel für Listenkarte
    identifierPropertyName: 'id', // Feld mit Identifizierer, der für Vorselektionen genutzt wird. Üblicherweise `id`.
    titlePropertyName: 'name', // Feld, welches in der Liste und im Kopf der Detailansicht angezeigt wird
    iconPropertyName: 'icon', // Feld mit Icon
    listApi: '/api/users/listusergroups', // API für Auflistung der Objekte
    saveApi: '/api/users/saveusergroup', // Optional. API zum Speichern und Neuanlegen eines Datensatzes
    deleteApi: '/api/users/deleteusergroup', // Optional. API zum Löschen eines Datensatzes
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
                    value: 'PERMISSION_ADMINISTRATION_USER',
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
    iconPropertyName: 'icon', // Feld mit Icon
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
    permissionids: [ 'PERMISSION_ADMINISTRATION_USER' ]
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
                value: 'PERMISSION_ADMINISTRATION_USER',
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