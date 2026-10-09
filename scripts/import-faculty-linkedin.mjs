import { readFileSync, writeFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const roster = JSON.parse(readFileSync(new URL('lib/faculty-data.json', root), 'utf8'));
const research = JSON.parse(readFileSync(new URL('lib/faculty-research.json', root), 'utf8'));
const checkedOn = process.argv.find(arg => arg.startsWith('--checked-on='))?.split('=')[1];
if (!/^\d{4}-\d{2}-\d{2}$/.test(checkedOn ?? '')) throw new Error('Pass --checked-on=YYYY-MM-DD');
const faculty = [];
async function collect(person) {
  if (research.faculty.find(record => record.email === person.email)?.status === 'verified') return;
  try {
    const response = await fetch(person.profileUrl, { signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = Buffer.from(await response.arrayBuffer());
    if (data.subarray(0, 5).toString() !== '%PDF-') throw new Error('Not a PDF');
    const links = [...data.toString('latin1').matchAll(/\/URI\s*\(([^)]*)\)/g)].flatMap(match => {
      try {
        const url = new URL(match[1].replace(/\\([()\\])/g, '$1'));
        if (!['linkedin.com', 'www.linkedin.com', 'in.linkedin.com'].includes(url.hostname) || !/^\/in\/[^/]+\/?$/.test(url.pathname)) return [];
        return [`https://www.linkedin.com${url.pathname.replace(/\/$/, '')}`];
      } catch { return []; }
    });
    const unique = [...new Set(links)];
    faculty.push({ email: person.email, checkedOn, identitySourceUrl: person.profileUrl, profileUrl: unique.length === 1 ? unique[0] : null, status: unique.length === 1 ? 'officially-published' : 'unavailable' });
  } catch {
    faculty.push({ email: person.email, checkedOn, identitySourceUrl: person.profileUrl, profileUrl: null, status: 'unavailable' });
  }
}
for (let i = 0; i < roster.faculty.length; i += 5) {
  await Promise.all(roster.faculty.slice(i, i + 5).map(collect));
  console.log(`Checked ${Math.min(i + 5, roster.faculty.length)}/${roster.faculty.length}`);
}
// A shared link is ambiguous, even when both PDFs publish it.
for (const record of faculty) if (record.profileUrl && faculty.filter(other => other.profileUrl === record.profileUrl).length > 1) {
  record.status = 'review-needed';
}
faculty.sort((a, b) => a.email.localeCompare(b.email));
writeFileSync(new URL('lib/faculty-linkedin.json', root), JSON.stringify({ checkedOn, faculty }, null, 2) + '\n');
console.log('Official LinkedIn fallbacks:', faculty.filter(record => record.status === 'officially-published').length);
