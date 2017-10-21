const assert = require('chai').assert

describe('grpcq client', () => {
  describe('vanila', () => {
    it('ping pong', (done) => {
      /*
       * > npm test -- --grep="vanila ping pong"
       */
      const grpcq = require('../index.js')
      const server = grpcq.createServer({
        bindAddress: '0.0.0.0:50051',
        backend: 'kue',
        jobEvents: true,
        prefix: 'grpcq',
        redis: {
          port: 6379,
          host: 'localhost',
        }
      })
      let didForceShutdown = false
      after(function(){
        didForceShutdown = true
        server.forceShutdown()
      })
      server.start()

      try {
        const grpc = require('grpc')
        const descriptor = grpc.load(`./tests/queue.proto`)
        const api = descriptor.grpcq
        const queue = new api.Queue('registry.grpcq.io:50051', grpc.credentials.createInsecure())
  
        const subscription = queue.subscribe({
          version:'1', 
          option: JSON.stringify({
            name: 'find reservation',
            type: 'kue',
          })
        })
        subscription.on('data', function (message) {
          if(message.id == '-PONG'){
            subscription.emit('ready')
            return 
          }else if(message.id[0] === '-'){
            done(new Error('message received error code'))
            return
          }
          console.log('IN >', message)
          done()
          return
        }).on('ready', () => {
          queue.publish({
            version:'1', 
            body: JSON.stringify({
              name: 'find reservation',
              type: 'kue',
              data: 'any ' + Date.now(),
            })
          }, (err, MessageReceipt) => {
            console.log('MessageReceipt: ', MessageReceipt)
          })
        })
      } catch (error) {
        done(error)
      }
    }).timeout(10000)
  })
})