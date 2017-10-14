const debug = require('debug')('grpcq:memory')

const EventEmitter = require('events')
class MemoryBackendEmitter extends EventEmitter {}

const e = new MemoryBackendEmitter()
// const es = {}

function generate_receipt_id (message) {
  return Date.now() + '-' + message.body.length
}

module.exports.subscribe = function (call) {
  opt = JSON.parse(call.request.option)
  
  debug('MemoryBackendEmitter.on queue:'+opt.name)
  e.on('queue:'+opt.name, (request) => {
    call.write({
      id: request.id,
      body: request.body,
    })
  })
}

module.exports.publish = function (call, callback) {
  opt = JSON.parse(call.request.body)
  
  call.request.id = generate_receipt_id(call.request)
  
  debug('MemoryBackendEmitter.emit queue:'+opt.name)
  e.emit('queue:'+opt.name, call.request)
  return callback(null, {
    id: String(call.request.id),
  })
}