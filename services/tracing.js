import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";

let sdk;

if (process.env.NODE_ENV !== "test") {
  sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: "stigmergy-core-engine",
    }),
    traceExporter: new OTLPTraceExporter({
      // Optional: configure exporter options
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-http": {
          enabled: true,
        },
      }),
    ],
  });

  sdk.start();

  console.log("OpenTelemetry tracing initialized");

  process.on("SIGTERM", () => {
    sdk
      .shutdown()
      .then(() => console.log("Tracing terminated"))
      .catch((error) => console.log("Error terminating tracing", error))
      .finally(() => process.exit(0));
  });
} else {
  console.log("OpenTelemetry tracing disabled for test environment.");
  // Provide a mock SDK with a no-op shutdown method for tests
  sdk = {
    shutdown: () => Promise.resolve(),
  };
}

export { sdk };
