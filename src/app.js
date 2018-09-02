const express = require('express')
const app = express()
const { Pool } = require('pg')
const pool = new Pool()

app.get('/users/list', (req, res) => {
    return pool.query('SELECT username,date FROM users;')
    .then(result => result.rows)
    .then(users => {
        res.json({result: true, data: users})
    })
    .catch(err => {
        res.json({result: false, error: err.message})
    })
})

let server

const startServer = () => {
    return new Promise( resolve => {
        server = app.listen(3000, () => {
            resolve(server)
        })
    })
}
const stopServer = () =>
    pool.end()
    .then(() => {
        return new Promise((success, failure) => {
            server.close( err => {
                if(err) {
                    return failure(err)
                }
                success()
            })
        })
    })

module.exports = {
    startServer,
    stopServer
}
