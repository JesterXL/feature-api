const request = require('request')

const { startServer, stopServer } = require('../src/app')

beforeEach(() => {
    return startServer()
})
afterEach(() => {
    return stopServer()
})

test('When I call the /users/list API, I should get a list of users', () => {
    return new Promise((success, failure) =>
            request.get('http://localhost:3000/users/list', (err, res, body) =>
                err
                ? failure(err)
                : success(body)
    ))
    .then(json => JSON.parse(json))
    .then(users => {
        expect(users.data[0].username).toBe('jesterxl')
    })
})
