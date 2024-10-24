import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'

import { v4 as uuid } from 'uuid';

import { trace, Span, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('service-a');

const log = (message: string) => {
  const traceId = trace.getActiveSpan().spanContext().traceId
  const spanId = trace.getActiveSpan().spanContext().spanId
  console.log(`traceId: ${traceId}`, `spanId: ${traceId}`, message)
}


const app = new Hono()

app.use(logger(log))

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.post('/order', async (c) => {
  const orderDto = await c.req.json();
  log(`Creating order for: ${JSON.stringify(orderDto)}`);

  const createOrderSpan = tracer.startSpan('create-order');
  const order = await createOrder(orderDto);
  createOrderSpan.addEvent('Order Created', order)
  createOrderSpan.setAttribute('orderId', order.orderId)
  createOrderSpan.end()
  
  const shipping = await fetch(`http://localhost:3001/shipping`, {
    method: `POST`,
    body: JSON.stringify(order),
  }).then(response => response.json())

  log(JSON.stringify(shipping))
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
