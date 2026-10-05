# Faculty directory

The Faculty research screen uses `lib/faculty-data.json`, a snapshot of
https://srmrmp.edu.in/academics/artificial-intelligence/faculty/ retrieved on
28 September 2026. The first three people are excluded: Dr. M. Sakthi Ganesh,
Dr. Raja K, and Dr. Balika J Chelliah. All remaining 149 entries (source rows
4–152) are included in their original order, across every listed department.

`lib/faculty-source.tsv` stores the browser-extracted values with pipe delimiters.
Run `node scripts/import-faculty.mjs` to regenerate the JSON from this snapshot.
This command does not fetch new data. Future refreshes require a fresh export
from the official table and an updated retrieval date and row-count validation.
The website may return a browser check to automated HTTP requests.

Names, designations, departments, qualifications, emails, and profile links are
preserved as published, including apparent source inconsistencies. Five entries
have no linked profile. Publication counts, patents, research areas, and project
counts are not supplied by this table and are not invented in the interface.
Profile links point to the documents linked by SRM; their contents were not
individually verified.

Import validation confirmed the count, continuous source numbering, unique
emails, and an exact checksum match against all seven browser-extracted fields
for every included entry.
