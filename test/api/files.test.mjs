import path from 'node:path'
import fs from 'node:fs'
import { beforeEach, describe, it } from 'node:test'
import supertest from 'supertest'
import ExpressApplication from '../../ExpressApplication.mjs'
import assert from 'node:assert'

describe('API /api/files', () => {

    let expressApplication
    let userId

    beforeEach(async () => {
        const dataPath = './test/data'
        const fullPath = path.resolve(dataPath)
        if (fs.existsSync(fullPath)) {
            fs.rmSync(fullPath, { recursive: true })
        }
        expressApplication = new ExpressApplication(
            dataPath,
            './test/html', // htmlPath
            'test_secret', // tokenSecret
        )
        // Benutzer anlegen
        const response = await supertest(expressApplication.app).post('/api/register').send({ username: 'testusername', password: 'testpassword' }).expect(200)
        userId = response.body.id
    })

    describe('DELETE /api/files/:userId/*filePath', () => {

        it('Wenn es kein Verzeichnis für den Benutzer gibt, wird HTTP Status Code 404 zurückgegeben.', async () => {
            await supertest(expressApplication.app).delete(`/api/files/${userId}`).expect(404)
        })

        it('Wenn es im Benutzerverzeichnis den Pfad nicht gibt, wird HTTP Status Code 404 zurückgegeben.', async () => {
            fs.mkdirSync(path.resolve('./test/data/files/', userId), { recursive: true })
            await supertest(expressApplication.app).delete(`/api/files/${userId}/not/existing/path`).expect(404)
        })

        it('Wenn der Pfad auf ein Verzeichnis verweist, wird dessen Inhalt rekursiv gelöscht.', async () => {
            const parentPath = path.resolve(`./test/data/files/${userId}/existing/path/`)
            fs.mkdirSync(path.resolve(parentPath, 'directory_1/subdirectory'), { recursive: true })
            fs.writeFileSync(path.resolve(parentPath, 'directory_1/file_0.ext0'), 'File 0 content')
            fs.writeFileSync(path.resolve(parentPath, 'file_1.ext1'), 'File 1 content')
            fs.writeFileSync(path.resolve(parentPath, 'file_2.ext2'), 'File 2 content')
            await supertest(expressApplication.app).delete(`/api/files/${userId}/existing/path/`).expect(200)
            const directoryExists = fs.existsSync(parentPath)
            assert.strictEqual(directoryExists, false)
        })

        it('Wenn der Pfad auf eine Datei verweist, wird diese Datei gelöscht.', async () => {
            const parentPath = path.resolve(`./test/data/files/${userId}/existing/path/`)
            fs.mkdirSync(parentPath, { recursive: true })
            const filePath = path.resolve(parentPath, 'file_1.ext1')
            fs.writeFileSync(filePath, 'File 1 content')
            await supertest(expressApplication.app).delete(`/api/files/${userId}/existing/path/file_1.ext1`).expect(200)
            const fileExists = fs.existsSync(filePath)
            assert.strictEqual(fileExists, false)
        })
    
    })

    describe('GET /api/files/:userId/*filePath', () => {

        it('Wenn es kein Verzeichnis für den Benutzer gibt, wird HTTP Status Code 404 zurückgegeben.', async () => {
            await supertest(expressApplication.app).get(`/api/files/${userId}`).expect(404)
        })

        it('Wenn es im Benutzerverzeichnis den Pfad nicht gibt, wird HTTP Status Code 404 zurückgegeben.', async () => {
            fs.mkdirSync(path.resolve('./test/data/files/', userId), { recursive: true })
            await supertest(expressApplication.app).get(`/api/files/${userId}/not/existing/path`).expect(404)
        })

        it('Wenn der Pfad auf ein Verzeichnis verweist, wird dessen Inhalt als JSON-Array mit name und type zurückgegeben.', async () => {
            const parentPath = path.resolve(`./test/data/files/${userId}/existing/path/`)
            fs.mkdirSync(path.resolve(parentPath, 'directory_1/subdirectory'), { recursive: true })
            fs.writeFileSync(path.resolve(parentPath, 'file_1.ext1'), 'File 1 content')
            fs.writeFileSync(path.resolve(parentPath, 'file_2.ext2'), 'File 2 content')
            const response = await supertest(expressApplication.app).get(`/api/files/${userId}/existing/path/`).expect(200)
            const fileList = response.body
            assert.ok(fileList)
            assert.strictEqual(fileList.length, 3)
            fileList.sort((file1, file2) => { file1.name.localeCompare(file2.name) })
            assert.strictEqual(fileList[0].name, 'directory_1')
            assert.strictEqual(fileList[0].type, 'dir')
            assert.strictEqual(fileList[1].name, 'file_1.ext1')
            assert.strictEqual(fileList[1].type, 'file')
            assert.strictEqual(fileList[2].name, 'file_2.ext2')
            assert.strictEqual(fileList[2].type, 'file')
        })

        it('Wenn der Pfad auf eine Datei verweist, wird diese Datei heruntergeladen.', async () => {
            const parentPath = path.resolve(`./test/data/files/${userId}/existing/path/`)
            fs.mkdirSync(parentPath, { recursive: true })
            fs.writeFileSync(path.resolve(parentPath, 'file_1.ext1'), 'File 1 content')
            const response = await supertest(expressApplication.app).get(`/api/files/${userId}/existing/path/file_1.ext1`).expect(200)
            assert.strictEqual(response.type, 'application/octet-stream')
            assert.strictEqual(response.body.toString(), 'File 1 content')
        })
    
    })

    describe('PUT /api/files/:userId/*directoryPath', () => {

        it('Es wird HTTP Status 200 zurückgegeben.', async () => {
            const parentPath = path.resolve(`./test/data/files/${userId}/existing/path/`)
            fs.mkdirSync(parentPath, { recursive: true })
            await supertest(expressApplication.app).put(`/api/files/${userId}/existing/path/directory/to/create`).expect(200)
        })

        it('Wenn das Verzeichnis noch nicht existiert, wird es rekursiv angelegt.', async () => {
            const parentPath = path.resolve(`./test/data/files/${userId}/existing/path/`)
            fs.mkdirSync(parentPath, { recursive: true })
            await supertest(expressApplication.app).put(`/api/files/${userId}/existing/path/directory/to/create`)
            const directoryExists = fs.existsSync(path.resolve(parentPath, 'directory/to/create'))
            assert.strictEqual(directoryExists, true)
        })

        it('Wenn das Verzeichnis bereits existiert, passiert nichts weiter.', async () => {
            const parentPath = path.resolve(`./test/data/files/${userId}/existing/path/`)
            fs.mkdirSync(parentPath, { recursive: true })
            await supertest(expressApplication.app).put(`/api/files/${userId}/existing/path/`).expect(200)
            await supertest(expressApplication.app).put(`/api/files/${userId}/existing/path`).expect(200)
            const directoryExists = fs.existsSync(parentPath)
            assert.strictEqual(directoryExists, true)
            const directoryStats = fs.statSync(parentPath)
            assert.ok(directoryStats.isDirectory())
        })

        it('Wenn der Zielpfad eine existierende Datei ist, passiert nichts weiter.', async () => {
            const parentPath = path.resolve(`./test/data/files/${userId}/existing/path/`)
            fs.mkdirSync(parentPath, { recursive: true })
            const filePath = path.resolve(parentPath, 'file_1.ext1')
            fs.writeFileSync(filePath, 'File 1 content')
            await supertest(expressApplication.app).put(`/api/files/${userId}/existing/path/file_1.ext1`).expect(200)
            const fileExists = fs.existsSync(filePath)
            assert.strictEqual(fileExists, true)
            const fileStats = fs.statSync(filePath)
            assert.ok(fileStats.isFile())
        })
    
    })

})
