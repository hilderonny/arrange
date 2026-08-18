import playerUtils from '../../utils/playerUtils.mjs'

/**
 * Münzen hinzufügen
 */
export default function(config, databaseUtils, userUtils) {

    return async function(request, response) {
        const playerStatus = await playerUtils.addPlayerCoins(request.params.userId, request.params.coinsToAdd)
        if (playerStatus) {
            response.json(playerStatus)
        } else {
            response.sendStatus(404)
        }
    }

}