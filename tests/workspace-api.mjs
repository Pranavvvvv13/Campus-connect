// Run against the local development server: node tests/workspace-api.mjs
// Uses only demo accounts, restores their profiles, and removes its own fixtures.
import assert from "node:assert/strict";
const origin="http://localhost:5173";
const accounts=[{universityId:"FAC-2026-001",email:"meera.raman@university.edu",role:"Faculty"},{universityId:"ADM-2026-001",email:"admin@university.edu",role:"Admin"}];
async function request(path,method="GET",body,token="",requestOrigin=origin) {
  const response=await fetch(origin+path,{method,headers:{"Content-Type":"application/json",...(method!=="GET"?{Origin:requestOrigin}:{}),...(token?{Cookie:token}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})});
  const text=await response.text();let data;try{data=JSON.parse(text);}catch{data={error:text};}return{status:response.status,data,cookie:response.headers.get("set-cookie")?.split(";")[0]};
}
const baseProfile={headline:"API verification",about:"",skills:"React, Python",github:"",linkedin:"",website:"",projects:[],achievements:[],teamVisible:true,city:"Chennai",interests:"Climate tech",lookingFor:"Design"};
const fixtureId="unstop-cc-test-"+crypto.randomUUID();
const event={id:fixtureId,title:"API verification hackathon",host:"Test",source:"Unstop",href:"https://unstop.com/hackathons/test",mode:"Online",location:null,startsAt:null,endsAt:null,deadline:new Date(Date.now()+86400000).toISOString(),tags:[]};
const sessions=[];let requestId="";
try {
  assert.equal((await request("/api/portfolio")).status,401);
  assert.equal((await request("/api/session","POST",{...accounts[0],code:"wrong"})).status,401);
  for(const account of accounts){const login=await request("/api/session","POST",{...account,code:"246810"});assert.equal(login.status,200);const token=login.cookie;assert.ok(token);const previous=(await request("/api/portfolio","GET",undefined,token)).data.profile;sessions.push({account,token,previous});}
  for(const session of sessions){assert.equal((await request("/api/portfolio","PUT",{...baseProfile,about:session.account.role},session.token)).status,200);}
  assert.equal((await request("/api/portfolio?accountId=ADM-2026-001","GET",undefined,sessions[0].token)).data.profile.about,"Faculty");
  assert.equal((await request("/api/portfolio","GET",undefined,sessions[1].token)).data.profile.about,"Admin");
  const anotherLogin=await request("/api/session","POST",{...accounts[0],code:"246810"});
  assert.equal((await request("/api/portfolio","GET",undefined,anotherLogin.cookie)).data.profile.about,"Faculty");
  await request("/api/session","DELETE",undefined,anotherLogin.cookie);
  assert.equal((await request("/api/portfolio","GET",undefined,sessions[0].token)).status,200);
  assert.equal((await request("/api/portfolio","PUT",{...baseProfile,github:"javascript:alert(1)"},sessions[0].token)).status,400);
  assert.equal((await request("/api/portfolio","PUT",baseProfile,sessions[0].token,"https://other.example")).status,403);
  assert.equal((await request("/api/bookmarks","PUT",{event,reminderDays:3},sessions[0].token)).status,200);
  assert.equal((await request("/api/bookmarks","GET",undefined,sessions[0].token)).data.bookmarks.find(item=>item.event.id===fixtureId).reminderDays,3);
  assert.equal((await request("/api/bookmarks","GET",undefined,sessions[1].token)).data.bookmarks.some(item=>item.event.id===fixtureId),false);
  assert.equal((await request("/api/bookmarks","PUT",{event:{...event,href:"https://evil.example"},reminderDays:1},sessions[0].token)).status,400);
  const directory=(await request("/api/teams","GET",undefined,sessions[0].token)).data;
  assert.ok(directory.members.some(member=>member.id===accounts[1].universityId));
  assert.ok(directory.members.every(member=>!("email"in member)&&!("about"in member)));
  assert.equal((await request("/api/teams","POST",{toId:accounts[0].universityId},sessions[0].token)).status,400);
  assert.equal((await request("/api/teams","POST",{toId:accounts[1].universityId},sessions[0].token)).status,201);
  requestId=(await request("/api/teams","GET",undefined,sessions[0].token)).data.requests.find(item=>item.fromId===accounts[0].universityId&&item.toId===accounts[1].universityId).id;
  assert.equal((await request("/api/teams","PATCH",{id:requestId,status:"accepted"},sessions[0].token)).status,404);
  assert.equal((await request("/api/teams","PATCH",{id:requestId,status:"accepted"},sessions[1].token)).status,200);
  assert.equal((await request("/api/teams","GET",undefined,sessions[0].token)).data.requests.find(item=>item.id===requestId).status,"accepted");
  assert.equal((await request("/api/portfolio","PUT",{...baseProfile,teamVisible:false},sessions[1].token)).status,200);
  assert.equal((await request("/api/teams","GET",undefined,sessions[0].token)).data.members.some(member=>member.id===accounts[1].universityId),false);
  console.log("PASS: server sessions, account isolation, URL validation, origin checks, bookmarks, opt-in directory and team acceptance.");
} finally {
  if(requestId&&sessions[0])await request("/api/teams","DELETE",{id:requestId},sessions[0].token);
  if(sessions[0])await request("/api/bookmarks","DELETE",{id:fixtureId},sessions[0].token);
  for(const session of sessions){await request("/api/portfolio","PUT",session.previous??{...baseProfile,headline:session.account.role,about:"",skills:"",teamVisible:false,city:"",interests:"",lookingFor:""},session.token);await request("/api/session","DELETE",undefined,session.token);assert.equal((await request("/api/portfolio","GET",undefined,session.token)).status,401);}
  console.log("Demo fixtures removed and profiles restored.");
}
