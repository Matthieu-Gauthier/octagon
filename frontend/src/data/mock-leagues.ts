import { League } from "@/types";

export type { League };

// Local mock override — members are stored as string[] in mocks
type MockLeague = Omit<League, 'members'> & { members: string[] };

export const MOCK_LEAGUES: MockLeague[] = [
    {
        id: "l1",
        name: "Office Fight Club",
        code: "FIGHT1",
        adminId: "u1",
        isArchived: false,
        members: ["u1", "u2", "me"],
        survivorEnabled: true,
        scoringSettings: { winner: 10, method: 5, round: 10, decision: 10 }
    },
    {
        id: "l2",
        name: "MMAGuru Community",
        code: "GURU99",
        adminId: "u3",
        isArchived: false,
        members: ["u3", "u4", "me"],
        survivorEnabled: false,
        scoringSettings: { winner: 10, method: 5, round: 10, decision: 10 }
    }
];
