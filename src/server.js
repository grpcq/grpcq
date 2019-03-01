/*
 * ## [src/server.js](https://github.com/grpcq/grpcq/blob/master/src/server.js)
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
  kue: require('./backend.kue.js'),
  memory: require('./backend.memory.js'),
}

class gRPCQueueServer {
  createServer (opt = {}) {
    this.opt = opt
    if(!backends[opt.backend])
      throw new Error('Not supported backend=' + opt.backend)
    
    const api = version()
    const server = new grpc.Server()
    server.addService(api.Queue.service, {
      subscribe: (call) => {
        debug('[server] subscribe > %o', call.request)
        const request = JSON.parse(call.request.option)
        const backend = String(request.type)
        
        try {
          if(!backends[backend])
            throw new Error('Backend not supported ' + backend)
          
          if(!backends[backend].subscribe)
            throw new Error('Backend subscribe not implemented')
          
          call.request.server_option = this.opt
          backends[backend].subscribe(call)
          // call.write({
          //   id: code.STATUS_PONG,
          //   body: '{}',
          // })
        } catch (error) {
          call.write({
            id: code.STATUS_500,
            body: JSON.stringify({
              message: error.message,
            }),
          })
          call.end()
        }
      },
      publish: (call, callback) => {
        debug('[server] publish > %o', call.request)
        const request = JSON.parse(call.request.body)
        const backend = String(request.type)
        
        if(!backends[backend])
          return callback(new Error('Backend not supported ' + backend))
        
        if(!backends[backend].publish)
          return callback(new Error('Backend publish not implemented'))
        
        call.request.server_option = this.opt
        backends[backend].publish(call, callback)
        // .catch()
      },
    })

    opt.bindAddress = opt.bindAddress || '0.0.0.0:50051'
    opt.grpcServerCredential = opt.grpcServerCredential || grpc.ServerCredentials.createInsecure()
    server.bind(opt.bindAddress, opt.grpcServerCredential)
    debug('[server] listening on ' + opt.bindAddress)
    server._start = server.start
    server.start = () => {
      backends[opt.backend].start(opt)
      server._start()
    }
    server._forceShutdown = server.forceShutdown
    server.forceShutdown = () => {
      backends[opt.backend].stop(opt)
      server._forceShutdown()
    }
    return server
  }
}

module.exports = new gRPCQueueServer()