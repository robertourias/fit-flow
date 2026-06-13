import { apiFetch, ApiClientError } from "../client";

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const mockCookieStore = { get: jest.fn() };

jest.mock("next/headers", () => ({
  cookies: jest.fn(() => Promise.resolve(mockCookieStore)),
}));

const ORIGINAL_ENV = process.env;

function jsonResponse(body: unknown, status = 200): { status: number; json: () => Promise<unknown> } {
  return { status, json: async () => body };
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...ORIGINAL_ENV, NEXT_PUBLIC_API_URL: "http://localhost:3001" };
  mockCookieStore.get.mockReturnValue(undefined);
  delete (global as { window?: unknown }).window;
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("apiFetch", () => {
  it("returns data on success", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: { id: "1" }, error: null }));

    const result = await apiFetch<{ id: string }>("/users/me");

    expect(result).toEqual({ id: "1" });
  });

  it("throws ApiClientError with status/message when error !== null", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: null, error: { code: "NOT_FOUND", message: "Não encontrado" } }, 404),
    );

    let error: unknown;
    try {
      await apiFetch("/users/me");
    } catch (err) {
      error = err;
    }

    expect(error).toBeInstanceOf(ApiClientError);
    expect((error as ApiClientError).status).toBe(404);
    expect((error as ApiClientError).message).toBe("Não encontrado");
  });

  it("joins array message with ', '", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(
        { data: null, error: { code: "VALIDATION_ERROR", message: ["nome é obrigatório", "idade inválida"] } },
        400,
      ),
    );

    let error: unknown;
    try {
      await apiFetch("/users/me");
    } catch (err) {
      error = err;
    }

    expect((error as ApiClientError).message).toBe("nome é obrigatório, idade inválida");
  });

  it("returns undefined when status === 204", async () => {
    mockFetch.mockResolvedValueOnce({ status: 204, json: async () => ({}) });

    const result = await apiFetch("/workouts/1");

    expect(result).toBeUndefined();
  });

  it("on the server, calls NEXT_PUBLIC_API_URL directly with session cookie as Bearer token", async () => {
    mockCookieStore.get.mockImplementation((name: string) =>
      name === "authjs.session-token" ? { value: "session-jwt" } : undefined,
    );
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: { id: "1" }, error: null }));

    await apiFetch("/users/me");

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("http://localhost:3001/api/v1/users/me");
    expect((init.headers as Headers).get("Authorization")).toBe("Bearer session-jwt");
  });

  it("on the server, prefers API_INTERNAL_URL over NEXT_PUBLIC_API_URL (Docker-internal hostname)", async () => {
    process.env.API_INTERNAL_URL = "http://api:3001";
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: { id: "1" }, error: null }));

    await apiFetch("/users/me");

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("http://api:3001/api/v1/users/me");
  });

  it("on the client, calls /api/proxy/...", async () => {
    (global as { window?: unknown }).window = {};
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: { id: "1" }, error: null }));

    await apiFetch("/users/me");

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/proxy/users/me");
  });
});
