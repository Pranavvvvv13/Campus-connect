import { readFileSync, writeFileSync } from "node:fs";

// Browser-extracted rows from the official table, excluding its first three people.
const rows = readFileSync(new URL("../lib/faculty-source.tsv", import.meta.url), "utf8")
  .trim().split(/\r?\n/).map(line => line.split("|"));
if (rows.length !== 149 || rows.some((row, index) => row.length !== 7 || Number(row[0]) !== index + 4)) {
  throw new Error("Expected all 149 source rows, in order, from 4 through 152.");
}
const faculty = rows.map(([sourceNumber, name, designation, department, qualification, email, profile]) => ({
  sourceNumber: Number(sourceNumber), name, designation, department, qualification, email,
  profileUrl: profile ? `https://srmrmp.edu.in/wp-content/uploads/${profile}` : null,
}));
if (new Set(faculty.map(person => person.email)).size !== faculty.length) throw new Error("Duplicate faculty email");
writeFileSync(new URL("../lib/faculty-data.json", import.meta.url), JSON.stringify({
  sourceUrl: "https://srmrmp.edu.in/academics/artificial-intelligence/faculty/",
  retrievedOn: "2026-09-28", excludedLeadingEntries: 3, faculty,
}, null, 2) + "\n");
console.log(`Imported ${faculty.length} faculty; ${faculty.filter(person => person.profileUrl).length} profile links.`);
