export class InsufficientFundsError extends Error {
  readonly code = "INSUFFICIENT_FUNDS";

  constructor(readonly userId: string) {
    super(`User ${userId} has insufficient funds`);
    this.name = "InsufficientFundsError";
  }
}

export class UserNotFoundError extends Error {
  readonly code = "USER_NOT_FOUND";

  constructor(readonly userId: string) {
    super(`User ${userId} does not exist`);
    this.name = "UserNotFoundError";
  }
}

export class MatchNotFoundError extends Error {
  readonly code = "MATCH_NOT_FOUND";

  constructor(readonly matchId: string) {
    super(`Match ${matchId} does not exist`);
    this.name = "MatchNotFoundError";
  }
}
