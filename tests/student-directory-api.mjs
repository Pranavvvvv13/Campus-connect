import assert from "node:assert/strict";
const origin="http://localhost:5173";
async function request(path,token="",method="GET",body) {
  const response=await fetch(origin+path,{method,headers:{Origin:origin,"Content-Type":"application/json",...(token?{Cookie:token}:{})},...(body?{body:JSON.stringify(body)}:{})});
  return {status:response.status,data:await response.json(),cookie:response.headers.get("set-cookie")?.split(";")[0]};
}
const accounts=[{role:"Student",universityId:"STU-2026-001",email:"pranav.iyer@university.edu"},{role:"Faculty",universityId:"FAC-2026-001",email:"meera.raman@university.edu"},{role:"Admin",universityId:"ADM-2026-001",email:"admin@university.edu"}];
const tokens=[];let previous;
try {
  assert.equal((await request("/api/students")).status,401);
  for(const account of accounts){const login=await request("/api/session","","POST",{...account,code:"246810"});assert.equal(login.status,200);tokens.push(login.cookie);}
  assert.equal((await request("/api/students",tokens[0])).status,403);
  assert.equal((await request("/api/students",tokens[2])).status,200);
  previous=(await request("/api/portfolio",tokens[0])).data.profile;
  const profile=previous??{headline:"Test student",about:"",skills:"Python",github:"",linkedin:"",website:"",projects:[],achievements:[]};
  assert.equal((await request("/api/portfolio",tokens[0],"PUT",{...profile,facultyVisible:false})).status,200);
  const privateView=await request("/api/students",tokens[1]);
  assert.equal(privateView.status,200);assert.equal(privateView.data.students.length,8);assert.ok(privateView.data.students.every(student=>student.mock));
  await request("/api/portfolio",tokens[0],"PUT",{...profile,facultyVisible:true});
  const shared=(await request("/api/students",tokens[1])).data.students.find(student=>student.id===accounts[0].universityId);
  assert.ok(shared);assert.equal(shared.mock,false);assert.equal(shared.email,undefined);assert.equal(shared.portfolio.teamVisible,undefined);
  console.log("PASS: faculty/admin access, student denial, mock data, sharing opt-in and private-field exclusion.");
} finally {
  if(tokens[0]&&previous!==undefined)await request("/api/portfolio",tokens[0],"PUT",previous??{headline:"B.Tech Computer Science · Class of 2028",about:"",skills:"",github:"",linkedin:"",website:"",projects:[],achievements:[],facultyVisible:false});
  for(const token of tokens)await request("/api/session",token,"DELETE");
}
