import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { map } from "rxjs/operators";
import type { Observable } from "rxjs";
import type { ApiResponse } from "@fitflow/types";

/**
 * Envolve respostas de sucesso em { data, error: null }.
 * 204 No Content e handlers sem retorno passam sem body.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | undefined> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T> | undefined> {
    return next.handle().pipe(
      map((payload) => {
        const response = context.switchToHttp().getResponse<{ statusCode: number }>();
        if (response.statusCode === HttpStatus.NO_CONTENT || payload === undefined) {
          return undefined;
        }
        return { data: payload, error: null };
      }),
    );
  }
}
