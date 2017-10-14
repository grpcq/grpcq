/*
 * # grpcq Reference
 */

module.exports = {
  createServer: require('./server.js').createServer,
  subscribe: require('./client.js').subscribe,
  publish: require('./client.js').publish,
}