/*
 * # grpcq Reference
 */

module.exports = {
  createServer: (opt) => {
    return require('./server.js').createServer(opt)
  },
  subscribe: (opt) => {
    return require('./client.js').subscribe(opt)
  },
  publish: (opt) => {
    return require('./client.js').publish(opt)
  },
  defaults: require('./client.js').defaults,
}