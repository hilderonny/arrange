import databaseUtils from './databaseUtils.mjs'
import userUtils from './userUtils.mjs'

function getLevelForExperience(experience) {

}

// Funktion zum Berechnen von notwendigen Differenz-Erfahrungspunkten für einen Level:
//
// Math.round(Math.pow(GRUND_EP, LEVEL) * ANPASSUNGS_FAKTOR)
//
// Gute Grundwerte:
// GRUND_EP = 25
// ANPASSUNGS_FAKTOR = 1.1
//
// Ich brauche aber eine Funktion, die anhand der kummulierten EPs den Level berechnet

export default {

    async getPlayerStatus(userId) {
        const user = userUtils.getUserById(userId)
        if (user) {
            const playerDatabase = await databaseUtils.loadDatabase('Player')
            let existingPlayerStatus = playerDatabase.prepare(`SELECT * FROM PlayerStatus WHERE UserId='${userId}';`).get()
            if (!existingPlayerStatus) {
                playerDatabase.prepare(`INSERT INTO PlayerStatus (Id, UserId, Coins, Experience) VALUES('${userId}', '${userId}', 0, 0);`).run()
                existingPlayerStatus = playerDatabase.prepare(`SELECT * FROM PlayerStatus WHERE UserId='${userId}';`).get()
            }
            return existingPlayerStatus
        } else { // Benutzer nicht gefunden
            return undefined
        }
    },

}