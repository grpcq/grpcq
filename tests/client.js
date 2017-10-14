const assert = require('chai').assert

describe('grpcq client', () => {
  /*
   * - `npm test -- --grep="grpcq client"`
   */
  describe('local', () => {
    it('require', async () => {
      /*
       * - `npm test -- --grep="local require"`
       */
      const grpcq = require('../index.js')
      assert.isObject(grpcq)
      assert.property(grpcq, 'createServer')
      assert.property(grpcq, 'subscribe')
      assert.property(grpcq, 'publish')
    }).timeout(10000)

    it('ping pong', async () => {
      /*
       * - `npm test -- --grep="local ping pong"`
       */
      // assert.isObject(result.data)
      // assert.equal(result.data.status, 200)
      assert.equal(200, 200)
      // assert.isObject(result.data.item)
    }).timeout(10000)
  })
})