export default {
    apis: {
        delete: {
            '/api/database/:databaseName/:tableName': './api/database/deleteDatabaseTable.mjs',
            '/api/database/:databaseName/:tableName/:recordId': './api/database/deleteDatabaseRecord.mjs',
            '/api/files/:userId/*filePath': './api/files/deletePath.mjs',
        },
        get: {
            '/api/autologin': './api/autologin.mjs',
            '/api/files/:userId/*filePath': './api/files/getPath.mjs',
            '/api/logout': './api/logout.mjs',
            '/api/player/status/:userId': './api/player/getPlayerStatus.mjs',
        },
        patch: {
            '/api/database/:databaseName': './api/database/patchDatabase.mjs',
            '/api/database/:databaseName/:tableName/:recordId': './api/database/patchDatabaseRecord.mjs',
        },
        post: {
            '/api/database/:databaseName': './api/database/postDatabaseQuery.mjs',
            '/api/files/:userId/*filePath': './api/files/postFile.mjs',
            '/api/login': './api/login.mjs',
            '/api/player/addcoins/:userId/:coinsToAdd': './api/player/postAddCoins.mjs',
            '/api/player/addexperience/:userId/:experienceToAdd': './api/player/postAddExperience.mjs',
            '/api/player/removecoins/:userId/:coinsToRemove': './api/player/postRemoveCoins.mjs',
            '/api/register': './api/register.mjs',
        },
        put: {
            '/api/files/:userId/*directoryPath': './api/files/putDirectoryPath.mjs',
        },
    },
    crtFile: './server.crt',
    databases: {
        Player: {
            PlayerStatus: {
                Coins: 'INTEGER',
                Experience: 'INTEGER',
                Level: 'INTEGER',
                UserId: 'TEXT',
            },
        },
    },
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