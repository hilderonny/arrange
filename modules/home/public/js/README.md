# UI Vorlagen

TODO: Diese Doku in Modul-README integrieren

## Listen- und Detailansichten für Datenbankobjekt

```js
// Funktionen importieren
import { createListAndDetailsCards } from '/modules/home/js/cardhelper.mjs'
// Objektliste mit vollständigen Daten
const data = [
    {
        id: 'USERGROUP_ADMIN',
        name: 'Administratoren',
        permissionids: [ 'PERMISSION_ADMINISTRATION_USER' ],
        icon: './images/group.png' // Icons müssen jedem Objekt mitgegeben werden, für Liste
    }
]
// Metainformationen für Liste und Detailansicht
const metadata = {
    listTitle: 'Benutzergruppen', // Titel für Listenkarte
    titlePropertyName: 'name', // Feld, welches in der Liste und im Kopf der Detailansicht angezeigt wird
    iconPropertyName: 'icon', // Feld mit Icon
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
// Speichern-Callback. Muss bei Erfolg true zurück geben, damit UI neu geladen wird
const saveHandler = async (object_to_save) => {
    // Das ursprüngliche data-Objekt wird nicht automatisch überschrieben, sondern ein neues angelegt
    data.name = object_to_save.name // Name übernehmen
    // ... Speichern-API aufrufen
    alert('Datensatz wurde gespeichert' )
    // Speichern erfolgreich, true zurück geben
    return true
}
// Löschen-Callback. Bei Erfolg muss true zurück gegeben werden, 
// damit Detailkarte geschlossen und Liste aktualisiert werden kann
const deleteHandler = async (object_to_delete) => {
    // object_to_delete kann genutzt werden, um Warnung zu individualisieren
    if (!confirm(`Soll ${object_to_delete.name} wirklich gelöscht werden?`)) return false
    // ... Löschen-API aufrufen
    // Erfolg zurückmelden
    return true
}
// Es wird die Listenkarte zurück gegeben
// Wenn saveHandler angegeben ist, werden die Neu- und Speichern-Buttons angezeigt
// Der Löschen-Button wird nur dann angezeigt, wenn ein deleteHandler angegeben ist
const listCard = createListAndDetailsCards(data, metadata, saveHandler, deleteHandler)
document.body.appendChild(listCard)
```

## Listenkarten

```js
// Funktionen importieren
import { createListCard } from '/modules/home/js/cardhelper.mjs'
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
import { createDetailsCard } from '/modules/home/js/cardhelper.mjs'
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