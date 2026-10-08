// Idempotent schema for the local demo and a provisioned D1 binding.
export const workspaceSchema = [
  `CREATE TABLE IF NOT EXISTS workspace_user_preferences (account_id TEXT PRIMARY KEY, display_name TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS workspace_linkedin_events (id TEXT PRIMARY KEY, event_json TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS workspace_account_status (account_id TEXT PRIMARY KEY, suspended INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS workspace_audit (id TEXT PRIMARY KEY, actor_id TEXT NOT NULL, target_id TEXT NOT NULL, action TEXT NOT NULL, reason TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS workspace_sessions (token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL, expires_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS workspace_profiles (account_id TEXT PRIMARY KEY, profile_json TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS workspace_bookmarks (account_id TEXT NOT NULL, event_id TEXT NOT NULL, event_json TEXT NOT NULL, reminder_days INTEGER NOT NULL DEFAULT 1, saved_at TEXT NOT NULL, PRIMARY KEY(account_id,event_id))`,
  `CREATE TABLE IF NOT EXISTS workspace_team_requests (id TEXT PRIMARY KEY, from_id TEXT NOT NULL, to_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','declined')), created_at TEXT NOT NULL, UNIQUE(from_id,to_id))`,
];
