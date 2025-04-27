import express from 'express'
import * as identifyUserMiddleware from './middlewares/identifyuser.mjs'

async function init(arrange) {
    // Tabelle für Benutzergruppen anlegen und befüllen
    const userGroupsTable = arrange.database['usergroups']
    userGroupsTable['USERGROUP_ADMIN'] = { name: 'Administratoren' }
    userGroupsTable.save()
    // Tabelle `users` für Benutzer wird bei der ersten Registrierung eines Benutzers angelegt
    // Tabelle `usergroupassignments` für Benutzerzuordnung zu Benutzergruppe wird bei der ersten Registrierung eines Benutzers angelegt
    // Tabelle für Berechtigungen anlegen und befüllen
    const permissionsTable = arrange.database['permissions']
    permissionsTable['PERMISSION_ADMINISTRATION_USER'] = { label: 'Benutzerverwaltung' }
    permissionsTable['PERMISSION_ADMINISTRATION_USERGROUP'] = { label: 'Benutzergruppenverwaltung' }
    permissionsTable.save()
    // Tabelle für Berechtigungszuordnungen anlegen und befüllen
    const permissionAssignmentsTable = arrange.database['permissionassignments']
    permissionAssignmentsTable['USERGROUP_ADMIN_PERMISSION_ADMINISTRATION_USER'] = { usergroupid: 'USERGROUP_ADMIN', permissionid: 'PERMISSION_ADMINISTRATION_USER', canread: true, canwrite: true }
    permissionAssignmentsTable['USERGROUP_ADMIN_PERMISSION_ADMINISTRATION_USERGROUP'] = { usergroupid: 'USERGROUP_ADMIN', permissionid: 'PERMISSION_ADMINISTRATION_USERGROUP', canread: true, canwrite: true }
    permissionAssignmentsTable.save()
 }
 
 async function publishMiddlewares(arrange) {
    // Benutzeridentifizierung
    arrange.webServer.use(identifyUserMiddleware.createMiddleware(arrange))
 }
 
 async function publishRoutes(arrange) {
    // HTML-Seiten aus Unterverzeichnis `./public` an URL `/modules/users` veröffentlichen
    arrange.webServer.use('/modules/users', express.static(`${import.meta.dirname}/public`))
 }
 
 export { init, publishMiddlewares, publishRoutes }
 