require('dotenv').config()
const bodyParser = require('body-parser')
const express = require('express')
const cors = require('cors')
const db = require('./config/db')
const userRouter = require('./routes/routes')
const app = express()

db()
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(cors())
app.use('/user', userRouter)

app.listen(process.env.PORT, () => {
    console.log(`server works on http://localhost:${process.env.PORT}`)
})