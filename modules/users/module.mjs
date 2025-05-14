import path from 'node:path'

async function init(arrange) {
    // Tabelle `users` für Benutzer wird bei der ersten Registrierung eines Benutzers angelegt
    // Tabelle für Berechtigungen anlegen und befüllen
    const permissionsTable = arrange.database['users/permissions']
    if (!permissionsTable.get('USERS_ADMINISTRATION_USER')) permissionsTable.push({ id: 'USERS_ADMINISTRATION_USER', name: 'Benutzerverwaltung' })
    permissionsTable.save()
    // Tabelle für Benutzergruppen anlegen und befüllen
    const userGroupsTable = arrange.database['users/usergroups']
    if (!userGroupsTable.get('USERGROUP_ADMIN')) userGroupsTable.push({ id: 'USERGROUP_ADMIN', name: 'Administratoren', permissionids: [ 'USERS_ADMINISTRATION_USER' ] })
    userGroupsTable.save()
    // Apps registrieren
    const appTable = arrange.database['home/apps']
    if (!appTable.get('USERS_USERMANAGEMENT')) appTable.push({ id: 'USERS_USERMANAGEMENT', name: 'Benutzerverwaltung', icon: '/modules/users/images/group.png', url: '/modules/users/usermanagement.html', index: 20000, permissionid: 'USERS_ADMINISTRATION_USER' })
    appTable.save()
}

async function publishMiddlewares(arrange) {
    // Benutzeridentifizierung
    arrange.webServer.use((await import('./middlewares/identifyuser.mjs')).default(arrange))
}

async function publishRoutes(arrange) {
    // HTML-Seiten aus Unterverzeichnis `./public` an URL `/modules/users` veröffentlichen
    arrange.webServer.use('/modules/users', arrange.express.static(`${import.meta.dirname}/public`))
    // Alle APIs erstellen
    arrange.apiHelper.createListApi(arrange, 'users/users', '/api/users/listusers', [ 'USERS_ADMINISTRATION_USER' ])
    arrange.apiHelper.createListApi(arrange, 'users/usergroups', '/api/users/listusergroups', [ 'USERS_ADMINISTRATION_USER' ])
    arrange.apiHelper.createListApi(arrange, 'users/permissions', '/api/users/listpermissions', [ 'USERS_ADMINISTRATION_USER', 'HOME_APPMANAGEMENT' ])
    arrange.apiHelper.createSaveApi(arrange, 'users/permissions', '/api/users/savepermission', [ 'USERS_ADMINISTRATION_USER' ])
    arrange.apiHelper.createSaveApi(arrange, 'users/users', '/api/users/saveuser', [ 'USERS_ADMINISTRATION_USER' ])
    arrange.apiHelper.createSaveApi(arrange, 'users/usergroups', '/api/users/saveusergroup', [ 'USERS_ADMINISTRATION_USER' ])
    arrange.apiHelper.createDeleteApi(arrange, 'users/users', '/api/users/deleteuser', [ 'USERS_ADMINISTRATION_USER' ])
    arrange.apiHelper.createDeleteApi(arrange, 'users/usergroups', '/api/users/deleteusergroup', [ 'USERS_ADMINISTRATION_USER' ])
    await arrange.apiHelper.loadApis(arrange, path.resolve(import.meta.dirname, './api'))
}

export { init, publishMiddlewares, publishRoutes }