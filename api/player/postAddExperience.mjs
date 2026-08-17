import playerUtils from '../../utils/playerUtils.mjs'

/**
 * Erfahrungspunkte hinzufügen
 */
export default function(config, databaseUtils, userUtils) {

    return async function(request, response) {
        const playerStatus = await playerUtils.addPlayerExperience(request.params.userId, request.params.experienceToAdd)
        if (playerStatus) {
            response.json(playerStatus)
        } else {
            response.sendStatus(404)
        }
    }

}