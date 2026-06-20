import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { tap } from "rxjs/operators";
import type { Observable } from "rxjs";
import { MetricsService } from "./metrics.service";

interface IHttpRequestLike {
  method: string;
  route?: { path: string };
  url: string;
}

interface IHttpResponseLike {
  statusCode: number;
}

/**
 * Coleta contagem e duração de requests HTTP por método/rota/status.
 * Usa `request.route.path` (path-template, ex: "/users/:id") em vez da
 * URL concreta para não explodir cardinalidade das labels do Prometheus.
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly _metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<IHttpRequestLike>();
    const response = httpContext.getResponse<IHttpResponseLike>();
    const start = process.hrtime.bigint();
    const route = request.route?.path ?? request.url;
    const method = request.method;

    const record = (): void => {
      const durationNs = process.hrtime.bigint() - start;
      const durationSeconds = Number(durationNs) / 1e9;
      this._metrics.recordHttpRequest(method, route, response.statusCode, durationSeconds);
    };

    return next.handle().pipe(tap({ next: record, error: record }));
  }
}
