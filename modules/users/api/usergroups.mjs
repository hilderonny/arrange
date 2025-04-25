import { Router } from 'express'
const router = Router()

// URL /api/users/usergroups/list
router.get('/list', async(request, response) => {
    response.send(["ug1", "ug2"])
})

export { router }