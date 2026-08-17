import databaseUtils from './databaseUtils.mjs'
import userUtils from './userUtils.mjs'

/**
 * Ganz einfach: Mit jedem Level werden 25 EPs mehr für einen Aufstig benötigt.
 * REQ_EP = AKTUELLER_LEVEL * 25
 * Start bei Level 1
 */

export default {

    async getPlayerStatus(userId) {
        const user = userUtils.getUserById(userId)
        if (user) {
            const playerDatabase = await databaseUtils.loadDatabase('Player')
            let existingPlayerStatus = playerDatabase.prepare(`SELECT * FROM PlayerStatus WHERE UserId='${userId}';`).get()
            if (!existingPlayerStatus) {
                playerDatabase.prepare(`INSERT INTO PlayerStatus (Id, UserId, Coins, Experience, Level) VALUES('${userId}', '${userId}', 0, 0, 1);`).run()
                existingPlayerStatus = playerDatabase.prepare(`SELECT * FROM PlayerStatus WHERE UserId='${userId}';`).get()
            }
            existingPlayerStatus.NextLevelExperience = existingPlayerStatus.Level * 25
            return existingPlayerStatus
        } else { // Benutzer nicht gefunden
            return undefined
        }
    },

}