const { Client } = require('@elastic/elasticsearch')

module.exports = async () => {
  const client = new Client({ node: process.env.ELASTICSEARCH_URL })

  // await client.ping()
  return client
}