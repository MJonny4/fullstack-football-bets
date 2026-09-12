import { Controller, Inject, Param, Post } from "@nestjs/common";
import { DevService } from "./dev.service.js";

@Controller("dev")
export class DevController {
  constructor(@Inject(DevService) private readonly dev: DevService) {}

  @Post("matches/:id/kickoff")
  kickoff(@Param("id") id: string) {
    return this.dev.kickoff(id);
  }

  @Post("open-round")
  openRound() {
    return this.dev.openRound();
  }

  @Post("close-window")
  closeWindow() {
    return this.dev.closeWindow();
  }

  @Post("resolve-due")
  resolveDue() {
    return this.dev.resolveDue();
  }
}
