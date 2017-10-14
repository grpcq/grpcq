<div align="center">
<h1>grpcq</h1>
Multi backend queue for Node.js and any languages via gRPC.
</div>

## Features

- [ ] [Amazon SQS](https://aws.amazon.com/sqs/) backend support.
- [ ] [Google Cloud Pub/Sub](https://cloud.google.com/pubsub/) backend support.
- [ ] [bull](https://github.com/OptimalBits/bull) backend support.
- [x] [gRPC](https://grpc.io/) client support. (C++, Node.js, Python, Ruby, Objective-C, PHP, C#)
- [x] Delayed jobs.
- [x] Schedule and repeat jobs.
- [x] Retries.
- [x] View messages on-the-fly.
- [x] Job completion acknowledgement.
- [ ] Fully-managed hosting providers.
- [ ] UI.
- [ ] Event-driven API Guide.

## Usage

Install package from `npm install grpcq --save` or `yarn add grpcq`.

```js
const grpcq = require('grpcq')

grpcq.subscribe({
  name: 'find reservation in every 5m',
  type: 'sqs',
})
.on('message', (message) => {
  console.log('[client] got message', message)
})
.on('error', (error) => {
  console.log('[client] got error', error)
})

let receipt = await grpcq.publish({
  name: 'find reservation in every 5m',
  type: 'sqs',
  data: 'any data',
  repeat: '5m'
})
```

## Documentation

- [Full API Reference](https://github.com/grpcq/grpcq/blob/master/REFERENCE.md)

## Tests

Use mocha, chai assert.

- `npm test -- --grep="grpcq client"`

- `npm test -- --grep="local require"`

- `npm test -- --grep="local ping pong"`

