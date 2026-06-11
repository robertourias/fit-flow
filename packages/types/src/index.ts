export enum ApiErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  NOT_FOUND = "NOT_FOUND",
  PLAN_LIMIT_EXCEEDED = "PLAN_LIMIT_EXCEEDED",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

export type ApiResponse<T> =
  | { data: T; error: null }
  // message é string[] para erros de validação (uma mensagem por campo)
  | { data: null; error: { message: string | string[]; code: string } };

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  nextCursor: string | null;
};
