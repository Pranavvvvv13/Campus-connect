import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root=new URL('../',import.meta.url);
const roster=JSON.parse(readFileSync(new URL('lib/faculty-data.json',root),'utf8'));
const snapshot=JSON.parse(readFileSync(new URL('lib/faculty-research.json',root),'utf8'));
const checkedOn=process.argv.find(arg=>arg.startsWith('--checked-on='))?.split('=')[1];
if(!/^\d{4}-\d{2}-\d{2}$/.test(checkedOn??''))throw new Error('Pass --checked-on=YYYY-MM-DD for the actual collection date.');
const records=new Map(snapshot.faculty.map(record=>[record.email,record]));
const report=[];
function text(value=''){return value.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();}
function normalized(value){return value.toLowerCase().replace(/[^a-z]/g,'');}
async function publicFetch(url){const response=await fetch(url,{signal:AbortSignal.timeout(12000)});if(!response.ok)throw new Error(`HTTP ${response.status}`);return response;}
function parseScholar(html){
 const name=text(html.match(/id="gsc_prf_in"[^>]*>([\s\S]*?)<\/div>/)?.[1]);
 if(!name)return null; // Never interpret sign-in or challenge pages as author data.
 const affiliation=text(html.match(/<div class="gsc_prf_il">([\s\S]*?)<\/div>/)?.[1]);
 const interests=[...html.matchAll(/<a[^>]*class="gsc_prf_inta[^>]*>([\s\S]*?)<\/a>/g)].map(match=>text(match[1]));
 const values=[...html.matchAll(/class="gsc_rsb_std"[^>]*>([\s\S]*?)<\/td>/g)].map(match=>Number(text(match[1]).replace(/,/g,'')));
 const metrics=values.length===6&&values.every(Number.isFinite)&&/Since 2021/.test(html)?{all:{citations:values[0],hIndex:values[2],i10Index:values[4]},since2021:{citations:values[1],hIndex:values[3],i10Index:values[5]}}:null;
 const verifiedEmailDomain=text(html.match(/id="gsc_prf_ivh"[^>]*>([\s\S]*?)<\/div>/)?.[1]).match(/Verified email at ([a-z0-9.-]+)/i)?.[1]??null;
 return {scholarName:name,scholarAffiliation:affiliation,interests,metrics,verifiedEmailDomain};
}
async function enrich(person){
 const previous=records.get(person.email);
 if(previous?.status==='verified')return;
 if(!person.profileUrl)return;
 try {
  const pdf=await publicFetch(person.profileUrl);
  const data=Buffer.from(await pdf.arrayBuffer());
  if(!data.subarray(0,5).equals(Buffer.from('%PDF-')))throw new Error('Not a PDF');
  // PDF URI annotations retain the university-published link without guessing IDs.
  const links=[...data.toString('latin1').matchAll(/\/URI\s*\(([^)]*)\)/g)].map(match=>match[1].replace(/\\([()\\])/g,'$1'));
  const ids=[...new Set(links.flatMap(value=>{try{const url=new URL(value);const id=url.searchParams.get('user');return /^scholar\.google\.[a-z.]+$/.test(url.hostname)&&id&&/^[\w-]+$/.test(id)?[id]:[];}catch{return [];}}))];
  if(ids.length!==1){report.push({email:person.email,result:ids.length?'multiple-links':'no-published-link'});return;}
  const profileUrl=`https://scholar.google.com/citations?user=${ids[0]}&hl=en`;
  const base={email:person.email,checkedOn,profileUrl,identitySourceUrl:person.profileUrl};
  const known=snapshot.faculty.find(record=>record.email!==person.email&&record.profileUrl===profileUrl);
  if(known){records.set(person.email,{...base,status:'review-needed',scholarName:null,scholarAffiliation:null,interests:[],metrics:null,reason:'The official PDF links to a Scholar ID also published for another roster entry; identity needs review.'});report.push({email:person.email,result:'duplicate-profile-needs-review',profileUrl});return;}
  const response=await publicFetch(profileUrl);
  const parsed=parseScholar(await response.text());
  if(!parsed){records.set(person.email,{...base,status:'unavailable',scholarName:null,scholarAffiliation:null,interests:[],metrics:null,reason:'Official SRM PDF publishes this Scholar link; the author page requires sign-in or is not publicly readable.'});report.push({email:person.email,result:'official-link-found',profileUrl});return;}
  const matchedName=person.name.replace(/\b(?:Dr|Prof|Mrs|Ms|Mr)\.?/gi,'').split(/[.\s]+/).filter(token=>token.length>2).some(token=>normalized(parsed.scholarName).includes(normalized(token)));
  const verified=matchedName&&(/\b(?:SRM|SRMIST)\b/i.test(parsed.scholarAffiliation)||parsed.verifiedEmailDomain==='srmist.edu.in');
  records.set(person.email,{...base,status:verified?'verified':'review-needed',...parsed,reason:verified?null:'Official link found, but Scholar name or affiliation needs manual review.'});
  report.push({email:person.email,result:verified?'verified':'review-needed',profileUrl});
 }catch(error){report.push({email:person.email,result:'fetch-unavailable',reason:error.message});}
}
for(let i=0;i<roster.faculty.length;i+=5){await Promise.all(roster.faculty.slice(i,i+5).map(enrich));console.log(`Checked ${Math.min(i+5,roster.faculty.length)}/${roster.faculty.length}`);}
snapshot.retrievedOn=checkedOn;snapshot.faculty=roster.faculty.map(person=>records.get(person.email)??{email:person.email,status:'pending',checkedOn,reason:'No verified public Scholar profile available.'});
writeFileSync(new URL('lib/faculty-research.json',root),JSON.stringify(snapshot,null,2)+'\n');
writeFileSync(new URL('lib/faculty-scholar-import-report.json',root),JSON.stringify({checkedOn,results:report},null,2)+'\n');
console.log('Coverage',snapshot.faculty.reduce((counts,record)=>(counts[record.status]=(counts[record.status]??0)+1,counts),{}));
console.log('Saved',fileURLToPath(new URL('lib/faculty-research.json',root)));
