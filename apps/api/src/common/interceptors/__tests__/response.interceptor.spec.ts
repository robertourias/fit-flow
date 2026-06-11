import { lastValueFrom, of } from "rxjs";
import type { CallHandler, ExecutionContext } from "@nestjs/common";
import { ResponseInterceptor } from "../response.interceptor";

function createContext(statusCode: number): ExecutionContext {
  return {
    switchToHttp: () => ({ getResponse: () => ({ statusCode }) }),
  } as unknown as ExecutionContext;
}

function createHandler<T>(payload: T): CallHandler<T> {
  return { handle: () => of(payload) };
}

describe("ResponseInterceptor", () => {
  let interceptor: ResponseInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
  });

  it("wraps payload in { data, error: null }", async () => {
    const result = await lastValueFrom(
      interceptor.intercept(createContext(200), createHandler({ id: "1" })),
    );

    expect(result).toEqual({ data: { id: "1" }, error: null });
  });

  it("does not wrap 204 No Content responses", async () => {
    const result = await lastValueFrom(
      interceptor.intercept(createContext(204), createHandler(undefined)),
    );

    expect(result).toBeUndefined();
  });

  it("does not wrap handlers returning undefined", async () => {
    const result = await lastValueFrom(
      interceptor.intercept(createContext(200), createHandler(undefined)),
    );

    expect(result).toBeUndefined();
  });
});
