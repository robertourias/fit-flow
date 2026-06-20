import { Controller, Get, Header } from "@nestjs/common";
import { Public } from "../common/auth/public.decorator";
import { RawResponse } from "../common/interceptors/raw-response.decorator";
import { MetricsService } from "./metrics.service";

@Controller("metrics")
export class MetricsController {
  constructor(private readonly _metrics: MetricsService) {}

  @Public()
  @RawResponse()
  @Get()
  @Header("Content-Type", "text/plain; version=0.0.4")
  async getMetrics(): Promise<string> {
    return this._metrics.getMetricsText();
  }
}
