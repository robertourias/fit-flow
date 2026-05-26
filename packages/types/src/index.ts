export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code: string } };

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  nextCursor: string | null;
};
