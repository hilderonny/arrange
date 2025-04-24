import express from 'express'
import * as db from './database/db.mjs'

db.init()

const app = express()
const port = 3000

app.use(express.static('public'))

app.listen(port, () => {
  console.log(`Example app listening on http://localhost:${port}`)
})