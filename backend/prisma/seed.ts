import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // 1. Clean up
    await prisma.bet.deleteMany();
    await prisma.survivorPick.deleteMany();
    await prisma.leagueMember.deleteMany();
    await prisma.league.deleteMany();
    await prisma.fight.deleteMany();
    await prisma.fighter.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();

    // 2. Users
    const users = [
        { id: 'me', username: 'You', email: 'me@example.com' },
        { id: 'u1', username: 'AlexVolk', email: 'volk@example.com' },
        { id: 'u2', username: 'IzzyStyle', email: 'izzy@example.com' },
        { id: 'u3', username: 'DoBronxs', email: 'charles@example.com' },
        { id: 'u4', username: 'Poatan', email: 'alex@example.com' },
    ];

    for (const u of users) {
        await prisma.user.create({ data: u });
    }

    // 3. Leagues
    const leagues = [
        {
            id: "l1",
            name: "Office Fight Club",
            code: "FIGHT1",
            adminId: "u1",
            members: ["u1", "u2", "me"],
            survivorEnabled: true,
            scoringSettings: { winner: 10, method: 5, round: 10, decision: 10 }
        },
        {
            id: "l2",
            name: "MMAGuru Community",
            code: "GURU99",
            adminId: "u3",
            members: ["u3", "u4", "me"],
            survivorEnabled: false,
            scoringSettings: { winner: 10, method: 5, round: 10, decision: 10 }
        }
    ];

    for (const l of leagues) {
        await prisma.league.create({
            data: {
                id: l.id,
                name: l.name,
                code: l.code,
                adminId: l.adminId,
                survivorEnabled: l.survivorEnabled,
                scoringSettings: l.scoringSettings,
                members: {
                    create: l.members.map(uid => ({
                        user: { connect: { id: uid } }
                    }))
                }
            }
        });
    }

    // 4. Fighters
    const fighters = [
        { id: "strickland", name: "Sean Strickland", record: "29-6-0" },
        { id: "hernandez", name: "Anthony Hernandez", record: "14-2-0" },
        { id: "bautista", name: "Mario Bautista", record: "14-2-0" },
        { id: "v-oliveira", name: "Vinicius Oliveira", record: "21-4-0" },
        // Add dummy fighters for other fights if needed to avoid relation errors
        { id: "neal", name: "Geoff Neal", record: "16-5-0" },
        { id: "medic", name: "Uroš Medić", record: "9-2-0" }
    ];

    for (const f of fighters) {
        await prisma.fighter.create({ data: f });
    }

    // 5. Events & Fights
    await prisma.event.create({
        data: {
            id: "ufn-strickland-hernandez",
            name: "UFC Fight Night: Strickland vs. Hernandez",
            date: new Date("2026-02-22T01:00:00Z"),
            location: "Toyota Center, Houston, TX",
            status: "SCHEDULED",
            fights: {
                create: [
                    {
                        id: "fs-main",
                        fighterAId: "strickland",
                        fighterBId: "hernandez",
                        division: "Middleweight",
                        rounds: 5,
                        isMainEvent: true,
                        status: "SCHEDULED"
                    },
                    {
                        id: "fs-comain",
                        fighterAId: "neal",
                        fighterBId: "medic",
                        division: "Welterweight",
                        rounds: 3,
                        isCoMainEvent: true,
                        status: "SCHEDULED"
                    }
                ]
            }
        }
    });

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
