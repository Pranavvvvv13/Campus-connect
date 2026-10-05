export type Role = "Student" | "Faculty" | "Admin";
export type DemoSession = { role: Role; name: string; email: string; universityId: string };
export const demoDirectory: Record<string, DemoSession> = {
  "STU-2026-001": { role: "Student", name: "Pranav Iyer", email: "pranav.iyer@university.edu", universityId: "STU-2026-001" },
  "FAC-2026-001": { role: "Faculty", name: "Dr. Meera Raman", email: "meera.raman@university.edu", universityId: "FAC-2026-001" },
  "ADM-2026-001": { role: "Admin", name: "Campus Administrator", email: "admin@university.edu", universityId: "ADM-2026-001" },
};
