# UI Vorlagen

## Listen- und Detailansichten für Datenbankobjekt

```js
// TODO: Weiter ausdefinieren, siehe Sprachnotiz
const listCard createListAndDetailCards(data, metadata, saveHandler, deleteHandler)
```

## Listenkarten

```js
// Funktionen importieren
import { createListCard } from '/modules/home/js/cardhelper.mjs'
const title = 'Benutzergruppen'
// Anzuzeigende Liste
const data = [
    { id: 'USERGROUP_ADMIN', name: 'Administratoren', icon: './images/group.png' }
]
// Metadatan über die Listeninhalte
const metadata = {
    labelfield: 'name', // Feld, welches die Bezeichnung enthält
    iconfield: 'icon', // Feld mit Icon
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
const listCard = createListCard(title, data, metadata, selectHandler, newHandler)
// Karte einbinden
document.body.appendChild(listCard)
```

## Detailkarten

```js
// Funktionen importieren
import { createDetailCard } from '/modules/home/js/cardhelper.mjs'
// Wird von Handlern referenziert
let detailCard
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
        key: 'id',
        label: 'Id',
        type: 'text', 
        readonly: true
    },
    {
        key: 'name',
        label: 'Gruppenname',
        type: 'text'
    },
    {
        key: 'permissionids',
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
const saveHandler = async (dataToSave) => {
    // Das ursprüngliche data-Objekt wird nicht automatisch überschrieben, sondern ein neues angelegt
    data.name = dataToSave.name // Name übernehmen
    // ... Speichern-API aufrufen
    alert('Datensatz wurde gespeichert' )
    // Detailkarte mit aktualisiertem data-Objekt neu aufbauen, sofern nötig
    detailCard.refresh()
}
// Löschen-Callback
const deleteHandler = async () => {
    if (!confirm('Wirklich löschen?')) return
    // ... Löschen-API aufrufen
    // Detailkarte schließen
    detailCard.parentNode.removeChild(detailCard)
}
// Detailkarte erstellen. Wenn einer der Handler undefined ist, wird der entsprechende Button nicht angezeigt
detailCard = createDetailCard(titlePropertyName, data, metadata, saveHandler, deleteHandler)
// Karte einbinden
document.body.appendChild(detailCard)
```