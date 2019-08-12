const createDb = require('../db')
const createMq = require('../mq')

async function createMaterial(db, material, { commandId }) {
  return db.transaction(async (trx) => {
    const [id] = await db('materials')
      .transacting(trx)
      .insert(material)
      .returning('id')

    await db('processed_commands')
      .transacting(trx)
      .insert({ id: commandId })
    
    return { id, ...material }
  })
}

async function main() {
  const [db, mq] = await Promise.all([createDb(), createMq()])
  const ch = await mq.channel()

  ch.assertQueue('command.material.create', { durable: true })
  await ch.consume('command.material.create', async (message) => {
    const commandId = message.properties.correlationId
    const vars = JSON.parse(message.content.toString())
    const wasProcessed = await db.select(db.raw('1'))
      .from('processed_commands')
      .where('id', '=', message.properties.correlationId)
      .first()

    console.log('check if command was processed: ', wasProcessed)
    console.log(`received`, vars, `going to reply to ${message.properties.replyTo}`)

    let material
    if (!wasProcessed) {
      // TODO: send error to the same queue
      material = await createMaterial(db, vars.data, { commandId })
    }

    if (material) {
      const payload = Buffer.from(JSON.stringify(material))
      // TODO: if worker fails in this place we need to send an event
      //       so events must be saved together with command
      ch.sendToQueue(message.properties.replyTo, payload, {
        correlationId: commandId
      })
      console.log('emit event', material)
      ch.assertQueue('event.material.created', { durable: true })
      ch.sendToQueue('event.material.created', payload, {
        persistent: true,
        noAck: false,
      })
    }

    ch.ack(message);

    console.log('material has been created')
  })

  console.log('listening for command.material.create')
}

main()
  .catch(console.error)