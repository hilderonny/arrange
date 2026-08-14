export default {
    apis: {
        delete: {
            '/api/files/:userId/*filePath': './api/files/deletePath.mjs',
        },
        get: {
            '/api/autologin': './api/autologin.mjs',
            '/api/files/:userId/*filePath': './api/files/getPath.mjs',
            '/api/logout': './api/logout.mjs',
        },
        patch: {
            '/api/database/:databaseName': './api/database/patchDatabase.mjs',
        },
        post: {
            '/api/files/:userId/*filePath': './api/files/postFile.mjs',
            '/api/login': './api/login.mjs',
            '/api/register': './api/register.mjs',
        },
        put: {
            '/api/files/:userId/*directoryPath': './api/files/putDirectoryPath.mjs',
        },
    },
    crtFile: './server.crt',
    databasesPath:  './data/databases',
    filesPath:  './data/files',
    htmlPaths: {
        '/': './html',
    },
    keyFile:  './server.key',
    name: 'Meine App',
    port: 8443,
    tokenSecret: Math.random().toString(),
    usersJsonPath: './data/users/users.json',
    useSSL: true,
    useWebsockets: true,
}