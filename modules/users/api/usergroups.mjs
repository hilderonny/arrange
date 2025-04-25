import { Router } from 'express'
const router = Router()

// URL /api/users/usergroups/list
router.get('/list', async(request, response) => {

    console.log('API USERGROUPS/LIST')

    response.send(["ug1", "ug2"])

})

function register(register_callback) {

}

export { router }