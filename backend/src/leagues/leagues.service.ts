import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeaguesService {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        // Ensure admin user exists in local DB
        const { adminId, adminEmail } = data;

        if (adminId && adminEmail) {
            await this.prisma.user.upsert({
                where: { id: adminId },
                update: {}, // No update needed if exists
                create: {
                    id: adminId,
                    email: adminEmail,
                    username: adminEmail.split('@')[0], // Fallback username
                },
            });
        }

        // Remove helper fields that are not in League model
        delete data.adminEmail;

        // Generate unique code if not provided
        if (!data.code) {
            data.code = await this.generateUniqueCode();
        }
        return this.prisma.league.create({ data });
    }

    private async generateUniqueCode(): Promise<string> {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        let isUnique = false;

        while (!isUnique) {
            code = '';
            for (let i = 0; i < 6; i++) {
                code += characters.charAt(Math.floor(Math.random() * characters.length));
            }

            const existing = await this.prisma.league.findUnique({ where: { code } });
            if (!existing) isUnique = true;
        }
        return code;
    }

    async findAll(userId: string) {
        return this.prisma.league.findMany({
            where: {
                isArchived: false,
                members: {
                    some: {
                        userId: userId
                    }
                }
            },
            include: { admin: true, _count: { select: { members: true } } },
        });
    }

    async findOne(id: string) {
        const league = await this.prisma.league.findUnique({
            where: { id },
            include: {
                admin: true,
                members: { include: { user: true } },
            },
        });
        if (!league) throw new NotFoundException(`League with ID ${id} not found`);
        return league;
    }

    async update(id: string, data: Prisma.LeagueUncheckedUpdateInput) {
        return this.prisma.league.update({ where: { id }, data });
    }

    async remove(id: string) {
        return this.prisma.league.update({
            where: { id },
            data: { isArchived: true },
        });
    }

    async join(code: string, userId: string, email?: string) {
        const league = await this.prisma.league.findUnique({ where: { code } });
        if (!league) throw new NotFoundException('Invalid league code');

        // Ensure user exists
        if (email) {
            await this.prisma.user.upsert({
                where: { id: userId },
                update: {},
                create: {
                    id: userId,
                    email: email,
                    username: email.split('@')[0],
                },
            });
        }

        try {
            return await this.prisma.leagueMember.create({
                data: {
                    leagueId: league.id,
                    userId,
                    role: 'MEMBER',
                },
            });
        } catch (e) {
            if ((e as Prisma.PrismaClientKnownRequestError).code === 'P2002') throw new BadRequestException('Already a member');
            throw e;
        }
    }

    async getStandings(leagueId: string) {
        const league = await this.prisma.league.findUnique({
            where: { id: leagueId },
            include: {
                // scoringSettings is JSON, so we just access it. No explicit include needed if it's a field, but check Prisma behavior.
                // Wait, JSON fields are included by default.
                members: {
                    include: {
                        user: true,
                    }
                },
                bets: {
                    include: {
                        fight: true,
                    }
                }
            }
        });

        if (!league) throw new NotFoundException('League not found');

        const defaultSettings = { winner: 10, method: 5, round: 5, decision: 0 };
        const settings = { ...defaultSettings, ...(league.scoringSettings as object || {}) };

        // Group bets by user
        const betsByUser = new Map<string, any[]>();
        league.bets.forEach(bet => {
            if (!betsByUser.has(bet.userId)) betsByUser.set(bet.userId, []);
            betsByUser.get(bet.userId)!.push(bet);
        });

        // Calculate points
        const standings = league.members.map(member => {
            const userBets = betsByUser.get(member.userId) || [];
            let points = 0;
            let perfectPicks = 0;
            let betsPlaced = 0;

            let correctWinners = 0;

            for (const bet of userBets) {
                const fight = bet.fight;
                if (fight.status === 'FINISHED' && fight.winnerId) {
                    betsPlaced++;

                    // Check Winner
                    if (bet.winnerId === fight.winnerId) {
                        correctWinners++;
                        points += (settings.winner || 10);

                        // Check Method
                        let methodCorrect = false;
                        if (bet.method && fight.method && bet.method === fight.method) {
                            points += (settings.method || 5);
                            methodCorrect = true;
                        }

                        // Check Round or Decision
                        const isDecisionPerfect = methodCorrect && (bet.method === "DECISION" || bet.method === "DRAW");
                        let roundCorrect = false;

                        if (isDecisionPerfect) {
                            points += (settings.decision !== undefined ? settings.decision : 10);
                        } else if (bet.round && fight.round && bet.round === fight.round) {
                            points += (settings.round || 5);
                            roundCorrect = true;
                        }

                        if (methodCorrect && (roundCorrect || isDecisionPerfect)) perfectPicks++;
                    }
                }
            }

            return {
                userId: member.userId,
                username: member.user.username,
                points,
                correct: correctWinners,
                total: betsPlaced,
                betsPlaced,
                perfectPicks,
                rank: 0,
            };
        });

        // Sort by points desc
        standings.sort((a, b) => b.points - a.points);

        // Assign Ranks
        standings.forEach((entry, index) => {
            entry.rank = index + 1;
        });

        return standings;
    }
}
