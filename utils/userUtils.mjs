import fs from 'node:fs'

import config from '../config.mjs'

const allUsers = JSON.parse(fs.readFileSync(config.usersJsonPath))

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

    getUserForUsername(username) {
        return allUsers.find(user => user.username === username)
    },

    saveUsers() {
        fs.writeFileSync(config.usersJsonPath, JSON.stringify(allUsers, null, '\t'))
    },

}
