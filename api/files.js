/**
 * API for manipulating folders and files under the /files folder
 */
const router = require('express').Router();
const fs = require('fs');
const path = require('path');

/**
 * Reads a folder and returns its files in a JSON-structure.
 * Dives into subdirectories recursively.
 */
function readFolderRecursively(folderPath) {
    const folderResult = { folders: {}, files: [] };
    for (const entry of fs.readdirSync(folderPath)) {
        const entryPath = path.join(folderPath, entry);
        const stat = fs.statSync(entryPath);
        if (!stat) continue;
        if (stat.isDirectory()) {
            folderResult.folders[entry] = readFolderRecursively(entryPath);
        } else {
            folderResult.files.push(entry);
        }
    }
    return folderResult;
}

/**
 * GET /api/files
 * 
 * List all folders and files recursively. Returns a JSON object:
 * {
 *  folders: {
 *   "foldername": { folders: {...} , files: [...] }
 *  },
 *  files: [ "filename1", "filename2" ]
 * }
 */
router.get('/', async (_, response) => {
    const rootFolder = readFolderRecursively(path.join(__dirname, '..', 'files'));
    response.send(rootFolder);
});

module.exports = router;