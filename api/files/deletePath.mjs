import fs from 'node:fs'
import path from 'node:path/posix'

/**
 * Pfad im Dateisystem löschen
 */
export default function(config, databaseUtils, userUtils) {

    return function(request, response) {
        const absolutePath = path.resolve(config.filesPath, request.params.userId, ...request.params.filePath)
        if (fs.existsSync(absolutePath)) {
            fs.rmSync(absolutePath, { recursive: true })
            response.sendStatus(200)
        } else {
            response.sendStatus(404)
        }
    }

}