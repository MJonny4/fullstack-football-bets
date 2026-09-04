interface UserIdentity {
  id: string;
  email: string;
  username: string;
  displayName: string;
  coinBalance: number;
  avatarUpdatedAt: Date | null;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PublicIdentity {
  username: string;
  displayName: string;
  avatarUpdatedAt?: Date | null;
}

export function avatarUrl(user: Pick<PublicIdentity, "username" | "avatarUpdatedAt">): string | null {
  return user.avatarUpdatedAt
    ? `/api/users/${encodeURIComponent(user.username)}/avatar?v=${user.avatarUpdatedAt.getTime()}`
    : null;
}

export function privateUserResponse(user: UserIdentity) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: avatarUrl(user),
    emailVerified: Boolean(user.emailVerifiedAt),
    coinBalance: user.coinBalance,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function publicUserResponse(user: PublicIdentity) {
  return {
    username: user.username,
    displayName: user.displayName,
    avatarUrl: avatarUrl(user),
  };
}
