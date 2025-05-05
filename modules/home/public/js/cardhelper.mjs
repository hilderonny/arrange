/** 
 * (C) 2025 Ronny Hildebrandt (@hilderonny)
 * 
 * Funktionen zur Erstellung von Listen-und Detailkarten
 */

// TODO: Dokumentieren
function createListAndDetailsCards(data, metadata, save_handler, delete_handler) {
    // Listenkarte für Referenzen vorbereiten
    let listCard
    // Metadaten für Listenkarte
    const listMetadata = {
        listTitle: metadata.listTitle,
        titlePropertyName: metadata.titlePropertyName,
        iconPropertyName: metadata.iconPropertyName
    }
    // Metadatenstruktur für Detailansicht
    const detailsMetadata = metadata.fields
    // TODO: internalSaveHandler
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
        const detailsCard = createDetailsCard(metadata.titlePropertyName, selected_object, detailsMetadata, internalSaveHandler, internalDeleteHandler)
        // Erst mal alle Karten rechts neben der Listenkarte löschen
        while (listCard.nextSibling) listCard.nextSibling.remove()
        // Detailkarte rechts neben Listenkarte anzeigen
        listCard.parentNode.insertBefore(detailsCard, listCard.nextSibling)
    }
    // Beim Neu-Button wird eine leere Detailkarte angezeigt
    const internalNewHandler = () => {
        const detailsData = {} // Für den Anfang leer
        const detailsCard = createDetailsCard(metadata.titlePropertyName, detailsData, detailsMetadata, internalSaveHandler, internalDeleteHandler)
        // Erst mal alle Karten rechts neben der Listenkarte löschen
        while (listCard.nextSibling) listCard.nextSibling.remove()
        // Detailkarte rechts neben Listenkarte anzeigen
        listCard.parentNode.insertBefore(detailsCard, listCard.nextSibling)
    }
    // Listenkarte erstellen und zurück geben
    listCard = createListCard(listData, listMetadata, internalSelectHandler, internalNewHandler)
    return listCard
}

// TODO: Dokumentieren
function createListCard(data, metadata, select_handler, new_handler) {
    // TODO: Implementieren, inkl. refresh() - Methode
    const listCard = document.createElement('div')
    return listCard
}

// TODO: Dokumentieren
function createDetailsCard(title_property_name, data, metadata, save_handler, delete_handler) {
    // TODO: Implementieren, inkl. refresh() - Methode
    const detailsCard = document.createElement('div')
    return detailsCard
}

export { createListAndDetailsCards, createListCard, createDetailsCard }