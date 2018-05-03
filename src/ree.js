const debug = require('debug')('grpcq:ree')

const EventEmitter = require('events')
const AWS = require('aws-sdk')
AWS.config.setPromisesDependency(null)

class RemoteEventEmitter extends EventEmitter {
  constructor (opt = {}) {
    super()
    
    this.opt = opt
    this.client = null
  }

  async publish(name, opt) {
    // sqs sendMessage
    const message = Object.assign(this.opt.publish, {
      MessageBody: JSON.stringify({
        name: name,
        opt: opt,
      })
    })
    const res = await this.client.sendMessage(message).promise()
    debug('SQS.sendMessage queue: %O', res)
    return res
  }

  async subscribe() {
    // sqs
    this.client = new AWS.SQS(this.opt.init)
    // this._emit('ready')
    const that = this
    
    // receiveMessage
    const receive = async function () {
      debug('recv')
      try {
        const res = await that.client.receiveMessage(that.opt.subscribe).promise()
        // debug('SQS got: %o', res)
        if(res && res.Messages){
          for (const job of res.Messages) {
            // debug('job', job)
            const MessageBody = JSON.parse(job.Body)
            that.emit(MessageBody.name, MessageBody.opt)
            
            await that.client.deleteMessage({
              QueueUrl: that.opt.subscribe.QueueUrl,
              ReceiptHandle: job.ReceiptHandle,
            }).promise()
          }
        }      
        // loop
        process.nextTick(receive)  
      } catch (error) {
        debug('>', error)
        that.emit('error', error)
      }
      
    }
    receive()

    return
  }
}

module.exports = RemoteEventEmitter