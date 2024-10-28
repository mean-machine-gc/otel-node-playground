import { Span, TraceAPI, Tracer } from "@opentelemetry/api";
import { createMiddleware } from "hono/factory";

export const addTraceName = (trace: TraceAPI) => createMiddleware(async (c, next) => {
    const activeSpan: Span = trace.getActiveSpan();
    const traceId = activeSpan.spanContext().traceId;
    const method = c.req.method;
    const path = c.req.path;
    await activeSpan.updateName(`${method} ${path} ${traceId}`)
    await next()
  })

export const createSpan = (tracer: Tracer, name: string): Span => {
    const span = tracer.startSpan(name);
    const spanId = span.spanContext().spanId;
    span.updateName(`${name} ${spanId}`);
    return span;
}