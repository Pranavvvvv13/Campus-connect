import test from "node:test";
import assert from "node:assert/strict";
import { calendarReminder, dueReminders, eventSchema, profileSchema, sortHackathons } from "../lib/workspace-model.ts";
const event = {id:"unstop-test",title:"Test, Hackathon",host:"Campus",source:"Unstop",href:"https://unstop.com/hackathons/test",mode:"Online",location:null,startsAt:"2026-10-20T10:00:00+05:30",endsAt:null,deadline:"2026-10-12T10:00:00+05:30",tags:[]};
test("sorting puts unknown deadlines last and uses start dates independently",()=>{
  const unknown={...event,id:"unknown",deadline:null,startsAt:null};
  const earlier={...event,id:"early",deadline:"2026-10-10T00:00:00Z",startsAt:"2026-10-21T00:00:00Z"};
  assert.deepEqual(sortHackathons([unknown,event,earlier],"deadline").map(item=>item.id),["early","unstop-test","unknown"]);
  assert.deepEqual(sortHackathons([unknown,event,earlier],"start").map(item=>item.id),["unstop-test","early","unknown"]);
});
test("reminders honor the configured threshold and exclude expired or disabled reminders",()=>{
  const now=Date.parse("2026-10-10T04:30:00Z");
  const savedAt=new Date(now).toISOString();
  assert.equal(dueReminders([{event,reminderDays:1,savedAt}],now).length,0);
  assert.equal(dueReminders([{event,reminderDays:3,savedAt}],now).length,1);
  assert.equal(dueReminders([{event,reminderDays:0,savedAt}],now).length,0);
  assert.equal(dueReminders([{event,reminderDays:3,savedAt}],Date.parse(event.deadline)).length,0);
});
test("calendar converts IST deadlines to UTC and escapes and folds text",()=>{
  const calendar=calendarReminder({...event,title:"Hack, build; learn\n"+"🏆".repeat(50)},3);
  assert.match(calendar,/DTSTART:20261012T043000Z/);
  assert.match(calendar,/TRIGGER:-P3D/);
  assert.match(calendar,/Hack\\, build\\; learn\\n/);
  assert.ok(calendar.split("\r\n").every(line=>Buffer.byteLength(line,"utf8")<=75));
  assert.throws(()=>calendarReminder({...event,deadline:null},1));
});
test("profile links and saved-event origins are validated",()=>{
  const profile={headline:"Developer",about:"",skills:"React",github:"javascript:alert(1)",linkedin:"",website:"",projects:[],achievements:[]};
  assert.equal(profileSchema.safeParse(profile).success,false);
  assert.equal(profileSchema.parse({...profile,github:"https://github.com/example"}).teamVisible,false);
  assert.equal(eventSchema.safeParse({...event,href:"https://unstop.com.evil.example/test"}).success,false);
  assert.equal(eventSchema.safeParse(event).success,true);
  assert.ok(!eventSchema.parse({...event,href:"https://unstop.com/test\r\nmalformed"}).href.includes("\n"));
});

