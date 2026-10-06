import test from "node:test";
import assert from "node:assert/strict";
import {pageMetadata,parseDevfolio,parseUnstop,parseUnstopBanner,publicImage} from "../lib/hackathon-providers.ts";
test("Unstop detail banners take priority over mobile artwork and reject external URLs",()=>{
  const url="https://d8it4huxumps7.cloudfront.net/uploads/images/opportunity/banner/event.png";
  assert.equal(parseUnstopBanner(JSON.stringify({data:{competition:{banner:{image_url:url}}}})),url);
  assert.equal(parseUnstopBanner(JSON.stringify({data:{competition:{banner_mobile:{image_url:url}}}})),url);
  assert.equal(parseUnstopBanner(JSON.stringify({data:{competition:{banner:{image_url:"https://evil.example/image.png"}}}})),null);
  assert.equal(parseUnstopBanner(JSON.stringify({data:{competition:{}}})),null);
});
import {registrationStatus} from "../lib/hackathons.ts";
test("provider artwork is allowlisted and metadata descriptions are plain text",()=>{
  const metadata=pageMetadata('<meta content="https://assets.devfolio.co/hackathons/x/cover.png" property="og:image"><meta name="description" content="Build &amp; learn">');
  assert.equal(metadata.imageUrl,"https://assets.devfolio.co/hackathons/x/cover.png");
  assert.equal(metadata.description,"Build & learn");
  assert.equal(publicImage("http://assets.devfolio.co/a.png"),null);
  assert.equal(publicImage("https://untrusted.example/a.png"),null);
});
test("Unstop logos, Devfolio covers and missing images retain usable event data",()=>{
  const unstop=parseUnstop(JSON.stringify({data:{data:[{id:1,title:"Build",type:"hackathons",public_url:"hackathons/build",region:"online",regn_open:1,logoUrl2:"https://d8it4huxumps7.cloudfront.net/logo.png",details:"<p>Build a prototype.</p><script>bad()</script>"}]}}));
  assert.equal(unstop[0].imageKind,"logo");assert.equal(unstop[0].description,"Build a prototype.");
  const event={uuid:"1",slug:"build",name:"Build",is_online:true,settings:{featured_cover_img:"https://assets.devfolio.co/cover.png"}};
  const devfolio=parseDevfolio(`<script id="__NEXT_DATA__">${JSON.stringify({props:{pageProps:{dehydratedState:{queries:[{state:{data:{open_hackathons:[event]}}}]}}}})}</script>`);
  assert.equal(devfolio[0].imageUrl,event.settings.featured_cover_img);
  assert.equal(parseUnstop(JSON.stringify({data:{data:[{id:2,title:"No art",type:"hackathons",public_url:"hackathons/no-art",regn_open:1}]}}))[0].imageUrl,null);
});
test("registration status handles expired, upcoming, closing and unknown dates",()=>{
  const now=Date.parse("2026-10-07T00:00:00Z");
  assert.equal(registrationStatus({deadline:"2026-10-06",endsAt:null},now),"Closed");
  assert.equal(registrationStatus({deadline:"2026-10-09",endsAt:null},now),"Closing soon");
  assert.equal(registrationStatus({deadline:"2026-10-20",registrationOpensAt:"2026-10-10"},now),"Opens soon");
  assert.equal(registrationStatus({deadline:"2026-10-20"},now),"Open");
  assert.equal(registrationStatus({deadline:null},now),"Check registration");
});
