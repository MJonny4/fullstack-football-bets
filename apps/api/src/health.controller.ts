import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { prisma } from "@fb/core";

@Controller("health")
export class HealthController {
  @Get()
  async health() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "ok" };
    } catch {
      throw new ServiceUnavailableException("Database unavailable");
    }
  }
}
