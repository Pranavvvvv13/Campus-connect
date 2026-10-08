# LinkedIn events

The Hackathons & events feed combines public Devfolio/Unstop data, approved LinkedIn organization events, and admin-maintained LinkedIn event entries. The open dashboard polls every five minutes. This is near-real-time polling, not push delivery or LinkedIn-wide discovery.

## Automatic sync

Configure these **server-only** environment variables in your local environment file or deployment secrets. Never prefix them with `NEXT_PUBLIC_` and never commit a token.

- `LINKEDIN_ACCESS_TOKEN`: an authorized token for an app approved for the Events API with `r_events`, from an administrator/content administrator of the organization.
- `LINKEDIN_ORGANIZATION_ID`: the numeric organization ID.
- `LINKEDIN_API_VERSION`: a supported six-digit `YYYYMM` API version for your approved integration.

The integration uses `/rest/events?q=eventsByOrganizer` and requests public, non-cancelled events, follows pagination, and excludes events whose end date has passed. Tokens must be renewed when they expire. The dashboard reports configuration and request failures separately. Configured credentials do not guarantee approved access.

LinkedIn does not supply an unrestricted public discovery feed. Access approval and organization authorization must be obtained externally; the app cannot grant them.

Official reference: https://learn.microsoft.com/en-us/linkedin/marketing/event-management/events

## Manual entries

Admin dashboard → Events accepts an event's LinkedIn URL, title, organizer, mode, venue, start/end dates, description and optional LinkedIn media banner URL. Entries persist in the workspace database and appear on the next feed refresh. Save the same URL to update it; remove obsolete entries in the same admin section. These are visibly labeled **Manual entry** and are not synchronized with LinkedIn. Expired entries are excluded from the public feed. Changes require admin access and are audited.

## Location filtering

Devfolio venues come from the event page's structured metadata. Unstop uses its city, location or address fields. Known aliases such as Madras/Chennai and Bangalore/Bengaluru are grouped. City filters include offline and hybrid events; online-only events remain in the remote filter even when the organizer is based in that city. The app never uses an organizer address as an event venue. An empty or failed provider response is not proof that no events exist.
