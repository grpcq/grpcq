const assert = require('chai').assert

describe('grpcq client', () => {
  /*
   * ##### `npm test -- --grep="grpcq client"`
   * 
   */
  describe('local', () => {
    it('require', async () => {
      /*
       * > npm test -- --grep="local require"
       */
      const grpcq = require('../index.js')
      assert.isObject(grpcq)
      assert.property(grpcq, 'createServer')
      assert.property(grpcq, 'subscribe')
      assert.property(grpcq, 'publish')
    }).timeout(10000)

    it('ping pong with memory backend', function (done) {
      /*
       * > npm test -- --grep="ping pong with memory backend"
       */
      const grpcq = require('../index.js')
      const server = grpcq.createServer({
        backend: 'memory',
      })
      let didForceShutdown = false
      after(function(){
        didForceShutdown = true
        server.forceShutdown()
      })
      server.start()

      const queue = grpcq.defaults({
        type: 'memory',
        endpoint: '0.0.0.0:50051',
      })
      
      let publish_something = null

      queue.subscribe({
        name: 'test',
      })
      .on('message', (message) => {
        done(null)
      })
      .on('error', (error) => {
        if(!didForceShutdown)
          done(error)
      })
      .on('active', () => {
        publish_something = queue.publish({
          name: 'test',
          data: {a:Date.now()}
        })
        .then(receipt => {
          assert.isString(receipt.id)
        })
      })
    }).timeout(10000)
  })
  describe('kue driver', () => {
    it('ping pong', function (done) {
      /*
       * > npm test -- --grep="kue driver ping pong"
       */
      const grpcq = require('../index.js')
      const server = grpcq.createServer({
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

      const queue = grpcq.defaults({
        type: 'kue',
      })
      
      let publish_something = null
      let ts = Date.now()
      queue.subscribe({
        name: 'test',
      })
      .on('message', (message) => {
        // assert.isAbove((Date.now()-ts), 500, 'delay works?')
        done(null)
      })
      .on('error', function (error) {
        if(didForceShutdown)
          done()
        else {
          done(new Error(error.message))
        }
      })
      .on('active', () => {
        publish_something = queue.publish({
          name: 'test',
          data: {
            ts: ts,
          },
          // delay: 500,
        })
        .then(receipt => {
          assert.isString(receipt.id)
        })
      })
    }).timeout(10000)
  })
})