# Faculty research snapshot

Latest import: 9 October 2026. The existing 149-person SRM Ramapuram roster is unchanged; research is joined by official email.

Coverage: 51 verified public Scholar profiles, 85 pending, 3 unavailable, and 10 requiring identity review. This adds 25 verified profiles to the previous 26. Research details include Scholar interests, all-time citation/h-index/i10-index metrics, the displayed Since 2021 metrics where present, profile links, official identity evidence and individual verification dates. Missing values remain null.

Official SRM profile PDFs were accessible during this import. Scholar IDs were extracted from their published URI annotations rather than guessed from names. Readable author pages were checked against the roster name and SRM/SRMIST affiliation or a verified srmist.edu.in email domain. Ambiguous affiliations and duplicate links remain under review and do not appear as confirmed research. Three official links remain unreadable; the UI links to those published profiles without claiming imported metrics.

The 26 previously verified records retain their 8 October verification dates. Newly verified records are dated 9 October. The top-level date indicates the latest import, not that every record was reverified. These are dated snapshots, not live metrics.

Run: node scripts/import-faculty-scholar.mjs --checked-on=YYYY-MM-DD

The importer checks unresolved entries with at most five concurrent public requests, skips existing verified records, preserves prior records on access failures, and never bypasses sign-in/challenge pages. The import report records discovery results; final reviewed status is authoritative in faculty-research.json. Re-read verified profiles separately when refreshing citation metrics.

The research snapshot is separate from faculty-data.json so regenerating the university roster does not overwrite research evidence. Publications remain available on the original Scholar profiles.
