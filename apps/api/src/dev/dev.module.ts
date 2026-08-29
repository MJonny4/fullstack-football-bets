import { Module } from "@nestjs/common";
import { LeaderboardModule } from "../leaderboard/leaderboard.module.js";
import { DevController } from "./dev.controller.js";
import { DevService } from "./dev.service.js";
import { resultEngineProvider } from "./result-engine.provider.js";

@Module({
  imports: [LeaderboardModule],
  controllers: [DevController],
  providers: [DevService, resultEngineProvider],
})
export class DevModule {}
