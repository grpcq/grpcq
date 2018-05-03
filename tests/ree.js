require('debugs/init')

const debug = require('debug')('grpcq:ree')
const assert = require('chai').assert
const config = require('./config.js')

describe('ree client', () => {
  describe('in-memory', () => {
    it('ping pong', (done) => {
      const RemoteEventEmitter = require('../src/ree.js')
      
      try {
        const server1 = new RemoteEventEmitter(config)
        server1.subscribe()
        debug('server1', 'publish')
        server1.publish('ping')
        server1.on('pong', (err) => {
          debug('server1', 'pong')
          done(err)
        })
        

        const server2 = new RemoteEventEmitter(config)
        server2.subscribe()
        server2.on('ping', (err) => {
          debug('server2', 'ping')
          server2.publish('pong')
        })
        server2.on('error', (a, b) => {
          debug('a', a)
          debug('b', b)
        })
        

      } catch (error) {
        debug(error.stack)
        done(error)
      }
    }).timeout(30000)
  })
})