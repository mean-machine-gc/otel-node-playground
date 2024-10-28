import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'

import { v4 as uuid } from 'uuid';

import { trace, Span, SpanStatusCode } from '@opentelemetry/api';

import pino from 'pino';

const pinoLogger = pino({
    name: 'service-a',
    level: 'debug'
});

const tracer = trace.getTracer('service-a');

const traceName = createMiddleware(async (c, next) => {
  const method = c.req.method;
  const path = c.req.path;
  await trace.getActiveSpan().updateName(`${method} ${path}`)
  await next()
})

const app = new Hono()

app.use(traceName)


app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.post('/order', async (c) => {

  pinoLogger.info('hi pino000');
  console.log('hi console')
  const orderDto = await c.req.json();
  pinoLogger.info(`Creating order for: ${JSON.stringify(orderDto)}`);

  const createOrderSpan = tracer.startSpan('create-order');
  const order = await createOrder(orderDto);
  createOrderSpan.addEvent('Order Created', order)
  createOrderSpan.setAttribute('orderId', order.orderId)
  createOrderSpan.end()
  
  const shipping = await fetch(`http://localhost:3001/shipping`, {
    method: `POST`,
    body: JSON.stringify(order),
  }).then(response => response.json())

 pinoLogger.info(JSON.stringify(shipping))
  return c.json({order, shipping})
})

const createOrder = async (order) => {
  return new Promise<any>((resolve, reject)=> {
    setTimeout(()=> {
      const orderId = uuid();
      resolve({
        orderId,
        order
      })
    }, 500)
  })
}


const port = 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
