import { Inject, Logger } from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets";
import { prisma, readLiveSummary } from "@fb/core";
import type { Server, Socket } from "socket.io";
import { RoundsService } from "../rounds/rounds.service.js";
import { StandingsService } from "../standings/standings.service.js";
import { LeaderboardService } from "./leaderboard.service.js";
import { MatchAudienceService } from "./match-audience.service.js";
import { MatchSnapshotService } from "./match-snapshot.service.js";

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
export class LeaderboardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(LeaderboardGateway.name);
  private readonly roomChanges = new WeakMap<Socket, Promise<void>>();

  @WebSocketServer()
  server?: Server;

  constructor(
    @Inject(LeaderboardService)
    private readonly leaderboard: LeaderboardService,
    @Inject(StandingsService)
    private readonly standings: StandingsService,
    @Inject(RoundsService)
    private readonly rounds: RoundsService,
    @Inject(MatchAudienceService) private readonly audience: MatchAudienceService,
    @Inject(MatchSnapshotService) private readonly snapshots: MatchSnapshotService,
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

  handleDisconnect(client: Socket) {
    void this.unwatch(client).catch(error => this.logger.warn(`Could not leave match room: ${String(error)}`));
  }

  /** Serialize room changes only, never slow snapshot reads. */
  private changeMatchRoom(client: Socket, matchId: string | null, token: symbol): Promise<void> {
    const change = (this.roomChanges.get(client) ?? Promise.resolve()).catch(() => undefined).then(async () => {
      if (client.data.matchWatchToken !== token) return;
      for (const room of [...client.rooms]) if (room.startsWith("match:")) await client.leave(room);
      if (matchId && client.connected && client.data.matchWatchToken === token) await client.join(`match:${matchId}`);
    });
    this.roomChanges.set(client, change);
    return change;
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

  @SubscribeMessage("match:watch")
  async watch(@ConnectedSocket() client: Socket, @MessageBody() matchId: unknown) {
    if (typeof matchId !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(matchId)) return { error: "Invalid match" };
    // One detailed match subscription per connection. Join before reading the
    // checkpoint; clients reconcile messages racing with this initial snapshot.
    const lastWatch = Number(client.data.lastWatch ?? 0);
    if (Date.now() - lastWatch < 250) return { error: "Please retry shortly" };
    client.data.lastWatch = Date.now();
    const token = Symbol("match watch");
    client.data.matchWatchToken = token;
    this.audience.unwatch(client.id);
    const isCurrent = () => client.connected && client.data.matchWatchToken === token;
    try {
      await this.changeMatchRoom(client, matchId, token);
      if (!isCurrent()) return { error: "Subscription superseded" };
      this.audience.watch(client.id, matchId);
      const snapshot = await this.snapshots.get(matchId);
      if (!isCurrent()) return { error: "Subscription superseded" };
      client.emit("match:snapshot", snapshot);
      return { watching: matchId };
    } catch {
      // An old request failing after a route change must not unwatch the new match.
      if (isCurrent()) await this.unwatch(client);
      return { error: "Match unavailable" };
    }
  }

  @SubscribeMessage("match:unwatch")
  async unwatch(@ConnectedSocket() client: Socket) {
    const token = Symbol("match unwatch");
    client.data.matchWatchToken = token;
    this.audience.unwatch(client.id);
    await this.changeMatchRoom(client, null, token);
  }

  async broadcastMatch(matchId: string, settled = false) {
    this.snapshots.invalidate(matchId);
    // No spectators: do not load or serialize the detailed match/timeline.
    if (!this.server || this.server.engine.clientsCount === 0) return;
    const viewers = this.server.sockets.adapter.rooms.get(`match:${matchId}`)?.size ?? 0;
    if (viewers > 0) {
      const match = await this.snapshots.get(matchId);
      if (!match.live) return;
      const { home, away, events, ball, possession, ...summary } = match.live;
      this.server.emit("match:summary", summary);
      this.server.to(`match:${matchId}`).emit("match:live:update", match);
    } else {
      const summary = await readLiveSummary(prisma, matchId);
      if (summary) this.server.emit("match:summary", summary);
    }
    if (settled) {
      this.server?.emit("match:finished", { matchId });
      await this.broadcast();
    }
  }

  emitTeamUpdate(payload: {
    teamId: string;
    lineupId?: string | null;
    strengthRating?: number;
  }): void {
    this.server?.emit("team:update", payload);
  }
}
