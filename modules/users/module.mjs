import express from 'express'
import fs from 'node:fs'

async function init(arrange) {
    // Tabelle `users` für Benutzer wird bei der ersten Registrierung eines Benutzers angelegt
    // Tabelle für Berechtigungen anlegen und befüllen
    const permissionsTable = arrange.database['users/permissions']
    if (!permissionsTable['USERS_ADMINISTRATION_USER']) permissionsTable['USERS_ADMINISTRATION_USER'] = { name: 'Benutzerverwaltung' }
    permissionsTable.save()
    // Tabelle für Benutzergruppen anlegen und befüllen
    const userGroupsTable = arrange.database['users/usergroups']
    if (!userGroupsTable['USERGROUP_ADMIN']) userGroupsTable['USERGROUP_ADMIN'] = { name: 'Administratoren', permissionids: [ 'USERS_ADMINISTRATION_USER' ] }
    userGroupsTable.save()
    // Apps registrieren
    const appTable = arrange.database['home/apps']
    if (!appTable['USERS_USERMANAGEMENT']) appTable['USERS_USERMANAGEMENT'] = { name: 'Benutzerverwaltung', icon: '/modules/users/images/group.png', url: '/modules/users/usermanagement.html', index: 20000, permissionid: 'USERS_ADMINISTRATION_USER' }
    appTable.save()
}

async function publishMiddlewares(arrange) {
    // Benutzeridentifizierung
    arrange.webServer.use((await import('./middlewares/identifyuser.mjs')).default(arrange))
}

async function publishRoutes(arrange) {
    // HTML-Seiten aus Unterverzeichnis `./public` an URL `/modules/users` veröffentlichen
    arrange.webServer.use('/modules/users', express.static(`${import.meta.dirname}/public`))
    // Alle APIs laden
    for (const fileName of fs.readdirSync('./modules/users/api')) {
        if (fileName.endsWith('.mjs')) {
            arrange.log('[MODULE USERS] Lade API %s.', fileName)
            const api = await import(`./api/${fileName}`)
            api.default(arrange)
        }
    }
}

export { init, publishMiddlewares, publishRoutes }
 