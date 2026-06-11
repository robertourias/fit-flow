import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from "@nestjs/common";
import type { ArgumentsHost } from "@nestjs/common";
import { ApiErrorCode } from "@fitflow/types";
import { HttpExceptionFilter } from "../http-exception.filter";

interface MockResponse {
  status: jest.Mock;
  json: jest.Mock;
}

function createHost(): { host: ArgumentsHost; response: MockResponse } {
  const response: MockResponse = {
    status: jest.fn(),
    json: jest.fn(),
  };
  response.status.mockReturnValue(response);
  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost;
  return { host, response };
}

describe("HttpExceptionFilter", () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  it("maps BadRequestException (ValidationPipe) to 400 VALIDATION_ERROR with per-field messages", () => {
    const { host, response } = createHost();
    const exception = new BadRequestException(["name must be a string", "age must be an integer"]);

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      data: null,
      error: {
        code: ApiErrorCode.VALIDATION_ERROR,
        message: ["name must be a string", "age must be an integer"],
      },
    });
  });

  it("maps UnauthorizedException to 401 UNAUTHORIZED", () => {
    const { host, response } = createHost();

    filter.catch(new UnauthorizedException("Missing bearer token"), host);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      data: null,
      error: { code: ApiErrorCode.UNAUTHORIZED, message: "Missing bearer token" },
    });
  });

  it("maps NotFoundException to 404 NOT_FOUND", () => {
    const { host, response } = createHost();

    filter.catch(new NotFoundException(), host);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({
      data: null,
      error: { code: ApiErrorCode.NOT_FOUND, message: expect.any(String) },
    });
  });

  it("preserves explicit code from exception payload (422 PLAN_LIMIT_EXCEEDED)", () => {
    const { host, response } = createHost();
    const exception = new UnprocessableEntityException({
      code: ApiErrorCode.PLAN_LIMIT_EXCEEDED,
      message: "Limite de 6 treinos atingido",
    });

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(422);
    expect(response.json).toHaveBeenCalledWith({
      data: null,
      error: {
        code: ApiErrorCode.PLAN_LIMIT_EXCEEDED,
        message: "Limite de 6 treinos atingido",
      },
    });
  });

  it("maps unhandled non-HTTP errors to 500 INTERNAL_ERROR without leaking details", () => {
    const { host, response } = createHost();

    filter.catch(new Error("prisma exploded: secret connection string"), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      data: null,
      error: { code: ApiErrorCode.INTERNAL_ERROR, message: "Internal server error" },
    });
  });
});
