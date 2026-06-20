import { Injectable } from "@nestjs/common";
import { Counter, Histogram, Registry, collectDefaultMetrics } from "prom-client";

/**
 * Encapsula o Registry do prom-client. Registry dedicado (não o `register`
 * default global do prom-client) evita poluir métricas entre testes que
 * instanciam o módulo mais de uma vez.
 */
@Injectable()
export class MetricsService {
  readonly registry = new Registry();

  readonly httpRequestsTotal = new Counter({
    name: "http_requests_total",
    help: "Total de requests HTTP por método, rota e status code",
    labelNames: ["method", "route", "status_code"],
    registers: [this.registry],
  });

  readonly httpRequestDurationSeconds = new Histogram({
    name: "http_request_duration_seconds",
    help: "Duração de requests HTTP em segundos, por método, rota e status code",
    labelNames: ["method", "route", "status_code"],
    registers: [this.registry],
  });

  constructor() {
    collectDefaultMetrics({ register: this.registry });
  }

  recordHttpRequest(method: string, route: string, statusCode: number, durationSeconds: number): void {
    const labels = { method, route, status_code: String(statusCode) };
    this.httpRequestsTotal.inc(labels);
    this.httpRequestDurationSeconds.observe(labels, durationSeconds);
  }

  async getMetricsText(): Promise<string> {
    return this.registry.metrics();
  }

  get contentType(): string {
    return this.registry.contentType;
  }
}
