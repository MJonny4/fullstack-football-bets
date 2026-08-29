import { prisma, openNextRound } from "../src/index.js";

const TEAMS = [
  { legacyName: "Northbridge FC", name: "Northpeak Rovers", crestImageUrl: "/teams/northpeakrovers.png", strengthRating: 88 },
  { legacyName: "Royal Castellón", name: "Silverthorn SC", crestImageUrl: "/teams/silverthornsc.png", strengthRating: 85 },
  { legacyName: "Madrid Comets", name: "Vortex United", crestImageUrl: "/teams/vortexunited.png", strengthRating: 82 },
  { legacyName: "Barcelona Mariners", name: "Goldenport City", crestImageUrl: "/teams/goldenportcity.png", strengthRating: 79 },
  { legacyName: "Valencia Fire", name: "Ember Vale FC", crestImageUrl: "/teams/embervalefc.png", strengthRating: 76 },
  { legacyName: "Bilbao Forge", name: "Ironclad United FC", crestImageUrl: "/teams/ironcladunitedfc.png", strengthRating: 74 },
  { legacyName: "Sevilla Orange", name: "Fox Haven SC", crestImageUrl: "/teams/foxhavensc.png", strengthRating: 71 },
  { legacyName: "Vigo Atlantic", name: "Sapphire Coast Athletic", crestImageUrl: "/teams/sapphirecoastathletic.png", strengthRating: 68 },
  { legacyName: "Málaga Suns", name: "Neon City FC", crestImageUrl: "/teams/neoncityfc.png", strengthRating: 65 },
  { legacyName: "Zaragoza Lions", name: "Phantom FC", crestImageUrl: "/teams/phantomfc.png", strengthRating: 62 },
  { legacyName: "Granada Peaks", name: "Cinder Peak FC", crestImageUrl: "/teams/cinderpeakfc.png", strengthRating: 59 },
  { legacyName: "Murcia Garden", name: "Blackthorn City", crestImageUrl: "/teams/blackthorncity.png", strengthRating: 56 },
  { legacyName: "Alicante Waves", name: "Azureton FC", crestImageUrl: "/teams/azuretonfc.png", strengthRating: 53 },
  { legacyName: "Salamanca Gold", name: "Dustfall Rangers", crestImageUrl: "/teams/dustfallrangers.png", strengthRating: 50 },
  { legacyName: "Toledo Shields", name: "Duskfield United", crestImageUrl: "/teams/duskfieldunited.png", strengthRating: 47 },
  { legacyName: "Cádiz Gulls", name: "Stormwatch Athletic", crestImageUrl: "/teams/stormwatchathletic.png", strengthRating: 44 },
  { legacyName: "Oviedo Oaks", name: "Rivenmoor Athletic", crestImageUrl: "/teams/rivenmoorathletic.png", strengthRating: 41 },
  { legacyName: "Pamplona Reds", name: "Crimson Vale", crestImageUrl: "/teams/crimsonvale.png", strengthRating: 38 },
  { legacyName: "Burgos Keep", name: "Stonewall FC", crestImageUrl: "/teams/stonewallfc.png", strengthRating: 34 },
  { legacyName: "Tarragona Tide", name: "Lunarbay FC", crestImageUrl: "/teams/lunarbayfc.png", strengthRating: 30 },
] as const;

async function seed(): Promise<void> {
  const existingTeams = await prisma.team.findMany({
    select: { id: true, name: true },
  });
  const supportedNames = new Set<string>(
    TEAMS.flatMap((team) => [team.legacyName, team.name]),
  );
  const unknownTeams = existingTeams.filter(
    (team) => !supportedNames.has(team.name),
  );

  if (unknownTeams.length > 0) {
    throw new Error(
      `Cannot seed over unknown team rows: ${unknownTeams.map((team) => team.name).join(", ")}.`,
    );
  }

  const existingByName = new Map(
    existingTeams.map((team) => [team.name, team]),
  );
  const writes = TEAMS.map((team) => {
    const legacyTeam = existingByName.get(team.legacyName);
    const currentTeam = existingByName.get(team.name);

    if (legacyTeam && currentTeam) {
      throw new Error(
        `Cannot seed ${team.name}: both the legacy and current team rows exist. Resolve the duplicate without deleting referenced data.`,
      );
    }

    const data = {
      name: team.name,
      strengthRating: team.strengthRating,
      crestImageUrl: team.crestImageUrl,
    };

    const existingTeam = currentTeam ?? legacyTeam;
    return existingTeam
      ? prisma.team.update({ where: { id: existingTeam.id }, data })
      : prisma.team.create({ data });
  });

  await prisma.$transaction(writes);

  const round = await openNextRound(prisma, {
    timezone: process.env.APP_TZ ?? "Europe/Madrid",
    topupAmount: Number(process.env.TOPUP_AMOUNT ?? 200),
  });
  console.info(
    `Seeded ${TEAMS.length} teams; round ${round.weekNumber} ${round.created ? "opened" : "already open"}.`,
  );
}

seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
