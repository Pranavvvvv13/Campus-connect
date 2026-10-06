import assert from "node:assert/strict";
const origin="http://localhost:5173";
async function request(path,token="",method="GET",body){const response=await fetch(origin+path,{method,headers:{Origin:origin,"Content-Type":"application/json",...(token?{Cookie:token}:{})},...(body?{body:JSON.stringify(body)}:{})});return{status:response.status,data:await response.json(),cookie:response.headers.get("set-cookie")?.split(";")[0]};}
const student={role:"Student",universityId:"STU-2026-001",email:"pranav.iyer@university.edu",code:"246810"};
const faculty={role:"Faculty",universityId:"FAC-2026-001",email:"meera.raman@university.edu",code:"246810"};
const admin={role:"Admin",universityId:"ADM-2026-001",email:"admin@university.edu",code:"246810"};
const tokens=[];let adminToken;let changed=false;
try{
  assert.equal((await request("/api/admin")).status,401);
  for(const account of [admin,faculty,student]){const login=await request("/api/session","","POST",account);assert.equal(login.status,200);tokens.push(login.cookie);}
  adminToken=tokens[0];
  assert.equal((await request("/api/admin",tokens[1])).status,403);assert.equal((await request("/api/admin",tokens[2])).status,403);
  const data=(await request("/api/admin",adminToken)).data;assert.equal(data.accounts.length,3);assert.ok(data.metrics.activeSessions>=3);assert.ok(!JSON.stringify(data).includes("token_hash"));
  const action={accountId:student.universityId,action:"suspend",reason:"Automated demo verification"};
  assert.equal((await request("/api/admin",tokens[1],"PATCH",action)).status,403);
  assert.equal((await request("/api/admin",adminToken,"PATCH",{...action,accountId:admin.universityId})).status,400);
  assert.equal((await request("/api/admin",adminToken,"PATCH",{...action,reason:""})).status,400);
  assert.equal((await request("/api/admin",adminToken,"PATCH",action)).status,200);changed=true;
  assert.equal((await request("/api/session","","POST",student)).status,403);
  assert.equal((await request("/api/portfolio",tokens[2])).status,401);
  const suspended=(await request("/api/admin",adminToken)).data;assert.ok(suspended.accounts.find(account=>account.id===student.universityId).suspended);assert.equal(suspended.activity[0].action,"suspend");
  assert.equal((await request("/api/admin",adminToken,"PATCH",{...action,action:"restore"})).status,200);changed=false;
  const newLogin=await request("/api/session","","POST",student);assert.equal(newLogin.status,200);tokens.push(newLogin.cookie);
  assert.equal((await request("/api/admin",adminToken,"PATCH",{...action,action:"revoke_sessions"})).status,200);assert.equal((await request("/api/portfolio",newLogin.cookie)).status,401);
  console.log("PASS admin role checks, real metrics, protected admin, suspension, restore, revocation and audit persistence.");
}finally{
  if(changed&&adminToken)await request("/api/admin",adminToken,"PATCH",{accountId:student.universityId,action:"restore",reason:"Restore after automated verification"});
  for(const token of tokens)await request("/api/session",token,"DELETE");
}
