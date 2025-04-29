export default (arrange) => {

    // Berechtigung löschen
    arrange.webServer.delete('/api/users/deletepermission/:permission_id', async(request, response) => {
        // Benutzerberechtigung prüfen
        if (!request.user || !request.user.hasPermission('PERMISSION_ADMINISTRATION_USER')) return response.sendStatus(401)
        const permissionId = request.params.permission_id
        // Berechtigungstabelle öffnen
        const permissionsTable = arrange.database['users/permissions']
        if (permissionsTable[permissionId]) {
            delete permissionsTable[permissionId]
            permissionsTable.save()
        }
        // Berechtigungszuordnungstabelle bereinigen
        const permissionAssignmentsTable = arrange.database['users/permissionassignments']
        const permissionAssignments = permissionAssignmentsTable.filter(pa => pa.permissionid === permissionId)
        if (permissionAssignments.length > 0) {
            permissionAssignments.forEach(kvp => delete permissionAssignmentsTable[kvp[0]])
            permissionAssignmentsTable.save()
        }
        response.sendStatus(200)
    })

}