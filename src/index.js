const { ApolloServer } = require('apollo-server');
const createSchema = require('./schema')
const createRabbit = require('./mq')
const createDb = require('./db')

Promise.all([
  createRabbit(),
  createDb(),
])
  .then((deps) => {
    const server = new ApolloServer({
      schema: createSchema(...deps),
      tracing: true
    })

    return server.listen(8000)
  })
  .then(() => console.log(`app server is listening on http://localhost:8000`))
  .catch(console.error)