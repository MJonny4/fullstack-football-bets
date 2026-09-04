import { Global, Module } from "@nestjs/common";
import { SessionAuthGuard } from "./session-auth.guard.js";
import { SessionService } from "./session.service.js";

@Global()
@Module({
  providers: [SessionAuthGuard, SessionService],
  exports: [SessionAuthGuard, SessionService],
})
export class SecurityModule {}
