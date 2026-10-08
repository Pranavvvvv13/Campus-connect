import assert from 'node:assert/strict';
const origin=process.env.TEST_ORIGIN??'http://localhost:5173';
async function request(path,token='',method='GET',body){const response=await fetch(origin+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...(token?{Cookie:token}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};}
const tokens=[];let id;
try {
 assert.equal((await request('/api/linkedin-events')).status,401);
 for(const account of [{role:'Admin',universityId:'ADM-2026-001',email:'admin@university.edu'},{role:'Student',universityId:'STU-2026-001',email:'pranav.iyer@university.edu'}]){
  const login=await request('/api/session','','POST',{...account,code:'246810'});assert.equal(login.status,200);tokens.push(login.cookie);
 }
 assert.equal((await request('/api/linkedin-events',tokens[1])).status,403);
 const event={title:'Automated event integration verification',host:'CampusConnect local test',href:'https://www.linkedin.com/events/campusconnect-verification-'+Date.now()+'/',mode:'Hybrid',location:'Madras, India',startsAt:new Date(Date.now()+86400000).toISOString(),endsAt:new Date(Date.now()+172800000).toISOString(),description:'Temporary local API verification entry.',imageUrl:''};
 assert.equal((await request('/api/linkedin-events',tokens[1],'POST',event)).status,403);
 assert.equal((await request('/api/linkedin-events',tokens[0],'POST',{...event,href:'https://evil.example/events/test'})).status,400);
 assert.equal((await request('/api/linkedin-events',tokens[0],'POST',{...event,endsAt:event.startsAt})).status,400);
 const saved=await request('/api/linkedin-events',tokens[0],'POST',event);assert.equal(saved.status,200);id=saved.data.event.id;
 assert.equal(saved.data.event.location,'Chennai');assert.equal(saved.data.event.syncKind,'manual');
 const updated=await request('/api/linkedin-events',tokens[0],'POST',{...event,title:event.title+' updated'});assert.equal(updated.data.event.id,id);
 const entries=(await request('/api/linkedin-events',tokens[0])).data.events;assert.equal(entries.filter(event=>event.id===id).length,1);
 const feed=(await request('/api/hackathons')).data;assert.ok(feed.events.some(event=>event.id===id));
 assert.equal((await request('/api/linkedin-events',tokens[0],'DELETE',{id:'invalid'})).status,400);
 assert.equal((await request('/api/linkedin-events',tokens[1],'DELETE',{id})).status,403);
 console.log('PASS admin-only create/update, venue normalization, feed inclusion, validation and role checks.');
} finally {
 if(id&&tokens[0]){assert.equal((await request('/api/linkedin-events',tokens[0],'DELETE',{id})).status,200);assert.ok(!(await request('/api/linkedin-events',tokens[0])).data.events.some(event=>event.id===id));}
 for(const token of tokens)await request('/api/session',token,'DELETE');
}
