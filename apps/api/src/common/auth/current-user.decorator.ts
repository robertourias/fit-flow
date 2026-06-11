import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthenticatedUser, RequestWithUser } from "./jwt-auth.guard";

/** Injeta o usuário autenticado (tenantId) resolvido pelo JwtAuthGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (!request.user) {
      // Só acontece se o decorator for usado em rota @Public() — erro de programação.
      throw new Error("CurrentUser used on a route without authentication");
    }
    return request.user;
  },
);
