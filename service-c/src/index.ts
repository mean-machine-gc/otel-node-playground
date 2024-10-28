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

app.get('/shipping-address/:customerId', async (c) => {
  const customerId = c.req.param('customerId')
  pinoLogger.info(`customerId ${customerId}`)
  const findShippingAddressSpan = createSpan(tracer, 'find-shipping');
  const customer = await findShippingAddress(customerId)
  findShippingAddressSpan.end()
  return c.json(customer)
})

const findShippingAddress = async (customerId) => {
  try{
    return new Promise<any>((resolve, reject)=> {
      setTimeout(()=> {
        const customer = customers.find(c => c.customerId == customerId);
        pinoLogger.info(`customer ${customer}`)
  
        if(!!customer){
          resolve({
            shippingAddress: customer.shippingAddress
          })
        } else {
          reject()
        }
      }, 500)
    })
  } catch(e){
   pinoLogger.info(e.message)
    throw new Error(e)
  }
}

const customers = [
  {
    customerId: 1,
    name: 'Jhon',
    surname: 'Doe',
    shippingAddress: {
      country: 'Spain',
      city: 'Valencia',
      street: 'Gran Via',
      streetNumber: '12a',
      postalCode: '54675'
    }
  },
  {
    customerId: 2,
    name: 'Mary',
    surname: 'Smith',
    shippingAddress: {
      country: 'UK',
      city: 'London',
      street: 'High Street',
      streetNumber: '123a',
      postalCode: '54BW3'
    }
  }
]

const port = 3002
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
