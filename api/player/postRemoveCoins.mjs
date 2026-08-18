import playerUtils from '../../utils/playerUtils.mjs'

/**
 * Münzen abziehen
 */
export default function(config, databaseUtils, userUtils) {

    return async function(request, response) {
        const playerStatus = await playerUtils.removePlayerCoins(request.params.userId, request.params.coinsToRemove)
        if (playerStatus) {
            response.json(playerStatus)
        } else {
            response.sendStatus(404)
        }
    }

}