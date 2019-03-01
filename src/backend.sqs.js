const debug = require('debug')('grpcq:sqs')
const kue = require('kue')
const _ = require('lodash')
const code = require('./constants.js')

AWS = require('aws-sdk')
AWS.config.setPromisesDependency(null)

// new AWS.SQS
//   accessKeyId: global.config.get 'aws.access_key_id'
//   secretAccessKey: global.config.get 'aws.secret_access_key'
//   region: 'ap-northeast-2'

const sqs_list = {}
const EventEmitter = require('events')
class MemoryBackendEmitter extends EventEmitter {}

class SQSDriver {
  constructor () {
    // this.sqs = null
  }
  generate_receipt_id (message) {
    return Date.now() + '-' + message.body.length
  }

  start (server_opt = {}) {
    debug('start %O', server_opt)
    this.get_client(server_opt)
  }

  async get_client (server_opt) {
    if(!server_opt.access_key_id)
      throw new Error('server_opt.access_key_id required by SQS backend.')
    if(!server_opt.secret_access_key)
      throw new Error('server_opt.secret_access_key required by SQS backend.')
    if(!server_opt.region)
      throw new Error('server_opt.region required by SQS backend.')
    if(!server_opt.prefix)
      throw new Error('server_opt.prefix required by SQS backend.')
    
    const key = server_opt.access_key_id + server_opt.region
    if(!sqs_list[key]){
      debug('SQS.prepare %O', server_opt)
      sqs_list[key] = {
        client: new AWS.SQS({
          accessKeyId: server_opt.access_key_id,
          secretAccessKey: server_opt.secret_access_key,
          region: server_opt.region,
          apiVersion: '2012-11-05'
        }),
        prefix: server_opt.prefix,
        queue_urls: [],
      }
      const res = await sqs_list[key].client.listQueues({QueueNamePrefix:sqs_list[key].prefix}).promise()
      if(res.data && res.data.QueueUrls)
        sqs_list[key].queue_urls = res.data.QueueUrls
      debug('res %O', res)
    }

    return sqs_list[key]
  }

  async subscribe (call) {
    try {
      // throw new Error("not impl")
      // debug('sub')
      const opt = JSON.parse(call.request.option)
      debug('server opt %O', call.request.server_option)
      const sqs = await this.get_client(call.request.server_option)
      debug('sqs %o', sqs)
      // debug('sqs %o', sqs)
      
      debug('SQS.ensure queue:'+opt.name)
      const matches = sqs.queue_urls.filter( e => {
        _.endsWith(e, '/' + opt.QueueName)
      })
      let queue_url = null
      if(matches.length == 0){
  
        const res = await sqs.client.createQueue({
          QueueName: call.request.server_option.prefix + opt.name,
        }).promise()
        // throw new Error('sdf')
        sqs.queue_urls.push(res.QueueUrl)
        queue_url = res.QueueUrl
      }else{
        queue_url = matches[0]
      }
      
      debug('SQS.receiveMessage queue:'+queue_url)
      
      const sqs2 = await this.get_client(call.request.server_option)
      const receive = async function () {
        const res = await sqs2.client.receiveMessage({
          QueueUrl: queue_url,
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 3,
        }).promise()
        
        debug('SQS got: %o', res)
        if(res && res.Messages){
          res.Messages.forEach( job => {
            call.write({
              // id: job.MessageId,
              id: job.ReceiptHandle,
              body: job.Body,
            })
          })
        }
        
        // loop
        process.nextTick(receive)
      }
      receive()

      // ping pong
      call.write({
        id: code.STATUS_PONG,
        body: '{}',
      })
    } catch (error) {
      call.write({
        id: code.STATUS_500,
        body: JSON.stringify({
          message: error.message,
        })
      })
    }
    
    // pong`
  }
  async publish (call, callback) {
    // throw new Error("not impl")
    const opt = JSON.parse(call.request.body)
    const sqs = await this.get_client(call.request.server_option)
    
    // call.request.id = this.generate_receipt_id(call.request)
    const QueueName = call.request.server_option.prefix + opt.name
    debug('SQS.ensure queue: %o', QueueName)
    debug('SQS.ensure queue_urls: %O', sqs.queue_urls)
    const matches = sqs.queue_urls.filter( e => {
      return _.endsWith(e, '/' + QueueName)
    })
    debug('SQS.ensure matches: %O', matches)
    if(matches.length == 0)
      throw new Error('Cannot found subscriber on that publish.')

    opt.QueueUrl = matches[0]

    const res = await sqs.client.sendMessage({
      QueueUrl: opt.QueueUrl,
      MessageBody: JSON.stringify(call.request.body),
    }).promise()
    debug('SQS.sendMessage queue: %O', res)

    if(res.Messages && res.Messages[0]){
      return callback(null, {
        // id: res.Messages[0].MessageId,
        id: res.Messages[0].ReceiptHandle,
      })
    }else{
      return callback(new Error('Failed to publish'))
    }
    
  }
  stop (opt = {}) {
    const key = opt.access_key_id + opt.region
    if(sqs_list[key]){
      sqs_list[key].client = null
      sqs_list[key] = null
    }
  }
}

module.exports = new SQSDriver()