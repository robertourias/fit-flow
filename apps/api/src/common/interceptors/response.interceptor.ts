import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { map } from "rxjs/operators";
import type { Observable } from "rxjs";
import type { ApiResponse } from "@fitflow/types";
import { IS_RAW_RESPONSE_KEY } from "./raw-response.decorator";

/**
 * Envolve respostas de sucesso em { data, error: null }.
 * 204 No Content e handlers sem retorno passam sem body.
 * Rotas marcadas com @RawResponse() (ex: /metrics, formato de exposição
 * Prometheus) passam o payload original sem o envelope.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | T | undefined> {
  constructor(private readonly _reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T> | T | undefined> {
    const isRawResponse = this._reflector.getAllAndOverride<boolean>(IS_RAW_RESPONSE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    return next.handle().pipe(
      map((payload) => {
        if (isRawResponse) {
          return payload;
        }
        const response = context.switchToHttp().getResponse<{ statusCode: number }>();
        if (response.statusCode === HttpStatus.NO_CONTENT || payload === undefined) {
          return undefined;
        }
        return { data: payload, error: null };
      }),
    );
  }
}
