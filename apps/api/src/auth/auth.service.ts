import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";
import { createUserWithInitialBalance, prisma } from "@fb/core";
import { LeaderboardGateway } from "../leaderboard/leaderboard.gateway.js";
import { isPrismaError } from "../common/prisma-errors.js";
import type { CredentialsDto } from "./auth.dto.js";

function startingBalance(): number {
  const value = Number(process.env.INITIAL_COIN_BALANCE ?? 1_000);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error("INITIAL_COIN_BALANCE must be a positive integer");
  }
  return value;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(JwtService)
    private readonly jwt: JwtService,
    @Inject(LeaderboardGateway)
    private readonly leaderboard: LeaderboardGateway,
  ) {}

  async signup(credentials: CredentialsDto) {
    const passwordHash = await hash(credentials.password, 12);

    try {
      const user = await createUserWithInitialBalance(prisma, {
        email: credentials.email,
        passwordHash,
        initialBalance: startingBalance(),
      });
      await this.leaderboard.broadcast();
      return this.createSession(user);
    } catch (error) {
      if (isPrismaError(error, "P2002")) {
        throw new ConflictException("An account with that email already exists");
      }
      throw error;
    }
  }

  async login(credentials: CredentialsDto) {
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
    });
    if (!user || !(await compare(credentials.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid email or password");
    }
    return this.createSession(user);
  }

  private async createSession(user: {
    id: string;
    email: string;
    coinBalance: number;
    createdAt: Date;
  }) {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
    });
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        coinBalance: user.coinBalance,
        createdAt: user.createdAt,
      },
    };
  }
}
