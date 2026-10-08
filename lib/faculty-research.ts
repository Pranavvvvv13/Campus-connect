import snapshot from "./faculty-research.json";

export const researchRetrievedOn = snapshot.retrievedOn;
export const facultyResearch = new Map(snapshot.faculty.map(record => [record.email, record]));
export const verifiedResearchCount = snapshot.faculty.filter(record => record.status === "verified").length;

export function researchSearchText(email: string) {
  const record = facultyResearch.get(email);
  return record?.status === "verified" ? record.interests?.join(" ") ?? "" : "";
}
