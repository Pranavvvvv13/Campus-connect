import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = name => JSON.parse(readFileSync(new URL(`../lib/${name}.json`, import.meta.url), 'utf8'));
test('LinkedIn fallbacks cover unresolved Scholar identities with official evidence', () => {
  const roster = read('faculty-data').faculty;
  const research = read('faculty-research').faculty;
  const links = read('faculty-linkedin').faculty;
  assert.deepEqual(new Set(links.map(record => record.email)), new Set(research.filter(record => record.status !== 'verified').map(record => record.email)));
  const published = links.filter(record => record.status === 'officially-published');
  assert.equal(new Set(published.map(record => record.profileUrl)).size, published.length);
  for (const record of published) {
    assert.equal(new URL(record.profileUrl).hostname, 'www.linkedin.com');
    assert.match(new URL(record.profileUrl).pathname, /^\/in\/[^/]+$/);
    assert.equal(record.identitySourceUrl, roster.find(person => person.email === record.email).profileUrl);
    assert.ok(record.checkedOn);
  }
});
