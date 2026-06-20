import { MetricsController } from "../metrics.controller";
import { MetricsService } from "../metrics.service";

describe("MetricsController", () => {
  it("returns the registry's Prometheus exposition text", async () => {
    const metrics = new MetricsService();
    metrics.recordHttpRequest("GET", "/health", 200, 0.001);
    const controller = new MetricsController(metrics);

    const text = await controller.getMetrics();

    expect(text).toContain("# HELP http_requests_total");
    expect(text).toContain("# TYPE http_requests_total counter");
  });
});
