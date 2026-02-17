export interface League {
    id: string;
    name: string;
    code: string; // 6-character invite code
    adminId: string;
    members: string[]; // User IDs
    survivorEnabled: boolean;
}

export const MOCK_LEAGUES: League[] = [
    {
        id: "l1",
        name: "Office Fight Club",
        code: "FIGHT1",
        adminId: "u1",
        members: ["u1", "u2", "me"],
        survivorEnabled: true,
    },
    {
        id: "l2",
        name: "MMAGuru Community",
        code: "GURU99",
        adminId: "u3",
        members: ["u3", "u4", "me"],
        survivorEnabled: false,
    }
];
