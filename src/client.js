/*
 * ## [src/client.js](https://github.com/grpcq/grpcq/blob/master/src/client.js)
 * 
 * ...
 */

const grpc = require('grpc')
const debug = require('debug')('grpcq')
const verbose_message = require('debug')('grpcq:verbose')
const code = require('./constants.js')
const version = require('./version.js')
const backends = {
  sqs: require('./backend.sqs.js'),
  memory: require('./backend.memory.js'),
}

const default_listener_on_error = (error) => {
  console.error('[grpcq] Uncaught, unspecified "error" event: ', error)  
}

class gRPCQueue {
  constructor (opt = {}) {
    this.type = opt.type
    this.version = 1
    this.endpoint = 'localhost:50051'
    this.grpcCredential = opt.grpcCredential || grpc.credentials.createInsecure()
    this._services = {}
  }

  service_key (version, endpoint) {
    return version + '://' + endpoint
  }

  subscribe (opt = {}) {
    opt.type = opt.type || this.type
    opt.version = opt.version || this.version
    opt.endpoint = opt.endpoint || this.endpoint
    opt.timeout = opt.timeout || this.timeout
    opt.max_retry = opt.max_retry || this.max_retry
    opt.deadletter = opt.deadletter || this.deadletter
    opt.grpcCredential = opt.grpcCredential || grpc.credentials.createInsecure()

    if (!opt.type) 
      throw new Error('options.type undefined')
    
    const key = this.service_key(opt.version, opt.endpoint)
    debug('service key %s', key)
    if(!this._services[key]){
      const api = version(opt.version)
      this._services[key] = new api.Queue(opt.endpoint, opt.grpcCredential)
      debug('new client %O', opt)
    }
    
    const stream = this._services[key].subscribe({
      version: String(opt.version || this.version),
      option: JSON.stringify(opt),
    })
    stream
      .on('data', (message, a) => {
        console.log('>>>>>>>>>', message)
        verbose_message('stream:data %O', message)
        verbose_message('stream:data %O', a)
        if(message.id == code.STATUS_PONG){
          return stream.emit('active')
        }
        const json = JSON.parse(message.body || '{"message":"empty body"}')
        if(!message.id || message.id === code.STATUS_500){
          // check error
          if(stream.listeners('error').length === 0){
            // set default if no error handler
            stream.on('error', default_listener_on_error)
          }
          return stream.emit('error', json)
        }
        stream.emit('message', json)
      })
    return stream
  }

  async publish (opt = {}) {
    opt.type = opt.type || this.type
    opt.version = opt.version || this.version
    opt.endpoint = opt.endpoint || this.endpoint
    opt.timeout = opt.timeout || this.timeout
    opt.max_retry = opt.max_retry || this.max_retry
    opt.deadletter = opt.deadletter || this.deadletter
    opt.grpcCredential = opt.grpcCredential || this.grpcCredential

    if (!opt.type) 
      throw new Error('options.type undefined')
    
    const key = this.service_key(opt.version, opt.endpoint)
    debug('service key %s', key)
    if(!this._services[key]){
      const api = version(opt.version)
      this._services[key] = new api.Queue(opt.endpoint, opt.grpcCredential)
      debug('new client %O', opt)
    }
    
    return new Promise((resolve, reject) => {
      try {
        this._services[key].publish({
          version: String(opt.version || this.version),
          body: JSON.stringify(opt),
        }, (err, MessageReceipt) => {
          if(err)
            return reject(new Error(err.message))

          return resolve(MessageReceipt)
        })
      } catch (error) {
        return reject(error)
      }
    })
  }
}
module.exports = new gRPCQueue()

module.exports.defaults = opt => {
  return new gRPCQueue(opt)
}