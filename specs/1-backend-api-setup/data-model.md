# Data Model

## Prisma Schema (Draft)

```prisma
// This is the source of truth for the database schema

model User {
  id        String   @id // Supabase UUID
  email     String   @unique
  username  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  leagues      LeagueMember[]
  leaguesOwned League[]
  bets         Bet[]
  survivorPicks SurvivorPick[]
}

model League {
  id              String   @id @default(uuid())
  name            String
  code            String   @unique // 6-char invite code
  survivorEnabled Boolean  @default(false)
  isArchived      Boolean  @default(false)
  createdAt       String   // stored as ISO string or DateTime? DateTime preferred.
  adminId         String
  admin           User     @relation(fields: [adminId], references: [id])
  
  members         LeagueMember[]
  bets            Bet[]
  survivorPicks   SurvivorPick[]
  
  // Scoring settings stored as JSON or separate fields?
  // MVP: JSON since it varies
  scoringSettings Json     @default("{\"winner\": 10, \"method\": 5, \"round\": 5}") 
}

model LeagueMember {
  id        String   @id @default(uuid())
  leagueId  String
  userId    String
  role      String   @default("MEMBER") // MEMBER, ADMIN
  joinedAt  DateTime @default(now())

  league    League   @relation(fields: [leagueId], references: [id])
  user      User     @relation(fields: [userId], references: [id])

  @@unique([leagueId, userId])
}

model Event {
  id        String   @id // internal string ID like 'ufc-300' or UUID? Mock uses string slugs.
  name      String
  date      DateTime
  location  String
  status    String   // SCHEDULED, LIVE, FINISHED
  
  fights    Fight[]
}

model Fighter {
  id        String   @id // slug like 'jon-jones'
  name      String
  record    String
  imagePath String?  // Local asset path
  
  fightsA   Fight[]  @relation("FighterA")
  fightsB   Fight[]  @relation("FighterB")
}

model Fight {
  id          String   @id // slug 'fb-main'
  eventId     String
  fighterAId  String
  fighterBId  String
  division    String
  rounds      Int
  isMainEvent Boolean  @default(false)
  isMainCard  Boolean  @default(true)
  status      String   @default("SCHEDULED") // SCHEDULED, LIVE, FINISHED
  
  // Result
  winnerId    String?
  method      String?  // KO/TKO, SUBMISSION, DECISION, DRAW, NC
  round       Int?
  time        String?

  event       Event    @relation(fields: [eventId], references: [id])
  fighterA    Fighter  @relation("FighterA", fields: [fighterAId], references: [id])
  fighterB    Fighter  @relation("FighterB", fields: [fighterBId], references: [id])
  
  bets        Bet[]
  survivorPicks SurvivorPick[]
}

model Bet {
  id        String   @id @default(uuid())
  leagueId  String
  userId    String
  fightId   String
  
  winnerId  String
  method    String?
  round     Int?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  league    League   @relation(fields: [leagueId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
  fight     Fight    @relation(fields: [fightId], references: [id])

  @@unique([leagueId, userId, fightId])
}

model SurvivorPick {
  id        String   @id @default(uuid())
  leagueId  String
  userId    String
  fightId   String
  eventId   String // Denormalized for easy queries per event
  
  fighterId String // Who they picked to win
  status    String @default("PENDING") // PENDING, WON, LOST, DRAW, NC
  
  createdAt DateTime @default(now())

  league    League   @relation(fields: [leagueId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
  fight     Fight    @relation(fields: [fightId], references: [id])

  @@unique([leagueId, userId, fightId])
}
```
