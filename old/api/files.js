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
router.get('/', (_, response) => {
    const rootFolder = readFolderRecursively(path.join(__dirname, '..', 'files'));
    response.send(rootFolder);
});

/**
 * DELETE /api/files/filepath
 * 
 * Deletes a file or folder with the given filepath.
 * When the file or folder does not exist or cannot be deleted,
 * 400 is returned. Otherwise 200.
 * Folders are deleted recursively.
 * 
 * For example DELETE /api/files/myfolder/mysubfolder/myfile.txt deletes the file
 * ./files/myfolder/mysubfolder/myfile.txt
 * DELETE /api/files/myfolder deletes the folder ./files/myfolder and ist entire content
 */
router.delete('/*', (request, response) => {
    const filepath = path.join(__dirname, '..', 'files', request.params[0]);
    if (fs.statSync(filepath).isDirectory()) {
        fs.rmdir(filepath, { recursive: true }, (error) => {
            if (error) {
                response.sendStatus(400);
            } else {
                response.sendStatus(200);
            }
        });
    } else {
        fs.unlink(filepath, (error) => {
            if (error) {
                response.sendStatus(400);
            } else {
                response.sendStatus(200);
            }
        });
    }
});

/**
 * POST /api/files/filepath
 * 
 * Uploads one file with multipart formdata to the given filepath. The name of the original file gets ignored.
 * Missing intermediate directories get created. Existing files get overwritten.
 * 
 * When sending a file myfile.txt to POST /api/files/myfolder/mysubfolder/namemesomething.txt the uploaded file will be
 * renamed to namemesomething.txt and gets stored in the ./files/myfolder/mysubfolder directory.
 */
router.post('/*', (request, response) => {
    const filepath = path.join(__dirname, '..', 'files', request.params[0]);
    console.log(filepath, request.files);
    if (!request.files || Object.keys(request.files).length !== 1) {
        return response.sendStatus(400);
    } else {
        const fileInfo = Object.values(request.files)[0];
        const baseDirectory = path.dirname(filepath);
        if (!fs.existsSync(baseDirectory)) {
            fs.mkdirSync(baseDirectory, { recursive: true });
        }
        fileInfo.mv(filepath, function(error) {
            if (error) {
                console.log(error);
                response.sendStatus(400);
            } else {
                response.sendStatus(200);
            }
        });
    }
});

module.exports = router;