export default (arrange) => {

    // Benutzergruppendetails und zugehörende Berechtigungen zurück geben
    arrange.webServer.get('/api/users/usergroupdetails/:usergroup_id', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('PERMISSION_ADMINISTRATION_USER')) return response.sendStatus(401)
        // Benutzergruppentabelle öffnen
        const usergroupsTable = arrange.database['users/usergroups']
        // Benutzergruppe laden
        const usergroupId = request.params.usergroup_id
        const usergroup = usergroupsTable[usergroupId]
        // Benutzergruppe nicht gefunden
        if (!usergroup) return response.sendStatus(404)
        // Berechtigungen ermitteln
        const permissionAssignmentsTable = arrange.database['users/permissionassignments']
        const assignedPermissionIds = permissionAssignmentsTable.filter(pa => pa.usergroupid === usergroupId).map(kvp => kvp[1].permissionid)
        // Rückgabe zusammenbasteln
        const usergroupToReturn = {
            id: usergroupId,
            name: usergroup.name,
            permissionids: assignedPermissionIds
        }
        response.send(usergroupToReturn)
    })

}