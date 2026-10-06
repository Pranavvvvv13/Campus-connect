import test from "node:test";
import assert from "node:assert/strict";
import { mockStudents, filterStudents } from "../lib/student-directory.ts";
test("student directory searches names, IDs and project keywords with combined filters",()=>{
  assert.equal(mockStudents.length,8);
  assert.ok(mockStudents.every(student=>student.mock));
  assert.equal(filterStudents(mockStudents,"MOCK-STU-002","","","")[0].name,"Nila Krishnan");
  assert.equal(filterStudents(mockStudents,"energy","Electronics & Communication","4","C++")[0].name,"Rohan Shah");
  assert.equal(filterStudents(mockStudents,"energy","","1","").length,0);
  assert.equal(filterStudents(mockStudents,"NILA waste","","","").length,1);
  assert.equal(filterStudents(mockStudents,"no such student","","","").length,0);
});
