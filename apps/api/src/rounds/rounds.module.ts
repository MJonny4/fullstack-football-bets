import { Module } from "@nestjs/common";
import { RoundsController } from "./rounds.controller.js";
import { RoundsService } from "./rounds.service.js";

@Module({
  controllers: [RoundsController],
  providers: [RoundsService],
  exports: [RoundsService],
})
export class RoundsModule {}
