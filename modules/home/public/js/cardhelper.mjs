/** 
 * (C) 2025 Ronny Hildebrandt (@hilderonny)
 * 
 * Funktionen zur Erstellung von Listen-und Detailkarten
 */

/**
 * Erstellt ein Listenkarte, bei denen die einzelnen Einträge mit jeweiligen Detailkarten verknüpft sind, die automatisch gehandhabt werden.
 * 
 * @param {object[]} data Feld mit gleichartigen Objektdaten
 * @param {object} metadata Metainformationen über die Objektdaten. Werden zur Anzeige und Beschriftung verwendet
 * @param {(object_to_save) => any} save_handler Callback zum Speichern. Muss Speichern und Erfolgsmeldung durchführen und bei Erfolg `true` zurück geben
 * @param {(object_to_delete) => any} delete_handler Callback zum Löschen. Muss Sicherheitsabfrage machen und Objekt löschen. Bei Erfolg soll `true` zurück gegeben werden
 */
function createListAndDetailsCards(data, metadata, save_handler, delete_handler) {
    // Listenkarte für Referenzen vorbereiten
    let listCard
    // Detailkarte für Referenzen vorbereiten
    let detailsCard
    // Metadaten für Listenkarte
    const listMetadata = {
        listTitle: metadata.listTitle,
        titlePropertyName: metadata.titlePropertyName,
        iconPropertyName: metadata.iconPropertyName
    }
    // Metadatenstruktur für Detailansicht
    const detailsMetadata = metadata.fields
    // Die Speichern-Funktion aktualisiert bei Erfolg die Liste und die Detailansicht
    const internalSaveHandler = async (object_to_save) => {
        // Übergebenes Callback aufrufen, welches das Speichern und die Erfolgsmeldung übernimmt
        const saveSucceeded = await save_handler(object_to_save)
        // Datensatz wurde gespeichert und in ursprüngliches Datenobjekt übernommen (macht save_handler)
        if (saveSucceeded) {
            // Listenkarte aktualisieren
            listCard.refresh()
            // Die Detailkarte aktualisiert sich selbst nach dem Speichern
        }
    }    
    // Hier wird das Originalobjekt übergeben, damit es in der Liste gefunden werden kann
    const internalDeleteHandler = async (object_to_delete) => {
        // Übergebenes Callback aufrufen, welches die Sicherheitsabfrage und das Löschen übernimmt
        const deletionSucceeded = await delete_handler(object_to_delete)
        // Löschen war erfolgreich
        if (deletionSucceeded) {
            // Datensatz aus Liste löschen
            data.splice(data.indexOf(object_to_delete), 1)
            // Detailkarte schließt sich selbst
            // Listenkarte aktualisieren
            listCard.refresh()
        }
    }
    // Selektion eines Listenelements
    const internalSelectHandler = (selected_object) => {
        // Detailkarte erstellen
        detailsCard = createDetailsCard(metadata.titlePropertyName, selected_object, detailsMetadata, internalSaveHandler, internalDeleteHandler)
        // Erst mal alle Karten rechts neben der Listenkarte löschen
        while (listCard.nextSibling) listCard.nextSibling.remove()
        // Detailkarte rechts neben Listenkarte anzeigen
        listCard.parentNode.insertBefore(detailsCard, listCard.nextSibling)
    }
    // Beim Neu-Button wird eine leere Detailkarte angezeigt
    const internalNewHandler = () => {
        const detailsData = {} // Für den Anfang leer
        detailsCard = createDetailsCard(metadata.titlePropertyName, detailsData, detailsMetadata, internalSaveHandler, internalDeleteHandler)
        // Erst mal alle Karten rechts neben der Listenkarte löschen
        while (listCard.nextSibling) listCard.nextSibling.remove()
        // Detailkarte rechts neben Listenkarte anzeigen
        listCard.parentNode.insertBefore(detailsCard, listCard.nextSibling)
    }
    // Listenkarte erstellen und zurück geben
    listCard = createListCard(data, listMetadata, internalSelectHandler, internalNewHandler)
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
    cardDiv.refresh = () => {
        // Liste leeren
        linksDiv.innerHTML = ''
        for (const [index, element] of data.entries()) {
            const inputId = 'link-' + index
            // Radio Input
            const input = createInput(undefined, 'radio', inputId, false)
            input.setAttribute('name', 'link')
            linksDiv.appendChild(input)
            // Label
            const label = createLabel(element[metadata.titlePropertyName], input.id)
            // Icon
            const iconUrl = element[metadata.iconPropertyName]
            if (iconUrl) label.style.backgroundImage = `url(${iconUrl})`
            linksDiv.appendChild(label)
            // Select-Handler anhängen, wenn angegeben
            if (select_handler) {
                input.addEventListener('click', async () => {
                    await select_handler(element)
                })
            }
        }
    }
    // Inhalte erstmalig generieren
    cardDiv.refresh()
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
        // Speichern-Button
        if (save_handler) {
            const saveButton = createButton('Speichern', 'save', async () => {
                // Geänderte Inhalte anhand der Metadaten zusammentragen
                const objectToSave = {}
                for (const [index, fieldMetadata] of metadata.entries()) {
                    const domNode = dataDiv.getElementById('data-' + index)
                    const propertyName = fieldMetadata.property
                    switch (fieldMetadata.type) {
                        // Einfaches Textfeld
                        case 'text':
                            const text = domNode.value
                            objectToSave[propertyName] = text
                            break
                        // Passwortfeld
                        case 'password':
                            const password = domNode.value
                            objectToSave[propertyName] = password
                            break
                        // Mehrfachauswahlfeld
                        case 'multiselect':
                            const selectedValues = domNode.getSelectedValues()
                            objectToSave[propertyName] = selectedValues
                            break
                    }
                }
                // Callback zum Speichern aufrufen
                const saveResult = await save_handler(objectToSave)
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
    cardDiv.refresh = () => {
        // Überschrift
        titleH1.innerHTML = data[title_property_name]
        // Inhalte leeren
        dataDiv.innerHTML = ''
        // Eingabefelder für alle Objekt-Properties erzeugen
        for (const [index, fieldMetadata] of metadata.entries()) {
            const inputId = 'data-' + index
            const value = data[fieldMetadata.property]
            const title = fieldMetadata.label
            const isReadOnly = fieldMetadata.readonly
            // Feld abhängig vom Typ erzeugen
            switch (fieldMetadata.type) {
                // Einfaches Textfeld
                case 'text':
                    const textLabel = createLabel(title)
                    dataDiv.appendChild(textLabel)
                    const textInput = createInput(value, 'text', inputId, isReadOnly)
                    dataDiv.appendChild(textInput)
                    break
                // Passwort-Feld
                case 'password':
                    const passwordLabel = createLabel(title)
                    dataDiv.appendChild(passwordLabel)
                    const passwordInput = createInput(value, 'password', inputId, isReadOnly)
                    dataDiv.appendChild(passwordInput)
                    break
                // Mehrfachauswahlfeld
                case 'multiselect':
                    const multiselectHeader = document.createElement('h2')
                    dataDiv.appendChild(multiselectHeader)
                    const multiSelectElement = createMultiSelect(value, fieldMetadata.options)
                    dataDiv.appendChild(multiSelectElement)
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
    for (const selectedValue of selected_values) {
        const selectElement = createDynamicSelect(selectedValue, options)
        multiSelect.appendChild(selectElement)
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
    // Funktion zum Abfragen der derzeitigen Auswahl
    multiSelect.getSelectedValues = () => {
        const selectedValues = []
        for (const selectElement of multiSelect.querySelectorAll('select')) {
            const value = selectElement.value
            if (value === '__ADD__' || value === '__DELETE__') return
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
        const optionElement = createOption(option.label, option.value, isSelected)
        selectElement.appendChild(optionElement)
    }
    // Letzter Eintrag dient zum Löschen der Zuordnung
    // Wird aber nur erzeugt, wenn eine Zuordnung selektiert ist
    if (selected_value) {
        const deleteOption = createOption('Löschen ...', '__DELETE__', false, false)
        selectElement.appendChild(deleteOption)
        selectElement.addEventListener('change', () => {
            selectElement.remove()
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
 * @param {string} id Id des Input-Feldes
 * @param {boolean} read_only Gibt an, ob Eingabefeld nur lesbar sein soll
 */
function createInput(value, type, id, read_only) {
    const input = document.createElement('input')
    input.setAttribute('type', type)
    if (value) {
        input.value = value
    }
    if (id) {
        input.id = id
    }
    if (read_only) {
        input.readOnly = true
    }
    return input
}

/**
 * Erstellt ein Label mit gegebenem Inhalt und ordnet es einem Input-Element mit
 * gegebener Id zu.
 * 
 * @param {string} content Text im Label, kann auch HTML sein
 * @param {string} for_id Id des Input-Elementes, dem das Label angehört. Kann `undefined` sein.
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