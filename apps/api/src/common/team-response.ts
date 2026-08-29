interface DecimalTeamRatings {
  strengthRating: unknown;
  attackRating: unknown;
  midfieldRating: unknown;
  defenseRating: unknown;
  goalkeeperRating: unknown;
}

/** Prisma decimals are serialized as strings unless the API maps them. */
export function serializeTeam<TTeam extends DecimalTeamRatings>(team: TTeam) {
  return {
    ...team,
    strengthRating: Number(team.strengthRating),
    attackRating: Number(team.attackRating),
    midfieldRating: Number(team.midfieldRating),
    defenseRating: Number(team.defenseRating),
    goalkeeperRating: Number(team.goalkeeperRating),
  };
}
