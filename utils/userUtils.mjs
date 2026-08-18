import fs from 'node:fs'

import config from '../config.mjs'
import path from 'node:path/posix'

const allUsers = JSON.parse(fs.readFileSync(config.usersJsonPath) || '[]')

export default {

    addUser(user) {
        allUsers.push(user)
    },

    createUserSession(request, userId) {
        request.session.userId = userId
    },

    deleteUser(user) {
        const index = allUsers.indexOf(user)
        if (index >= 0) {
            allUsers.splice(index, 1)
        }
    },

    getUserById(userId) {
        return allUsers.find(user => user.id === userId)
    },

    getUserForUsername(username) {
        return allUsers.find(user => user.username === username)
    },

    saveUsers() {
        fs.mkdirSync(path.dirname(config.usersJsonPath), { recursive: true })
        fs.writeFileSync(config.usersJsonPath, JSON.stringify(allUsers, null, '\t'))
    },

}
