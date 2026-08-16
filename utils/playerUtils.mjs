import databaseUtils from './databaseUtils.mjs'
import userUtils from './userUtils.mjs'

// Funktion zum Berechnen von notwendigen Differenz-Erfahrungspunkten für einen Level:
//
// Math.round(Math.pow(GRUND_EP, LEVEL) * ANPASSUNGS_FAKTOR)
// Hier steckt noch ein Fehler drin, nochmal gegen die Excel-Datei prüfen!
//
// Gute Grundwerte:
// GRUND_EP = 25
// ANPASSUNGS_FAKTOR = 1.1

// Ich speichere am Player den Level und die aktuellen EPs innerhalb des Levels und aktualisiere
// den Level beim Hinzufügen von Erfahrungspunkten - bei Bedarf sogar über mehrere Level hinweg

// Oder: Ich mache es wie Habitica, wo bei jedem Level 25 zusätzliche Differenz-EPs hinzu kommen

for (let level = 0, kummulierteEp = 0; level < 10; level++) {
    const notwendigeEp = Math.round(Math.pow(25, level) * 1.1)
    kummulierteEp += notwendigeEp
    console.log(level, notwendigeEp, kummulierteEp)
}

export default {

    async getPlayerStatus(userId) {
        const user = userUtils.getUserById(userId)
        if (user) {
            const playerDatabase = await databaseUtils.loadDatabase('Player')
            let existingPlayerStatus = playerDatabase.prepare(`SELECT * FROM PlayerStatus WHERE UserId='${userId}';`).get()
            if (!existingPlayerStatus) {
                playerDatabase.prepare(`INSERT INTO PlayerStatus (Id, UserId, Coins, Experience, Level) VALUES('${userId}', '${userId}', 0, 0, 0);`).run()
                existingPlayerStatus = playerDatabase.prepare(`SELECT * FROM PlayerStatus WHERE UserId='${userId}';`).get()
            }
            return existingPlayerStatus
        } else { // Benutzer nicht gefunden
            return undefined
        }
    },

}