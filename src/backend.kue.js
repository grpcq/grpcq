const debug = require('debug')('grpcq:kue')
const kue = require('kue')
const _ = require('lodash')
const code = require('./constants.js')

const EventEmitter = require('events')
class MemoryBackendEmitter extends EventEmitter {}

class KueDriver {
  constructor () {
    this.es = {}
  }
  generate_receipt_id (message) {
    return Date.now() + '-' + message.body.length
  }

  start (opt) {
    debug('start %O', opt)
    this.queue = kue.createQueue(opt)
    // this.queues.watchStuckJobs(1000)
    return this.queues
  }
  subscribe (call) {
    const opt = JSON.parse(call.request.option)
    
    debug('Kue.process queue:'+opt.name)
    this.queue.process(opt.name, (job, done) => {
      call.write({
        id: String(job.id),
        body: JSON.stringify(job.data),
      })
      done('skip')
    })
  }
  publish (call, callback) {
    const opt = JSON.parse(call.request.body)
    
    call.request.id = this.generate_receipt_id(call.request)
    
    debug('Kue.create queue:'+opt.name)
    let job = this.queue
      .create(opt.name, call.request)
      .delay(+opt.delay || 0)
      .removeOnComplete(Boolean(opt.removeOnComplete) || true)
      .save()
    return callback(null, {
      id: String(call.request.id),
    })
  }
  stop (opt = {}) {
    if(this.queue){
      this.queue.shutdown(5000, (opt.callback || _.noop))
    }
  }
}

module.exports = new KueDriver()