import fs from 'node:fs'
import path from 'node:path/posix'

import config from '../../config.mjs'

/**
 * Datei oder Verzeichnisinhalt liefern
 */
export default async function(request, response) {
    const absolutePath = path.resolve(config.filesPath, request.params.userId, ...request.params.filePath)
    if (!fs.existsSync(absolutePath)) {
        return response.sendStatus(404)
    }
    const pathStats = fs.statSync(absolutePath)
    if (pathStats.isDirectory()) {
        const directoryEntries = fs.readdirSync(absolutePath, { withFileTypes: true })
        const entryList = directoryEntries.map(entry => { return {
            name: entry.name,
            type: entry.isDirectory() ? 'dir' : 'file'
        }})
        response.json(entryList)
    } else {
        response.sendFile(absolutePath)
    }
}
