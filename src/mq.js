const amqp = require('amqplib')
const uuid = require('uuid/v1')

class Queue {
  static async connect(options) {
    const queue = new this()
    return queue.reconnect(options)
  }

  constructor() {
    this.mq = null
    this.channels = Object.create(null)
  }

  async reconnect(options) {
    if (this.mq) {
      await this.mq.close()
    }

    this.mq = await amqp.connect(options)
    this.channels = Object.create(null)
    return this
  }

  async channel(name = 'default') {
    if (!this.channels[name]) {
      this.channels[name] = await this.mq.createChannel()
    }

    return this.channels[name]
  }

  async exec(queue, payload) {
    const channel = await this.channel()
    const responseQueue = await channel.assertQueue('', { exclusive: true })
    const correlationId = uuid();
    
    channel.assertQueue(queue, { durable: true })
    console.log(`send command ${correlationId} to ${queue}`, payload)
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
      replyTo: responseQueue.queue,
      correlationId,
      persistent: true,
      noAck: false,
    })

    return new Promise(async (resolve) => {
      await channel.consume(responseQueue.queue, (message) => {
        console.log('received message: ', message.properties.correlationId)
        if (message.properties.correlationId === correlationId) {
          console.log(' [.] Got %s', message.content.toString());
          resolve(JSON.parse(message.content.toString()))
        }
      });
    })
  }
}

module.exports = async function createRabbit() {
  return Queue.connect({
    protocol: 'amqp',
    hostname: process.env.RABBITMQ_HOSTNAME,
    username: process.env.RABBITMQ_USERNAME,
    password: process.env.RABBITMQ_PASSWORD,
  })
}