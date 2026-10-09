import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const roster=JSON.parse(readFileSync(new URL('../lib/faculty-data.json',import.meta.url),'utf8'));
const research=JSON.parse(readFileSync(new URL('../lib/faculty-research.json',import.meta.url),'utf8'));
test('research remains joined to every official roster identity without duplicate emails',()=>{
 assert.equal(research.faculty.length,roster.faculty.length);
 assert.equal(new Set(research.faculty.map(record=>record.email)).size,roster.faculty.length);
 assert.deepEqual(new Set(research.faculty.map(record=>record.email)),new Set(roster.faculty.map(person=>person.email)));
});
test('verified research has official identity evidence, valid Scholar links and independent profile IDs',()=>{
 const verified=research.faculty.filter(record=>record.status==='verified');
 assert.equal(new Set(verified.map(record=>new URL(record.profileUrl).searchParams.get('user'))).size,verified.length);
 for(const record of verified){
  assert.equal(new URL(record.identitySourceUrl).hostname,'srmrmp.edu.in');
  assert.equal(new URL(record.profileUrl).hostname,'scholar.google.com');
  assert.ok(record.scholarName);assert.ok(record.checkedOn);assert.ok(Array.isArray(record.interests));
  if(record.metrics)for(const group of Object.values(record.metrics))for(const value of Object.values(group))assert.ok(Number.isSafeInteger(value)&&value>=0);
 }
});
test('unresolved records retain an explicit status and explanation',()=>{
 for(const record of research.faculty.filter(record=>record.status!=='verified')){assert.ok(['pending','unavailable','review-needed'].includes(record.status));assert.ok(record.reason);}
});
