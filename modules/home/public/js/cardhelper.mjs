/** 
 * (C) 2025 Ronny Hildebrandt (@hilderonny)
 * 
 * Funktionen zur Erstellung von Listen-und Detailkarten
 */

// TODO: fetchData Dokumentieren
async function fetchData(getApi) {
    const dataResponse = await fetch(getApi)
    if (dataResponse.status !== 200) return
    const data = await dataResponse.json()
    return data
}

/**
 * Erstellt ein Listenkarte, bei denen die einzelnen Einträge mit jeweiligen Detailkarten verknüpft sind, die automatisch gehandhabt werden.
 * 
 * @param {object} metadata Metainformationen über die Objektdaten. Werden zur Anzeige und Beschriftung verwendet
 */
async function createListAndDetailsCards(metadata) {
    // Daten von listApi holen
    let data = await fetchData(metadata.listApi)
    // Listenkarte für Referenzen vorbereiten
    let listCard
    // Detailkarte für Referenzen vorbereiten
    let detailsCard
    // Metadaten für Listenkarte
    const listMetadata = {
        listTitle: metadata.listTitle,
        identifierPropertyName: metadata.identifierPropertyName,
        titlePropertyName: metadata.titlePropertyName,
        iconPropertyName: metadata.iconPropertyName,
        listApi: metadata.listApi
    }
    // Metadatenstruktur für Detailansicht
    const detailsMetadata = metadata.fields
    // Die Speichern-Funktion aktualisiert bei Erfolg die Liste und die Detailansicht
    const internalSaveHandler = async (object_to_save) => {
        // saveApi aufrufen
        const response = await fetch(metadata.saveApi, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(object_to_save)
        })
        // Speichern war erfolgreich
        if (response.status === 200) {
            const savedData = await response.json()
            const id = savedData[metadata.identifierPropertyName]
            // Einfach Liste neu laden und gespeicherten Datensatz vorselektieren
            data = await fetchData(metadata.listApi)
            listCard.refresh(data, id)
            alert('Der Datensatz wurde gespeichert.')
        }
    }    
    // Hier wird das Originalobjekt übergeben, damit es in der Liste gefunden werden kann
    const internalDeleteHandler = async (object_to_delete) => {
        // Sicherheitsabfrage
        if (!confirm('Soll der Datensatz wirklich gelöscht werden?')) return
        // deleteApi aufrufen
        const response = await fetch(metadata.deleteApi, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(object_to_delete)
        })
        // Löschen war erfolgreich
        if (response.status === 200) {
            // Einfach Liste neu laden ohne Vorselektion
            data = await fetchData(metadata.listApi)
            listCard.refresh(data)
            alert('Der Datensatz wurde gelöscht.')
        }
    }
    // Selektion eines Listenelements
    const internalSelectHandler = (selected_object) => {
        // Detailkarte erstellen
        detailsCard = createDetailsCard(metadata.titlePropertyName, selected_object, detailsMetadata, metadata.saveApi ? internalSaveHandler : undefined, metadata.deleteApi ? internalDeleteHandler : undefined)
        // Erst mal alle Karten rechts neben der Listenkarte löschen
        while (listCard.nextSibling) listCard.nextSibling.remove()
        // Detailkarte rechts neben Listenkarte anzeigen
        listCard.parentNode.insertBefore(detailsCard, listCard.nextSibling)
    }
    // Beim Neu-Button wird eine leere Detailkarte angezeigt
    const internalNewHandler = () => {
        const detailsData = {} // Für den Anfang leer
        detailsCard = createDetailsCard(metadata.titlePropertyName, detailsData, detailsMetadata, internalSaveHandler, metadata.deleteApi ? internalDeleteHandler : undefined)
        // Erst mal alle Karten rechts neben der Listenkarte löschen
        while (listCard.nextSibling) listCard.nextSibling.remove()
        // Detailkarte rechts neben Listenkarte anzeigen
        listCard.parentNode.insertBefore(detailsCard, listCard.nextSibling)
        // Selektion in Liste entfernen
        listCard.querySelectorAll('input').forEach(input => input.checked = false)
    }
    // Listenkarte erstellen und zurück geben
    listCard = createListCard(data, listMetadata, internalSelectHandler, metadata.saveApi ? internalNewHandler : undefined)
    return listCard
}

/**
 * Erstellt eine Listenkarte anhand von gegebenem Array und Metadaten.
 * Zurückgegebenes HTML Element enthält Funktion `refresh()`, mit der
 * der Inhalt der Liste neu aufgebaut werden kann.
 * 
 * @param {object[]} data Feld mit Datenobjekten
 * @param {{listTitle: string, titlePropertyName: string, iconPropertyName: string}} metadata Beschreibungsobjekt für Daten
 * @param {(selected_object: object) => any} select_handler Callback, der beim Selektieren eines Listeneintrags aufgerufen wird
 * @param {() => any} new_handler Callback, der aufgerufen wird, wenn auf den Neu-Button geklickt wird. Der Neu-Button wird nur dann gerendert, wenn dieser Parameter angegeben ist.
 */
function createListCard(data, metadata, select_handler, new_handler) {
    // DOM-Struktur vorbereiten, Karte selbst
    const cardDiv = document.createElement('div')
    cardDiv.classList.add('card')
    // Überschrift
    const titleH1 = document.createElement('h1')
    titleH1.innerHTML = metadata.listTitle
    cardDiv.appendChild(titleH1)
    // Neu-Button anhängen, wenn Handler angegeben wurde
    if (new_handler) {
        // Toolbar
        const toolbarDiv = document.createElement('div')
        toolbarDiv.classList.add('toolbar')
        cardDiv.appendChild(toolbarDiv)
        // Neu-Button
        const newButton = createButton('Neu', 'new', async () => {
            await new_handler()
        })
        toolbarDiv.appendChild(newButton)
    }
    // Liste mit Links
    const linksDiv = document.createElement('div')
    linksDiv.classList.add('links')
    cardDiv.appendChild(linksDiv)
    // Methode zum Aktualisieren der Inhalte definieren
    cardDiv.refresh = function(new_data, selected_identifier) {
        // Liste leeren
        linksDiv.innerHTML = ''
        for (const element of new_data) {
            // Radio Input
            const inputId = 'link-' + metadata.listTitle + '-' + element[metadata.identifierPropertyName]
            const input = createInput(undefined, 'radio', false)
            input.setAttribute('name', 'link-' + metadata.listTitle)
            input.setAttribute('id', inputId)
            linksDiv.appendChild(input)
            // Bei Bedarf vorselektieren
            const isSelected = selected_identifier && (element[metadata.identifierPropertyName] === selected_identifier)
            if (isSelected) {
                input.checked = true
            }
            // Label with icon
            const label = createLabel(element[metadata.titlePropertyName], inputId)
            const iconUrl = element[metadata.iconPropertyName]
            if (iconUrl) label.style.backgroundImage = `url(${iconUrl})`
            linksDiv.appendChild(label)
            // Select-Handler anhängen, wenn angegeben
            if (select_handler) {
                const internalSelectHandler = async function() {
                    await select_handler(element)
                }
                input.addEventListener('click', internalSelectHandler)
                // Bei Vorauswhl Selektion triggern
                if (isSelected) {
                    internalSelectHandler()
                }
            }
        }
    }
    // Inhalte erstmalig generieren, ohne Vorselektion
    cardDiv.refresh(data)
    // Listenkarte zurück geben
    return cardDiv
}

/**
 * Erstellt eine Detailkarte mit Eingabefeldern für alle Elemente des Datenobjektes.
 * Wenn Handler zum Speichern oder Löschen angegeben sind, werden die entsprechenden Buttons angezeigt.
 * 
 * @param {string} title_property_name Gibt den Namen der Property im Datenobjekt an, in welchem der als Titel anzuzeigende Name steckt
 * @param {object} data Datenobjekt mit Werten an Properties
 * @param {object[]} metadata Feld mit Metadaten für jede Datenobjekt-Property. Die Reihenfolge der Feldelemente bestimmt die Renderreihenfolge.
 * @param {(object_to_save) => any} save_handler Callback zum Speichern. Muss Speichern und Erfolgsmeldung durchführen und bei Erfolg `true` zurück geben
 * @param {(object_to_delete) => any} delete_handler Callback zum Löschen. Muss Sicherheitsabfrage machen und Objekt löschen. Bei Erfolg soll `true` zurück gegeben werden
 */
function createDetailsCard(title_property_name, data, metadata, save_handler, delete_handler) {
    let dataDiv
    // DOM-Struktur vorbereiten, Karte selbst
    const cardDiv = document.createElement('div')
    cardDiv.classList.add('card')
    // Überschrift
    const titleH1 = document.createElement('h1')
    cardDiv.appendChild(titleH1)
    // Toolbar
    if (save_handler || delete_handler) {
        const toolbarDiv = document.createElement('toolbar')
        toolbarDiv.classList.add('toolbar')
        cardDiv.appendChild(toolbarDiv)
        // Speichern-Button
        if (save_handler) {
            const saveButton = createButton('Speichern', 'save', async () => {
                // Geänderte Inhalte anhand der Metadaten zusammentragen
                for (const fieldMetadata of metadata) {
                    const domNode = fieldMetadata.domNode
                    const propertyName = fieldMetadata.property
                    switch (fieldMetadata.type) {
                        // Einfaches Textfeld
                        case 'text':
                            const text = domNode.value
                            data[propertyName] = text
                            break
                        // Passwortfeld
                        case 'password':
                            const password = domNode.value
                            data[propertyName] = password
                            break
                        // Mehrfachauswahlfeld
                        case 'multiselect':
                            const selectedValues = domNode.getSelectedValues()
                            data[propertyName] = selectedValues
                            break
                    }
                }
                // Callback zum Speichern aufrufen
                const saveResult = await save_handler(data)
                // Bei Erfolg Detailseite neu aufbauen
                if (saveResult) {
                    cardDiv.refresh()
                }
            })
            toolbarDiv.appendChild(saveButton)
        }
        // Löschen-Button
        if (save_handler) {
            const deleteButton = createButton('Löschen', 'delete', async () => {
                // Das ursprüngliche Objekt wird zum Nachschlagen an das Callback übergeben
                const deleteResult = await delete_handler(data)
                // Wenn das Objekt gelöscht wurde, schließt sich die Detailkarte
                if (deleteResult) {
                    cardDiv.remove()
                }
            })
            toolbarDiv.appendChild(deleteButton)
        }
    }
    // Abschnitt für dynamische Inhalte
    dataDiv = document.createElement('div')
    dataDiv.classList.add('data')
    cardDiv.appendChild(dataDiv)
    // Methode zum Aktualisieren der Inhalte
    cardDiv.refresh = function () {
        // Überschrift
        titleH1.innerHTML = data[title_property_name] || ''
        // Inhalte leeren
        dataDiv.innerHTML = ''
        // Eingabefelder für alle Objekt-Properties erzeugen
        for (const fieldMetadata of metadata) {
            const value = data[fieldMetadata.property]
            const title = fieldMetadata.label
            const isReadOnly = !!fieldMetadata.readonly
            // Feld abhängig vom Typ erzeugen
            switch (fieldMetadata.type) {
                // Einfaches Textfeld
                case 'text':
                    const textLabel = createLabel(title)
                    dataDiv.appendChild(textLabel)
                    const textInput = createInput(value, 'text', isReadOnly)
                    dataDiv.appendChild(textInput)
                    fieldMetadata.domNode = textInput // Eingabefeld an Metadata für spätere Referenz speichern
                    break
                // Passwort-Feld
                case 'password':
                    const passwordLabel = createLabel(title)
                    dataDiv.appendChild(passwordLabel)
                    const passwordInput = createInput(value, 'password', isReadOnly)
                    dataDiv.appendChild(passwordInput)
                    fieldMetadata.domNode = passwordInput
                    break
                // Mehrfachauswahlfeld
                case 'multiselect':
                    const multiselectHeader = document.createElement('h2')
                    dataDiv.appendChild(multiselectHeader)
                    const multiSelectElement = createMultiSelect(value, fieldMetadata.options)
                    dataDiv.appendChild(multiSelectElement)
                    fieldMetadata.domNode = multiSelectElement
                    break
            }
        }
    }
    // Inhalte erstmalig generieren
    cardDiv.refresh()
    // Detailkarte zurück geben
    return cardDiv
}

/**
 * Erstellt einen HTML Abschnitt mit mehreren dynamischen Auswahlfeldern.
 * Es können Auswahlfelder hinzugefügt und entfernt werden.
 * Über die Funktion `getSelectedValues()` kann die aktuelle Auswahl abgefragt werden.
 * @param {string[]} selected_values Liste vorausgewählter Werte
 * @param {object[]} options Verfügbare Optionen
 */
function createMultiSelect(selected_values, options) {
    const multiSelect = document.createElement('div')
    multiSelect.classList.add('multiselect')
    // Select-Boxen für vorselektierte Werte erstellen
    if (selected_values) {
        for (const selectedValue of selected_values) {
            // Feld nur dann einblenden, wenn der Wert in den Optionen enthalten ist.
            // Das Gegenteil kann bei Benutzern passieren, wenn eine Benutzergruppe, der der Benutzer angehört, gelöscht wird
            if (options.find(option => option.value === selectedValue)) {
                const selectElement = createDynamicSelect(selectedValue, options)
                multiSelect.appendChild(selectElement)
            }
        }
    }
    // Zusätzliches Feld erstellen, damit neue Zuordnungen erstellt werden können
    const addSelectElement = createDynamicSelect(undefined, options)
    addSelectElement.addEventListener('change',() => {
        // Wenn die Auswahl geändert wurde, wird einfach eine neue Option mit
        // dieser Auswahl davor platziert
        const selectToInsert = createDynamicSelect(addSelectElement.value, options)
        multiSelect.insertBefore(selectToInsert, addSelectElement)
        addSelectElement.value = '__ADD__'
        selectToInsert.focus()
    })
    multiSelect.appendChild(addSelectElement)
    // Funktion zum Abfragen der derzeitigen Auswahl
    multiSelect.getSelectedValues = function () {
        const selectedValues = []
        for (const selectElement of multiSelect.querySelectorAll('select')) {
            const value = selectElement.value
            if (value === '__ADD__' || value === '__DELETE__') continue
            selectedValues.push(value)
        }
        return selectedValues
    }
    return multiSelect
}

/**
 * Erzeugt ein Select-Element mit angegebenen Optionen.
 * Wenn kein Wert vorgegeben wird, wird eine zusätzliche Hinweisoption "Hinzufügen ..." angezeigt.
 * Wenn ein Wert vorgegeben wird, wird eine Option zum Löschen eingefügt, bei deren Auswahl das ganzes Select-Element gelöscht wird.
 * 
 * @param {string} selected_value Wert, der vorselektiert sein soll
 * @param {object[]} options Liste von Möglichkeiten, die ausgewählt werden können
 */
function createDynamicSelect(selected_value, options) {
    let hintOption
    const selectElement = document.createElement('select')
    // Hinweisfeld, wenn keine Vorauswahl getroffen wurde
    if (!selected_value) {
        hintOption = createOption('Hinzufügen ...', '__ADD__', true, true)
        selectElement.appendChild(hintOption)
    }
    // Für alle Optionen Einträge erstellen
    for (const option of options) {
        const isSelected = option.value === selected_value
        const optionElement = createOption(option.label, option.value, false, isSelected)
        selectElement.appendChild(optionElement)
    }
    // Letzter Eintrag dient zum Löschen der Zuordnung
    // Wird aber nur erzeugt, wenn eine Zuordnung selektiert ist
    if (selected_value) {
        const deleteOption = createOption('Löschen ...', '__DELETE__', false, false)
        selectElement.appendChild(deleteOption)
        selectElement.addEventListener('change', () => {
            if (selectElement.value === '__DELETE__') {
                selectElement.remove()
            }
        })
    }
    return selectElement
}

/**
 * Erzeugt ein Optionselement
 * 
 * @param {string} content Text, der in Option angezeigt wird
 * @param {string} value Wert, den die Option darstellt
 * @param {boolean} is_disabled Gibt an, ob Option deaktiviert ist. In diesem Fall kan die Option nicht ausgewählt werden
 * @param {boolean} is_selected Gibt an, ob die Option vorselektiert ist
 */
function createOption(content, value, is_disabled, is_selected) {
    const option = document.createElement('option')
    option.innerHTML = content
    option.value = value
    option.disabled = is_disabled
    option.selected = is_selected
    return option
}

/**
 * Erstellt einen Button mit gegebenem Text und Stylesheets.
 * 
 * @param {string} content Text auf dem Button. Kann HTML sein.
 * @param {string} style_class CSS-Klassen
 * @param {(this: HTMLButtonElement, ev: MouseEvent) => any} click_handler Callback zum Speichern. Muss sich um Speicherung und Erfolgsmeldung kümmern und im Erfolg `true` zurück geben
 */
function createButton(content, style_class, click_handler) {
    const button = document.createElement('button')
    if (style_class) {
        button.setAttribute('class', style_class)
    }
    button.innerHTML = content
    button.addEventListener('click', click_handler)
    return button
}

/**
 * Erstellt ein input Feld.
 * 
 * @param {string} value Vorgegebener Wert des Feldes
 * @param {string} type Typ des Elements. Kann `text`, `password`, `radio` sein
 * @param {boolean} read_only Gibt an, ob Eingabefeld nur lesbar sein soll
 */
function createInput(value, type, read_only) {
    const input = document.createElement('input')
    input.setAttribute('type', type)
    if (value) {
        input.value = value
    }
    if (read_only) {
        input.readOnly = true
    }
    return input
}

/**
 * Erstellt ein Label mit gegebenem Inhalt.
 * 
 * @param {string} content Text im Label, kann auch HTML sein
 * @param {string} for_id Optional. Id des zugehörigen Input-Feldes
 */
function createLabel(content, for_id) {
    const label = document.createElement('label')
    label.innerHTML = content
    if (for_id) {
        label.setAttribute('for', for_id)
    }
    return label
}

export { createListAndDetailsCards, createListCard, createDetailsCard }