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
            // Detailkarte aktualisieren, übernimmt Titel
            detailsCard.refresh()
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
            // Alle Karten rechts neben Listenkarte entfernen
            while (listCard.nextSibling) listCard.nextSibling.remove()
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
        const newButton = document.createElement('div')
        newButton.classList.add('new')
        newButton.innerHTML = 'Neu'
        newButton.addEventListener('click', async () => {
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
            const label = document.createElement('label')
            label.setAttribute('for', input.id)
            label.innerHTML = element[metadata.titlePropertyName]
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
    // TODO: Implementieren, inkl. refresh() - Methode
    const detailsCard = document.createElement('div')
    return detailsCard
}

export { createListAndDetailsCards, createListCard, createDetailsCard }