import { MetricsService } from "../metrics.service";

describe("MetricsService", () => {
  it("exposes Prometheus exposition format including recorded HTTP metrics", async () => {
    const service = new MetricsService();
    service.recordHttpRequest("GET", "/coaching/students", 200, 0.012);

    const text = await service.getMetricsText();

    expect(text).toContain("http_requests_total");
    expect(text).toContain("http_request_duration_seconds");
    expect(text).toContain('method="GET"');
    expect(text).toContain('route="/coaching/students"');
    expect(text).toContain('status_code="200"');
  });

  it("exposes the registry content type used for the /metrics response", () => {
    const service = new MetricsService();
    expect(service.contentType).toContain("text/plain");
  });
});
