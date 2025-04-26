import express from 'express'
import * as identifyUserMiddleware from './middlewares/identifyuser.mjs'

async function init(arrange) {
    // Tabelle für Benutzergruppen anlegen
    arrange.databaseHelper.createTable('usergroups')
    arrange.databaseHelper.udpateDatabaseField('usergroups', 'name', 'text')
    arrange.databaseHelper.updateDatabaseRecord('usergroups', { id: 'USERGROUP_ADMIN', name: 'Administratoren' })
    // Tabelle für Benutzer anlegen
    arrange.databaseHelper.createTable('users')
    arrange.databaseHelper.udpateDatabaseField('users', 'name', 'text')
    arrange.databaseHelper.udpateDatabaseField('users', 'password', 'text')
    arrange.databaseHelper.udpateDatabaseField('users', 'usergroupid', 'text')
    // Tabelle für Berechtigungen anlegen
    arrange.databaseHelper.createTable('permissions')
    arrange.databaseHelper.udpateDatabaseField('permissions', 'label', 'text')
    arrange.databaseHelper.updateDatabaseRecord('permissions', { id: 'PERMISSION_ADMINISTRATION_USER', label: 'Benutzerverwaltung' })
    arrange.databaseHelper.updateDatabaseRecord('permissions', { id: 'PERMISSION_ADMINISTRATION_USERGROUP', label: 'Benutzergruppenverwaltung' })
    // Tabelle für Berechtigungszuordnungen anlegen
    arrange.databaseHelper.createTable('permissionassignments')
    arrange.databaseHelper.udpateDatabaseField('permissionassignments', 'usergroupid', 'text')
    arrange.databaseHelper.udpateDatabaseField('permissionassignments', 'permissionid', 'text')
    arrange.databaseHelper.udpateDatabaseField('permissionassignments', 'canread', 'integer')
    arrange.databaseHelper.udpateDatabaseField('permissionassignments', 'canwrite', 'integer')
    arrange.databaseHelper.updateDatabaseRecord('permissionassignments', { id: 'USERGROUP_ADMIN_PERMISSION_ADMINISTRATION_USER', usergroupid: 'USERGROUP_ADMIN', permissionid: 'PERMISSION_ADMINISTRATION_USER', canread: true, canwrite: true })
    arrange.databaseHelper.updateDatabaseRecord('permissionassignments', { id: 'USERGROUP_ADMIN_PERMISSION_ADMINISTRATION_USERGROUP', usergroupid: 'USERGROUP_ADMIN', permissionid: 'PERMISSION_ADMINISTRATION_USERGROUP', canread: true, canwrite: true })
 }
 
 async function publishMiddlewares(arrange) {
    // Benutzeridentifizierung
    arrange.app.use(identifyUserMiddleware.createMiddleware(arrange))
 }
 
 async function publishRoutes(arrange) {
    // HTML-Seiten aus Unterverzeichnis `./public` an URL `/modules/users` veröffentlichen
    arrange.app.use('/modules/users', express.static(`${import.meta.dirname}/public`))
 }
 
 export { init, publishMiddlewares, publishRoutes }
 