import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import type { AuthenticatedUser } from "./current-user.decorator.js";
import { requestSessionToken } from "./session.js";
import { SessionService } from "./session.service.js";

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(@Inject(SessionService) private readonly sessions: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const token = requestSessionToken(request);
    if (!token) throw new UnauthorizedException("A valid session is required");

    const session = await this.sessions.findActive(token);
    if (!session) throw new UnauthorizedException("The session is invalid or expired");

    request.user = {
      id: session.user.id,
      email: session.user.email,
      sessionId: session.id,
    };
    return true;
  }
}
