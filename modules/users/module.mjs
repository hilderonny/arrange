import express from 'express'
import fs from 'node:fs'
import * as identifyUserMiddleware from './middlewares/identifyuser.mjs'

async function init(arrange) {
    // Tabelle für Benutzergruppen anlegen und befüllen
    const userGroupsTable = arrange.database['users/usergroups']
    userGroupsTable['USERGROUP_ADMIN'] = { name: 'Administratoren' }
    userGroupsTable.save()
    // Tabelle `users` für Benutzer wird bei der ersten Registrierung eines Benutzers angelegt
    // Tabelle `usergroupassignments` für Benutzerzuordnung zu Benutzergruppe wird bei der ersten Registrierung eines Benutzers angelegt
    // Tabelle für Berechtigungen anlegen und befüllen
    const permissionsTable = arrange.database['users/permissions']
    permissionsTable['PERMISSION_ADMINISTRATION_USER'] = { name: 'Benutzerverwaltung' }
    permissionsTable.save()
    // Tabelle für Berechtigungszuordnungen anlegen und befüllen
    const permissionAssignmentsTable = arrange.database['users/permissionassignments']
    permissionAssignmentsTable['USERGROUP_ADMIN_PERMISSION_ADMINISTRATION_USER'] = { usergroupid: 'USERGROUP_ADMIN', permissionid: 'PERMISSION_ADMINISTRATION_USER' }
    permissionAssignmentsTable.save()
    // Apps registrieren
    arrange.apps.push({ id: 'users-users', name: 'Benutzerverwaltung', icon: '/modules/users/images/group.png', url: '/modules/users/usermanagement.html', permission: 'PERMISSION_ADMINISTRATION_USER' })
}

async function publishMiddlewares(arrange) {
    // Benutzeridentifizierung
    arrange.webServer.use(identifyUserMiddleware.createMiddleware(arrange))
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
 