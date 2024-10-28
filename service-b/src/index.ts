import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'

import { v4 as uuid } from 'uuid';

import { trace, Span, SpanStatusCode } from '@opentelemetry/api';

import pino from 'pino';
import { createMiddleware } from 'hono/factory';
import { addTraceName, createSpan } from './utils';

const pinoLogger = pino({
    name: 'service-a',
    level: 'debug'
});

const tracer = trace.getTracer('service-a');

const app = new Hono()

app.use(addTraceName(trace));

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.post('/shipping', async (c) => {
  const shippingDto = await c.req.json();
  const shippingAddress = await fetchShippingAddress(shippingDto.order.customerId);
  pinoLogger.info(`Creating shipping for: ${JSON.stringify(shippingDto)}`);
  const createShippingSpan = createSpan(tracer, 'create-shipping');
  const shipping = await createShipping(shippingDto, shippingAddress);
  createShippingSpan.setAttributes({orderId: shipping.orderId, shippingId: shipping.shippingId})
  createShippingSpan.end()
  return c.json(shipping)
})

const fetchShippingAddress = async (customerId) => {
  return await fetch(`http://localhost:3002/shipping-address/${customerId}`, {
    method: `GET`
  }).then(response => response.json())
} 

const createShipping = async (shippingDto, shippingAddress) => {
  return new Promise<any>((resolve, reject)=> {
    setTimeout(()=> {
      const shippingId = uuid();
      resolve({
        shippingId,
        orderId: shippingDto.orderId,
        status: 'Processing',
        items: shippingDto.order,
        ...shippingAddress
      })
    }, 500)
  })
}

const port = 3001
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
