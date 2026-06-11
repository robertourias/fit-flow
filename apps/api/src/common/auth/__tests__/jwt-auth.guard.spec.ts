import { UnauthorizedException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtAuthGuard } from "../jwt-auth.guard";
import type { RequestWithUser } from "../jwt-auth.guard";

jest.mock("@auth/core/jwt", () => ({
  decode: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { decode } = require("@auth/core/jwt") as { decode: jest.Mock };

function createContext(request: RequestWithUser, isPublic = false): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => request }),
    __isPublic: isPublic,
  } as unknown as ExecutionContext;
}

describe("JwtAuthGuard", () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env["AUTH_SECRET"] = "test-secret";
    delete process.env["AUTH_COOKIE_NAME"];
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  it("allows @Public() routes without token", async () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(true);
    const context = createContext({ headers: {} });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(decode).not.toHaveBeenCalled();
  });

  it("rejects request without Authorization header", async () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(false);
    const context = createContext({ headers: {} });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it("rejects non-Bearer Authorization header", async () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(false);
    const context = createContext({ headers: { authorization: "Basic abc123" } });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it("rejects token that fails to decode", async () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(false);
    decode.mockRejectedValue(new Error("decryption failed"));
    const context = createContext({ headers: { authorization: "Bearer bad-token" } });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it("rejects decoded payload without id", async () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(false);
    decode.mockResolvedValue({ sub: "abc" });
    const context = createContext({ headers: { authorization: "Bearer token" } });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it("rejects when decode returns null", async () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(false);
    decode.mockResolvedValue(null);
    const context = createContext({ headers: { authorization: "Bearer token" } });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it("rejects when AUTH_SECRET is missing", async () => {
    delete process.env["AUTH_SECRET"];
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(false);
    const context = createContext({ headers: { authorization: "Bearer token" } });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(decode).not.toHaveBeenCalled();
  });

  it("accepts valid token and sets request.user with tenantId", async () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(false);
    decode.mockResolvedValue({ id: "user-123", hasOnboarded: true });
    const request: RequestWithUser = {
      headers: { authorization: "Bearer good-token" },
    };
    const context = createContext(request);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ id: "user-123" });
    expect(decode).toHaveBeenCalledWith({
      token: "good-token",
      secret: "test-secret",
      salt: "authjs.session-token",
    });
  });

  it("uses AUTH_COOKIE_NAME as salt when set", async () => {
    process.env["AUTH_COOKIE_NAME"] = "__Secure-authjs.session-token";
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(false);
    decode.mockResolvedValue({ id: "user-123" });
    const context = createContext({ headers: { authorization: "Bearer token" } });

    await guard.canActivate(context);
    expect(decode).toHaveBeenCalledWith(
      expect.objectContaining({ salt: "__Secure-authjs.session-token" }),
    );
  });
});
