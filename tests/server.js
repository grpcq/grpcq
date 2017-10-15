const assert = require('chai').assert
const rsv = require('rsv')

describe('grpcq server', () => {
  /*
   * ##### `npm test -- --grep="grpcq server"`
   * 
   */
  describe('local', () => {
    it('createServer without opt', async () => {
      /*
       * > npm test -- --grep="local createServer without opt"
       */
      const grpcq = require('../index.js')
      const server = grpcq.createServer()
      assert.isObject(server)
      assert.property(server, 'start')
    })
    it('createServer with invalid backend', async () => {
      /*
       * > npm test -- --grep="local createServer with invalid backend"
       */
      try {
        const grpcq = require('../index.js')
        const server = grpcq.createServer({
          backend: rsv(null, false, '', '???'),
        })
        assert.isNotOk('invalid opt should throw')
      } catch (error) {
        return true
      }
    })
    it('createServer with memory backend', async () => {
      /*
       * > npm test -- --grep="local createServer with memory backend"
       */
      const grpcq = require('../index.js')
      const server = grpcq.createServer({
        backend: 'memory',
      })
      assert.isObject(server)
      assert.property(server, 'start')
      
      server.start()
      server.forceShutdown()
      return
    })
  })

  describe('sqs', () => {
    it('createServer fail to auth', async () => {
      /*
       * > npm test -- --grep="createServer fail to auth"
       */
      try {
        const grpcq = require('../index.js')
        const server = grpcq.createServer({
          backend: 'sqs',
          access_key_id: rsv(null, false, '', '?'),
          secret_access_key: rsv(null, false, '', '?'),
        })
        assert.isNotOk('invalid opt should throw')
      } catch (error) {
        assert.ifError(error)
      }
    })
  })
})