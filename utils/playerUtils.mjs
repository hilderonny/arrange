import databaseUtils from './databaseUtils.mjs'
import userUtils from './userUtils.mjs'

/**
 * Ganz einfach: Mit jedem Level werden 25 EPs mehr für einen Aufstig benötigt.
 * REQ_EP = AKTUELLER_LEVEL * 25
 * Start bei Level 1
 */

export default {

    async addPlayerCoins(userId, coinsToAdd) {
        const playerStatus = await this.getPlayerStatus(userId)
        if (playerStatus) {
            const intCoins = parseInt(coinsToAdd)
            if (intCoins > 0) {
                const playerDatabase = await databaseUtils.loadDatabase('Player')
                playerStatus.Coins += intCoins
                playerDatabase.prepare(`UPDATE PlayerStatus SET Coins = ${playerStatus.Coins} WHERE Id = '${playerStatus.Id}';`).run()
            }
            return playerStatus
        } else {
            return undefined
        }
    },

    async addPlayerExperience(userId, experienceToAdd) {
        const playerStatus = await this.getPlayerStatus(userId)
        if (playerStatus) {
            const intExperience = parseInt(experienceToAdd)
            if (intExperience > 0) {
                playerStatus.Experience += intExperience
                const playerDatabase = await databaseUtils.loadDatabase('Player')
                while (playerStatus.Experience > playerStatus.NextLevelExperience) {
                    playerStatus.Level++
                    playerStatus.Experience -= playerStatus.NextLevelExperience
                    playerStatus.NextLevelExperience = playerStatus.Level * 25
                }
                playerDatabase.prepare(`UPDATE PlayerStatus SET Experience = ${playerStatus.Experience} WHERE Id = '${playerStatus.Id}';`).run()
            }
            return playerStatus
        } else {
            return undefined
        }
    },

    async getPlayerStatus(userId) {
        const user = userUtils.getUserById(userId)
        if (user) {
            const playerDatabase = await databaseUtils.loadDatabase('Player')
            let existingPlayerStatus = playerDatabase.prepare(`SELECT * FROM PlayerStatus WHERE UserId='${userId}';`).get()
            if (!existingPlayerStatus) {
                playerDatabase.prepare(`INSERT INTO PlayerStatus (Id, UserId, Coins, Experience, Level) VALUES('${userId}', '${userId}', 0, 0, 1);`).run()
                existingPlayerStatus = playerDatabase.prepare(`SELECT * FROM PlayerStatus WHERE UserId='${userId}';`).get()
            }
            existingPlayerStatus.LevelBefore = existingPlayerStatus.Level
            existingPlayerStatus.NextLevelExperience = existingPlayerStatus.Level * 25
            return existingPlayerStatus
        } else { // Benutzer nicht gefunden
            return undefined
        }
    },

    async removePlayerCoins(userId, coinsToRemove) {
        const playerStatus = await this.getPlayerStatus(userId)
        if (playerStatus) {
            const intCoins = parseInt(coinsToRemove)
            if (intCoins > 0) {
                const playerDatabase = await databaseUtils.loadDatabase('Player')
                playerStatus.Coins -= intCoins
                if (playerStatus.Coins < 0) {
                    playerStatus.Coins = 0
                }
                playerDatabase.prepare(`UPDATE PlayerStatus SET Coins = ${playerStatus.Coins} WHERE Id = '${playerStatus.Id}';`).run()
            }
            return playerStatus
        } else {
            return undefined
        }
    },

}