import playerUtils from '../../utils/playerUtils.mjs'

/**
 * Spielerstatus erfragen
 */
export default function(config, databaseUtils, userUtils) {

    return async function(request, response) {
        const playerStatus = await playerUtils.getPlayerStatus(request.params.userId)
        if (playerStatus) {
            response.json({
                Coins: playerStatus.Coins,
                Experience: playerStatus.Experience,
                Level: playerStatus.Level,
                NextLevelExperience: playerStatus.NextLevelExperience,
            })
        } else {
            response.sendStatus(404)
        }
    }

}