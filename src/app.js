const express = require('express')
const { Pool } = require('pg')
const Result = require('folktale/result')
const { Ok } = Result
const Validation = require('folktale/validation')
const { Success, Failure } = Validation
const { get, partial, memoize, curry } = require('lodash/fp')

const getPool = () => new Pool()
const getPoolCached = memoize(getPool)

const validRows = o =>
    Array.isArray(o)
    ? Success(o)
    : Failure([`Invalid Rows: Postgres didn't return an Array of rows, instead returned: ${o}`])

const getUsers = pool =>
    pool.query('SELECT username,date FROM users;')
    .then(get('rows'))
    .then(validRows)
    .then(validation =>
        validation.matchWith({
           Failure: ({value}) => Result.Error(value),
           Success: ({value}) => Ok(value)
        }))
    .catch(error => Promise.resolve(
        Result.Error(`Postgres Error: ${get('message', error)}`)
    ))
const getUsersPartial = partial(getUsers, [getPoolCached()])

const sendError = res => error =>
    res.json({ result: false, error })

const sendOk = res => data =>
    res.json({ result: true, data })

const getUsersRoute = curry( (getUsersPartial, req, res) =>
    getUsersPartial()
    .then(result =>
        result.matchWith({
            Error: ({value}) => sendError(res)(value),
            Ok: ({value}) => sendOk(res)(value)
        })
    ))

const getUsersRoutePartial = getUsersRoute(getUsersPartial)

const addUsersListRoute = app => route =>
    Ok(
        app.get('/users/list', route)
    )

const listen = port => app =>
    Result.try(
        () => app.listen(port)
    )

let server
const startServer = getUsersRoutePartial => port => app =>
    addUsersListRoute(app)(getUsersRoutePartial)
    .chain(_ => listen(port)(app))
    .chain(newServer => {
        server = newServer
        return Result.Ok(server)
    })
    .matchWith({
        Error: ({value}) => Promise.reject(value),
        Ok: ({value}) => Promise.resolve(server)
    })
const startServerPartial = () => startServer(getUsersRoutePartial)(3000)(express())

const stopServer = pool =>
    pool.end()
    .then( _ => server.close())
const stopServerPartial = partial(stopServer, [getPoolCached()])

module.exports = {
    startServer: startServerPartial,
    stopServer: stopServerPartial
}
