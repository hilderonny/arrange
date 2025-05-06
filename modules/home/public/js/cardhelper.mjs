/** 
 * (C) 2025 Ronny Hildebrandt (@hilderonny)
 * 
 * Funktionen zur Erstellung von Listen-und Detailkarten
 */

// TODO: Dokumentieren
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

// TODO: Dokumentieren
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
            // Radio Input
            const input = document.createElement('input')
            input.setAttribute('type', 'radio')
            input.setAttribute('name', 'link')
            input.id = 'link-' + index
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

// TODO: Dokumentieren
function createDetailsCard(title_property_name, data, metadata, save_handler, delete_handler) {
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
                // TODO: Geänderte Inhalten zusammentragen
                const saveResult = await save_handler(...)
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
    const dataDiv = document.createElement('div')
    dataDiv.classList.add('data')
    cardDiv.appendChild(dataDiv)
    // Methode zum Aktualisieren der Inhalte
    cardDiv.refresh = () => {
        // Inhalte leeren
        dataDiv.innerHTML = ''
        // Eingabefelder für alle Objekt-Properties erzeugen
        for (const [index, fieldMetadata] of metadata.entries()) {
            const inputId = 'data-' + index
            const value = data[fieldMetadata.property]
            const title = fieldMetadata.label
            const isReadOnly = fieldMetadata.readonly
            // TODO: Feld abhängig vom Typ erzeugen
            switch (fieldMetadata.type) {
                // Einfaches Textfeld
                case 'text':
                    const label = createLabel(title)
                    dataDiv.appendChild(label)
                    // TODO: ID-Felder mit separater Klasse versehen, damit Text kleiner wird?
                    const textInput = createTextInput(value, inputId, isReadOnly)
                    dataDiv.appendChild(textInput)
                    break
                // TODO: Passwort-Feld
                // TODO: Mehrfachauswahlfeld
                case 'multiselect':
                    break
            }
        }
    }
    // Inhalte erstmalig generieren
    cardDiv.refresh()
    // Detailkarte zurück geben
    return cardDiv
}

// TODO: Dokumentieren
function createButton(content, style_class, click_handler) {
    const button = document.createElement('button')
    if (style_class) {
        button.setAttribute('class', style_class)
    }
    button.innerHTML = content
    button.addEventListener('click', click_handler)
    return button
}

// TODO: Dokumentieren
function createTextInput(value, id, read_only) {
    const input = document.createElement('input')
    input.setAttribute('type', 'text')
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

// TODO: Dokumentieren
function createLabel(content, for_id) {
    const label = document.createElement('label')
    label.innerHTML = content
    if (for_id) {
        label.setAttribute('for', for_id)
    }
    return label
}

export { createListAndDetailsCards, createListCard, createDetailsCard }