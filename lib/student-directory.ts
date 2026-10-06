import type { Profile } from "./workspace-model";

export type StudentPortfolio = {
  id: string; name: string; department: string; year: number; mock: boolean;
  portfolio: Pick<Profile, "headline" | "about" | "skills" | "github" | "linkedin" | "website" | "projects" | "achievements">;
};
const examples = [
  ["Aarav Menon", "Computer Science & Engineering", 3, "React, TypeScript, Accessibility", "Accessible campus navigator", "A keyboard-friendly campus map with accessible routes and building search.", "Inclusive design", "Finalist in a fictional campus innovation challenge."],
  ["Nila Krishnan", "Computer Science & Engineering", 2, "Python, Machine Learning, Pandas", "Waste sorting assistant", "An image classification prototype exploring recyclable waste detection.", "Data science", "Completed a fictional student research showcase."],
  ["Rohan Shah", "Electronics & Communication", 4, "IoT, C++, Embedded Systems", "Smart energy monitor", "A sensor dashboard measuring classroom energy use and identifying trends.", "Embedded systems", "Presented a fictional final-year engineering project."],
  ["Ishani Rao", "Information Technology", 3, "Figma, React, UI Design", "Student wellbeing journal", "A privacy-conscious journaling interface with accessible daily check-ins.", "Product design", "Winner of a fictional campus design sprint."],
  ["Kavin Das", "Mechanical Engineering", 2, "CAD, Python, Robotics", "Assistive gripper prototype", "A simulated robotic gripper designed to handle everyday objects.", "Robotics", "Participated in a fictional student robotics exhibition."],
  ["Maya Sen", "Information Technology", 1, "JavaScript, HTML, CSS", "Community book exchange", "A searchable catalogue that helps students exchange used textbooks.", "Web development", "Completed a fictional introductory web development workshop."],
  ["Aditya Bose", "Computer Science & Engineering", 4, "Python, SQL, Data Analytics", "Water usage analytics", "A dashboard exploring water consumption patterns using synthetic data.", "Sustainability", "Received a fictional student project showcase award."],
  ["Tara Nair", "Electronics & Communication", 1, "Arduino, C++, Prototyping", "Air quality display", "A classroom display prototype using simulated sensor measurements.", "Hardware prototyping", "Participated in a fictional first-year maker workshop."],
] as const;
export const mockStudents: StudentPortfolio[] = examples.map(([name, department, year, skills, title, description, interest, achievement], index) => ({
  id: `MOCK-STU-${String(index + 1).padStart(3, "0")}`, name, department, year, mock: true,
  portfolio: { headline: `Year ${year} · ${interest}`, about: `Fictional student interested in ${interest.toLowerCase()}. This portfolio is sample data for exploring the faculty directory.`, skills, github: "", linkedin: "", website: "", projects: [{title, description, url:""}], achievements: [{title:"Sample milestone", description:achievement, url:""}] },
}));
export function filterStudents(students: StudentPortfolio[], query: string, department: string, year: string, skill: string) {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return students.filter(student => {
    const text = [student.name,student.id,student.department,`year ${student.year}`,student.portfolio.headline,student.portfolio.about,student.portfolio.skills,...student.portfolio.projects.flatMap(project=>[project.title,project.description]),...student.portfolio.achievements.flatMap(entry=>[entry.title,entry.description])].join(" ").toLowerCase();
    return terms.every(term=>text.includes(term)) && (!department || student.department===department) && (!year || String(student.year)===year) && (!skill || student.portfolio.skills.split(",").some(value=>value.trim().toLowerCase()===skill.toLowerCase()));
  }).sort((a,b)=>a.name.localeCompare(b.name));
}
