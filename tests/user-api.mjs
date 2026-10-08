import assert from 'node:assert/strict';
const origin=process.env.TEST_ORIGIN??'http://localhost:5173';
async function request(path,token='',method='GET',body){const r=await fetch(origin+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...(token?{Cookie:token}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
let token,secondToken,original;
try {
 assert.equal((await request('/api/user')).status,401);
 const login=await request('/api/session','','POST',{role:'Student',universityId:'STU-2026-001',email:'pranav.iyer@university.edu',code:'246810'});assert.equal(login.status,200);token=login.cookie;
 original=(await request('/api/user',token)).data.account;
 assert.equal((await request('/api/user',token,'PATCH',{name:' '})).status,400);
 assert.equal((await request('/api/user',token,'PATCH',{name:'A'.repeat(81)})).status,400);
 assert.equal((await request('/api/user',token,'PATCH',{name:'Changed',role:'Admin'})).status,400);
 const updated=await request('/api/user',token,'PATCH',{name:'Pranav  Profile Test'});assert.equal(updated.status,200);assert.equal(updated.data.account.name,'Pranav Profile Test');
 assert.equal(updated.data.account.role,original.role);assert.equal(updated.data.account.email,original.email);assert.equal(updated.data.account.universityId,original.universityId);
 assert.equal((await request('/api/session',token)).data.account.name,'Pranav Profile Test');
 const second=await request('/api/session','','POST',{role:'Student',universityId:original.universityId,email:original.email,code:'246810'});secondToken=second.cookie;assert.equal(second.data.account.name,'Pranav Profile Test');
 console.log('PASS authenticated name editing, validation, immutable account fields, session persistence and new sign-in persistence.');
} finally {
 if(token&&original)await request('/api/user',token,'PATCH',{name:original.name});
 for(const session of [token,secondToken].filter(Boolean))await request('/api/session',session,'DELETE');
}
