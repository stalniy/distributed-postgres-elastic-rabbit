const { debounce } = require('lodash')
const createMq = require('../mq')
const createElastic = require('../elastic')

async function bulkSave(elastic, messages, ch) {
  const copied = messages.slice(0)
  messages.length = 0

  console.log(`going to process ${copied.length} materials`)

  const bulkBody = copied.reduce((body, { message }) => {
    const { id, ...material } = JSON.parse(message.content.toString())
    return body.concat(
      { index: { _id: id } },
      material
    )
  }, [])

  await elastic.bulk({
    index: 'materials',
    type: 'material',
    body: bulkBody
  })

  console.log(`${copied.length} materials have been indexed`)
  ch.ack(copied[copied.length - 1].message)
}

async function main() {
  const [elastic, mq] = await Promise.all([createElastic(), createMq()])
  const ch = await mq.channel()

  const batchSize = 100
  const tryToBulkSave = debounce(bulkSave, 500)
  const messages = []
  ch.assertQueue('event.material.created', { durable: true })
  await ch.consume('event.material.created', async (message) => {
    const now = Date.now()
    messages.push({ message, createdAt: now })

    if (messages.length >= batchSize) {
      tryToBulkSave.cancel()
      await bulkSave(elastic, messages, ch)
    } else {
      tryToBulkSave(elastic, messages, ch)
    }
  })

  console.log('listening for event.material.created')
}

main()
  .catch(console.error)