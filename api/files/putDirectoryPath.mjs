import fs from 'node:fs'
import path from 'node:path'

import config from '../../config.mjs'

/**
 * Verzeichnis erstellen
 */
export default function(request, response) {
    const absolutePath = path.resolve(config.filesPath, request.params.userId, ...request.params.directoryPath)
    if (!fs.existsSync(absolutePath)) {
        fs.mkdirSync(absolutePath, { recursive: true })
    }
    response.sendStatus(200)
}