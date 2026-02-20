
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Seeding database...');

    // 1. Clean up (YES, this resets the DB as requested)
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
    // We add ALL fighters for the event here
    const fighters = [
        // Main Event
        { id: "strickland", name: "Sean Strickland", record: "29-7-0" },
        { id: "hernandez", name: "Anthony Hernandez", record: "15-2-0" },
        // Co-Main
        { id: "neal", name: "Geoff Neal", record: "16-7-0" },
        { id: "medic", name: "Uroš Medić", record: "12-3-0" },
        // Main Card
        { id: "ige", name: "Dan Ige", record: "19-10-0" },
        { id: "costa", name: "Melquizael Costa", record: "25-7-0" },
        { id: "spivac", name: "Serghei Spivac", record: "17-6-0" },
        { id: "delija", name: "Ante Delija", record: "26-7-0" },
        { id: "smith", name: "Jacobe Smith", record: "11-0-0" },
        { id: "harrell", name: "Josiah Harrell", record: "11-0-0" },
        { id: "reese", name: "Zach Reese", record: "10-2-0" },
        { id: "pereira", name: "Michel Pereira", record: "31-14-0" },
        // Prelims
        { id: "njokuani", name: "Chidi Njokuani", record: "25-11-0" },
        { id: "leal", name: "Carlos Leal", record: "22-7-0" },
        { id: "osbourne", name: "Ode Osbourne", record: "13-9-0" },
        { id: "idiris", name: "Alibi Idiris", record: "11-1-0" },
        { id: "gurule", name: "Luis Gurule", record: "10-2-0" },
        { id: "coria", name: "Alden Coria", record: "11-3-0" },
        { id: "cornolle", name: "Nora Cornolle", record: "9-3-0" },
        { id: "edwards", name: "Joselyne Edwards", record: "16-6-0" },
        { id: "soriano", name: "Punahele Soriano", record: "12-4-0" },
        { id: "brahimaj", name: "Ramiz Brahimaj", record: "13-5-0" },
        { id: "rowe", name: "Phil Rowe", record: "11-6-0" },
        { id: "lebosnoyani", name: "Jean-Paul Lebosnoyani", record: "9-2-0" },
        { id: "delvalle", name: "Yadier del Valle", record: "10-0-0" },
        { id: "leavitt", name: "Jordan Leavitt", record: "12-3-0" },
        { id: "judice", name: "Carli Judice", record: "5-2-0" },
        { id: "miller", name: "Juliana Miller", record: "5-3-0" }
    ];

    for (const f of fighters) {
        await prisma.fighter.create({ data: f });
    }

    // 5. Events & Fights
    await prisma.event.create({
        data: {
            id: "ufn-strickland-hernandez",
            name: "UFC Fight Night: Strickland vs. Hernandez",
            date: new Date("2026-02-21T20:00:00-05:00"), // Set to slightly in future or adjust as needed
            location: "Toyota Center, Houston, TX",
            status: "SCHEDULED",
            fights: {
                create: [
                    // --- MAIN CARD ---
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
                    },
                    {
                        id: "fs-ige-costa",
                        fighterAId: "ige",
                        fighterBId: "costa",
                        division: "Featherweight",
                        rounds: 3,
                        status: "SCHEDULED"
                    },
                    {
                        id: "fs-spivac-delija",
                        fighterAId: "spivac",
                        fighterBId: "delija",
                        division: "Heavyweight",
                        rounds: 3,
                        status: "SCHEDULED"
                    },
                    {
                        id: "fs-smith-harrell",
                        fighterAId: "smith",
                        fighterBId: "harrell",
                        division: "Welterweight",
                        rounds: 3,
                        status: "SCHEDULED"
                    },
                    {
                        id: "fs-reese-pereira",
                        fighterAId: "reese",
                        fighterBId: "pereira",
                        division: "Middleweight",
                        rounds: 3,
                        status: "SCHEDULED"
                    },
                    // --- PRELIMS ---
                    {
                        id: "fs-njokuani-leal",
                        fighterAId: "njokuani",
                        fighterBId: "leal",
                        division: "Welterweight",
                        rounds: 3,
                        isMainCard: false,
                        isPrelim: true,
                        status: "SCHEDULED"
                    },
                    {
                        id: "fs-osbourne-idiris",
                        fighterAId: "osbourne",
                        fighterBId: "idiris",
                        division: "Flyweight",
                        rounds: 3,
                        isMainCard: false,
                        isPrelim: true,
                        status: "SCHEDULED"
                    },
                    {
                        id: "fs-gurule-coria",
                        fighterAId: "gurule",
                        fighterBId: "coria",
                        division: "Flyweight",
                        rounds: 3,
                        isMainCard: false,
                        isPrelim: true,
                        status: "SCHEDULED"
                    },
                    {
                        id: "fs-cornolle-edwards",
                        fighterAId: "cornolle",
                        fighterBId: "edwards",
                        division: "Women's Bantamweight",
                        rounds: 3,
                        isMainCard: false,
                        isPrelim: true,
                        status: "SCHEDULED"
                    },
                    {
                        id: "fs-soriano-brahimaj",
                        fighterAId: "soriano",
                        fighterBId: "brahimaj",
                        division: "Welterweight",
                        rounds: 3,
                        isMainCard: false,
                        isPrelim: true,
                        status: "SCHEDULED"
                    },
                    {
                        id: "fs-rowe-lebosnoyani",
                        fighterAId: "rowe",
                        fighterBId: "lebosnoyani",
                        division: "Welterweight",
                        rounds: 3,
                        isMainCard: false,
                        isPrelim: true,
                        status: "SCHEDULED"
                    },
                    {
                        id: "fs-delvalle-leavitt",
                        fighterAId: "delvalle",
                        fighterBId: "leavitt",
                        division: "Featherweight",
                        rounds: 3,
                        isMainCard: false,
                        isPrelim: true,
                        status: "SCHEDULED"
                    },
                    {
                        id: "fs-judice-miller",
                        fighterAId: "judice",
                        fighterBId: "miller",
                        division: "Women's Flyweight",
                        rounds: 3,
                        isPrelim: true,
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
