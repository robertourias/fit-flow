import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { ApiErrorCode } from "@fitflow/types";
import type { ApiResponse } from "@fitflow/types";

interface JsonResponse {
  status(code: number): JsonResponse;
  json(body: unknown): void;
}

/**
 * Converte toda exceção para o shape ApiResponse de erro.
 * Erros não-HTTP nunca vazam mensagem/stack — sempre 500 genérico.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly _logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<JsonResponse>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body: ApiResponse<never> = {
        data: null,
        error: {
          code: this._resolveCode(exception, status),
          message: this._resolveMessage(exception),
        },
      };
      response.status(status).json(body);
      return;
    }

    this._logger.error("Unhandled exception", {
      error: exception instanceof Error ? exception.stack : exception,
    });
    const body: ApiResponse<never> = {
      data: null,
      error: { code: ApiErrorCode.INTERNAL_ERROR, message: "Internal server error" },
    };
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }

  private _resolveCode(exception: HttpException, status: number): string {
    // Exceções lançadas com payload { code } (ex: PLAN_LIMIT_EXCEEDED) têm prioridade.
    const payload = exception.getResponse();
    if (
      typeof payload === "object" &&
      payload !== null &&
      "code" in payload &&
      typeof (payload as { code: unknown }).code === "string"
    ) {
      return (payload as { code: string }).code;
    }

    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ApiErrorCode.VALIDATION_ERROR;
      case HttpStatus.UNAUTHORIZED:
        return ApiErrorCode.UNAUTHORIZED;
      case HttpStatus.NOT_FOUND:
        return ApiErrorCode.NOT_FOUND;
      default:
        return ApiErrorCode.INTERNAL_ERROR;
    }
  }

  private _resolveMessage(exception: HttpException): string | string[] {
    const payload = exception.getResponse();
    if (typeof payload === "string") {
      return payload;
    }
    if (typeof payload === "object" && payload !== null && "message" in payload) {
      const message = (payload as { message: unknown }).message;
      if (typeof message === "string") {
        return message;
      }
      if (
        Array.isArray(message) &&
        message.every((item): item is string => typeof item === "string")
      ) {
        return message;
      }
    }
    return exception.message;
  }
}
