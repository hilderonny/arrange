import fs from 'node:fs'
import multer from 'multer'
import path from 'node:path'

import config from '../../config.mjs'

// Uploads landen direkt im Dateisystem ohne RAM-Zwischenspeicherung
const fileUpload = multer({
    storage: multer.diskStorage({
        destination: (request, file, callback) => {
            const absoluteFilePath = path.resolve(config.filesPath, request.params.userId, ...request.params.filePath)
            if (fs.existsSync(absoluteFilePath) && !fs.statSync(absoluteFilePath).isFile()) {
                callback('Requested path is an existing directory')
                return
            }
            const dirPath = path.dirname(absoluteFilePath)
            fs.mkdirSync(dirPath, { recursive: true })
            callback(null, dirPath)
        },
        filename: (request, file, callback) => {
            const absoluteFilePath = path.resolve(config.filesPath, request.params.userId, ...request.params.filePath)
            callback(null, path.basename(absoluteFilePath))
        },
        
    })
}).any()

/**
 * Datei speichern
 */
export default function(request, response) {
    fileUpload(request, response, (error) => {
        if (error) {
            response.status(400).send(error)
            return
        }
        if (!request.files || request.files.length !== 1) {
            response.sendStatus(400)
            return
        }
        response.sendStatus(200)
    })
}
