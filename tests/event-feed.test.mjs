import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCity, matchesLocation } from '../lib/event-location.ts';
import { devfolioVenue, parseUnstop } from '../lib/hackathon-providers.ts';
import { parseLinkedInEvent, loadLinkedInEvents } from '../lib/linkedin-events.ts';
test('city filters normalize case, addresses and old city names without matching online hosts',()=>{
 assert.equal(normalizeCity('  MADRAS, Tamil Nadu  '),'Chennai');
 assert.equal(matchesLocation({mode:'Hybrid',location:'Chennai, India'},'chennai'),true);
 assert.equal(matchesLocation({mode:'Offline',location:'Madras'},'Chennai'),true);
 assert.equal(matchesLocation({mode:'Online',location:'Chennai'},'Chennai'),false);
 assert.equal(matchesLocation({mode:'Hybrid',location:'Chennai'},'online'),true);
 assert.equal(matchesLocation({mode:'Offline',location:'TBD'},'unknown'),true);
 assert.equal(matchesLocation({mode:'Offline',location:'Bengaluru'},'Chennai'),false);
});
test('Devfolio details provide venues missing from listing pages',()=>{
 const html='<script id="__NEXT_DATA__">'+JSON.stringify({props:{pageProps:{hackathon:{city:'Chennai',location:'Campus, Chennai'}}}})+'</script>';
 assert.equal(devfolioVenue(html),'Chennai');
 assert.equal(devfolioVenue('<html>Unavailable</html>'),null);
});
test('Unstop uses venue fallback and includes hybrid events in Chennai',()=>{
 const raw=JSON.stringify({data:{data:[{id:1,title:'Build',type:'hackathons',public_url:'hackathons/build',regn_open:1,region:'hybrid',address_with_country_logo:{city:'',address:'College, Chennai, India'}}]}});
 const [event]=parseUnstop(raw);
 assert.equal(event.location,'Chennai');
 assert.equal(matchesLocation(event,'Chennai'),true);
});
test('LinkedIn preserves long event IDs, excludes cancelled and expired events',()=>{
 const event={id:'7246559654799892480',name:{localized:{en_US:'Campus meetup'}},startsAt:Date.now()+86400000,type:{online:{}}};
 assert.equal(parseLinkedInEvent(event).href,'https://www.linkedin.com/events/7246559654799892480/');
 assert.equal(parseLinkedInEvent({...event,cancelled:true}),null);
 assert.equal(parseLinkedInEvent({...event,endsAt:1}),null);
 assert.equal(parseLinkedInEvent({...event,name:{}}),null);
});
test('missing LinkedIn credentials are not represented as a successful live feed',async()=>{
 const saved=process.env.LINKEDIN_ACCESS_TOKEN;
 delete process.env.LINKEDIN_ACCESS_TOKEN;
 try {const result=await loadLinkedInEvents();assert.equal(result.provider.status,'not_configured');assert.deepEqual(result.events,[]);}finally{if(saved!==undefined)process.env.LINKEDIN_ACCESS_TOKEN=saved;}
});
