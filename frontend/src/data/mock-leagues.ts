import { League } from "@/types";

export type { League };

export const MOCK_LEAGUES: League[] = [
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
