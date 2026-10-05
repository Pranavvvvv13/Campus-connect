# CampusConnect production-readiness controls

The local build demonstrates the intended flows. It must not process real student information until every launch-blocking item below has an accountable owner and evidence of completion.

## Launch blockers

- [ ] Replace demo identities and verification code with university OIDC or SAML.
- [ ] Import accounts only from the approved university roster.
- [ ] Enforce server-side authorization on every protected page and API operation.
- [ ] Require MFA for faculty and administrators; require phishing-resistant MFA for privileged administrators.
- [ ] Remove all demonstration data and disable demo authentication in production builds.
- [ ] Provision an encrypted relational database with separate production, staging and development environments.
- [ ] Connect academic records through an authorised ERP integration; students cannot directly modify verified CGPA.
- [ ] Implement private object storage, file validation and malware scanning for evidence uploads.
- [ ] Record login, recovery, profile, approval, export and permission events in append-only audit storage.
- [ ] Approve privacy notice, data purposes, field visibility defaults, retention schedule and grievance workflow.
- [ ] Verify permitted Unstop/Devfolio integration methods; do not scrape or expose API keys.
- [ ] Configure rate limiting, secure cookies, CSRF protection, CSP, restrictive CORS and secret management.
- [ ] Configure monitoring, alerting, encrypted backups and a tested restoration procedure.
- [ ] Complete accessibility, authorization, load, recovery and penetration testing.
- [ ] Resolve every critical and high-risk finding before release.

## Required authorization tests

- A student cannot read or modify another student’s private profile or academic record by changing an identifier.
- A faculty member can access only assigned students and approved fields.
- An administrator cannot grant `super_admin` unless separately authorised.
- Selecting a different login portal never changes the account’s assigned role.
- Suspended and archived accounts cannot create sessions.
- Role changes revoke active sessions.
- Every approval and confidential record access produces an audit event.

## Rollout gates

1. Development: synthetic data only.
2. Alpha: project team and authorised faculty; no public access.
3. Beta: one department, limited approved data and active support process.
4. University release: SSO, monitoring, backups, incident response and compliance approval operational.
