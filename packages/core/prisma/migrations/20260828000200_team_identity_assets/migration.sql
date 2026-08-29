-- Replace the original placeholder identities in place so every Team id and
-- its Match/DTAssignment relationships remain intact.
UPDATE "Team" AS team
SET
    "name" = team_identity."newName",
    "crestImageUrl" = team_identity."crestImageUrl",
    "strengthRating" = team_identity."strengthRating"
FROM (
    VALUES
        ('Northbridge FC', 'Northpeak Rovers', '/teams/northpeakrovers.png', 88),
        ('Royal Castellón', 'Silverthorn SC', '/teams/silverthornsc.png', 85),
        ('Madrid Comets', 'Vortex United', '/teams/vortexunited.png', 82),
        ('Barcelona Mariners', 'Goldenport City', '/teams/goldenportcity.png', 79),
        ('Valencia Fire', 'Ember Vale FC', '/teams/embervalefc.png', 76),
        ('Bilbao Forge', 'Ironclad United FC', '/teams/ironcladunitedfc.png', 74),
        ('Sevilla Orange', 'Fox Haven SC', '/teams/foxhavensc.png', 71),
        ('Vigo Atlantic', 'Sapphire Coast Athletic', '/teams/sapphirecoastathletic.png', 68),
        ('Málaga Suns', 'Neon City FC', '/teams/neoncityfc.png', 65),
        ('Zaragoza Lions', 'Phantom FC', '/teams/phantomfc.png', 62),
        ('Granada Peaks', 'Cinder Peak FC', '/teams/cinderpeakfc.png', 59),
        ('Murcia Garden', 'Blackthorn City', '/teams/blackthorncity.png', 56),
        ('Alicante Waves', 'Azureton FC', '/teams/azuretonfc.png', 53),
        ('Salamanca Gold', 'Dustfall Rangers', '/teams/dustfallrangers.png', 50),
        ('Toledo Shields', 'Duskfield United', '/teams/duskfieldunited.png', 47),
        ('Cádiz Gulls', 'Stormwatch Athletic', '/teams/stormwatchathletic.png', 44),
        ('Oviedo Oaks', 'Rivenmoor Athletic', '/teams/rivenmoorathletic.png', 41),
        ('Pamplona Reds', 'Crimson Vale', '/teams/crimsonvale.png', 38),
        ('Burgos Keep', 'Stonewall FC', '/teams/stonewallfc.png', 34),
        ('Tarragona Tide', 'Lunarbay FC', '/teams/lunarbayfc.png', 30)
) AS team_identity("legacyName", "newName", "crestImageUrl", "strengthRating")
WHERE team."name" = team_identity."legacyName";
