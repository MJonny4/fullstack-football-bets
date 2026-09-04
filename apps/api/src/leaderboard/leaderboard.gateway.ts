import { Inject, Logger } from "@nestjs/common";
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import { RoundsService } from "../rounds/rounds.service.js";
import { StandingsService } from "../standings/standings.service.js";
import { LeaderboardService } from "./leaderboard.service.js";

function socketCorsOrigin(): string | string[] | boolean {
  const configured = process.env.CORS_ORIGIN?.trim();
  return configured
    ? configured.split(",").map((value) => value.trim())
    : ["http://localhost:8080", "http://localhost:5173"];
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
    @Inject(LeaderboardService)
    private readonly leaderboard: LeaderboardService,
    @Inject(StandingsService)
    private readonly standings: StandingsService,
    @Inject(RoundsService)
    private readonly rounds: RoundsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const [leaderboard, standings, round] = await Promise.all([
        this.leaderboard.list(),
        this.standings.current(),
        this.rounds.current(),
      ]);
      client.emit("leaderboard:update", leaderboard);
      client.emit("standings:update", standings);
      client.emit("round:update", round);
    } catch (error) {
      this.logger.error("Could not send the initial live tables", error);
    }
  }

  async broadcast() {
    const [entries, standings, round] = await Promise.all([
      this.leaderboard.list(),
      this.standings.current(),
      this.rounds.current(),
    ]);
    this.server?.emit("leaderboard:update", entries);
    this.server?.emit("standings:update", standings);
    this.server?.emit("round:update", round);
    return entries;
  }

  emitTeamUpdate(payload: {
    teamId: string;
    lineupId?: string | null;
    strengthRating?: number;
  }): void {
    this.server?.emit("team:update", payload);
  }
}
