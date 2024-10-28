/*instrumentation.ts*/
import { logs, NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import {
  PeriodicExportingMetricReader,
  ConsoleMetricExporter,
} from '@opentelemetry/sdk-metrics';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { Resource } from '@opentelemetry/resources';
import {
    ATTR_SERVICE_NAME,
    ATTR_SERVICE_VERSION,
  } from '@opentelemetry/semantic-conventions';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';




const sdk = new NodeSDK({
    resource: new Resource({
        [ATTR_SERVICE_NAME]: 'service-b',
        [ATTR_SERVICE_VERSION]: '1.0',
      }),
    traceExporter: new OTLPTraceExporter({
        // optional - default url is http://localhost:4318/v1/traces
        // url: '<your-otlp-endpoint>/v1/traces',
        // optional - collection of custom headers to be sent with each request, empty by default
        headers: {},
        }),
    metricReader: new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({
            // url: '<your-otlp-endpoint>/v1/metrics', // url is optional and can be omitted - default is http://localhost:4318/v1/metrics
            headers: {}, // an optional object containing custom headers to be sent with each request
        }),
    }),
    logRecordProcessor: new logs.SimpleLogRecordProcessor(new OTLPLogExporter()),

  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
