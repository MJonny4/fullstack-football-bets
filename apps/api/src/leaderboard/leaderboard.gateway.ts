import { Logger } from "@nestjs/common";
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import { StandingsService } from "../standings/standings.service.js";
import { LeaderboardService } from "./leaderboard.service.js";

function socketCorsOrigin(): string | string[] | boolean {
  const configured = process.env.CORS_ORIGIN?.trim();
  return configured ? configured.split(",").map((value) => value.trim()) : true;
}

@WebSocketGateway({
  cors: { origin: socketCorsOrigin(), credentials: true },
  transports: ["websocket", "polling"],
})
export class LeaderboardGateway implements OnGatewayConnection {
  private readonly logger = new Logger(LeaderboardGateway.name);

  @WebSocketServer()
  server?: Server;

  constructor(
    private readonly leaderboard: LeaderboardService,
    private readonly standings: StandingsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const [leaderboard, standings] = await Promise.all([
        this.leaderboard.list(),
        this.standings.current(),
      ]);
      client.emit("leaderboard:update", leaderboard);
      client.emit("standings:update", standings);
    } catch (error) {
      this.logger.error("Could not send the initial live tables", error);
    }
  }

  async broadcast() {
    const [entries, standings] = await Promise.all([
      this.leaderboard.list(),
      this.standings.current(),
    ]);
    this.server?.emit("leaderboard:update", entries);
    this.server?.emit("standings:update", standings);
    return entries;
  }
}
