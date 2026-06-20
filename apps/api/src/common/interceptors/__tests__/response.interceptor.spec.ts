import { lastValueFrom, of } from "rxjs";
import type { CallHandler, ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { ResponseInterceptor } from "../response.interceptor";

function createContext(statusCode: number): ExecutionContext {
  return {
    switchToHttp: () => ({ getResponse: () => ({ statusCode }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

function createHandler<T>(payload: T): CallHandler<T> {
  return { handle: () => of(payload) };
}

function createReflector(isRawResponse: boolean): Reflector {
  return { getAllAndOverride: () => isRawResponse } as unknown as Reflector;
}

describe("ResponseInterceptor", () => {
  it("wraps payload in { data, error: null }", async () => {
    const interceptor = new ResponseInterceptor(createReflector(false));

    const result = await lastValueFrom(
      interceptor.intercept(createContext(200), createHandler({ id: "1" })),
    );

    expect(result).toEqual({ data: { id: "1" }, error: null });
  });

  it("does not wrap 204 No Content responses", async () => {
    const interceptor = new ResponseInterceptor(createReflector(false));

    const result = await lastValueFrom(
      interceptor.intercept(createContext(204), createHandler(undefined)),
    );

    expect(result).toBeUndefined();
  });

  it("does not wrap handlers returning undefined", async () => {
    const interceptor = new ResponseInterceptor(createReflector(false));

    const result = await lastValueFrom(
      interceptor.intercept(createContext(200), createHandler(undefined)),
    );

    expect(result).toBeUndefined();
  });

  it("passes through the original payload for routes marked @RawResponse()", async () => {
    const interceptor = new ResponseInterceptor(createReflector(true));

    const result = await lastValueFrom(
      interceptor.intercept(createContext(200), createHandler("# HELP foo\n")),
    );

    expect(result).toBe("# HELP foo\n");
  });
});
