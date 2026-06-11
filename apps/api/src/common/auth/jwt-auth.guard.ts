import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { decode } from "@auth/core/jwt";
import { IS_PUBLIC_KEY } from "./public.decorator";

export interface AuthenticatedUser {
  id: string;
}

export interface RequestWithUser {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthenticatedUser;
}

/**
 * Valida o JWT (JWE) de sessão emitido pelo NextAuth em apps/web.
 * Mesmo AUTH_SECRET; salt = nome do cookie de sessão (AUTH_COOKIE_NAME),
 * pois o Auth.js deriva a chave de criptografia de secret + salt.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly _reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this._reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this._extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const secret = process.env["AUTH_SECRET"];
    if (!secret) {
      // Config ausente é erro de servidor, mas nunca autentique sem segredo.
      throw new UnauthorizedException("Authentication is not configured");
    }

    let payload: Record<string, unknown> | null;
    try {
      payload = (await decode({
        token,
        secret,
        salt: process.env["AUTH_COOKIE_NAME"] ?? "authjs.session-token",
      })) as Record<string, unknown> | null;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }

    const tenantId = payload?.["id"];
    if (typeof tenantId !== "string" || tenantId.length === 0) {
      throw new UnauthorizedException("Invalid or expired token");
    }

    request.user = { id: tenantId };
    return true;
  }

  private _extractBearerToken(request: RequestWithUser): string | null {
    const header = request.headers["authorization"];
    if (typeof header !== "string") {
      return null;
    }
    const [scheme, token] = header.split(" ");
    if (scheme?.toLowerCase() !== "bearer" || !token) {
      return null;
    }
    return token;
  }
}
