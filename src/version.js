const grpc = require('grpc')

module.exports = (num) => {
  const descriptor = grpc.load(`./src/queue.proto`)
  const api = descriptor.grpcq
  return api
}