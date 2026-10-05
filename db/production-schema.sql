PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  university_id TEXT NOT NULL UNIQUE,
  university_email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student','faculty','admin','super_admin')),
  department_id TEXT,
  account_status TEXT NOT NULL DEFAULT 'pending' CHECK (account_status IN ('pending','active','suspended','archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE student_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  programme TEXT,
  batch_year INTEGER,
  about TEXT,
  interests_json TEXT NOT NULL DEFAULT '[]',
  profile_visibility TEXT NOT NULL DEFAULT 'university' CHECK (profile_visibility IN ('private','university','public'))
);

CREATE TABLE faculty_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  designation TEXT,
  research_areas_json TEXT NOT NULL DEFAULT '[]',
  publications_json TEXT NOT NULL DEFAULT '[]',
  patents_json TEXT NOT NULL DEFAULT '[]',
  awards_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE academic_records (
  id TEXT PRIMARY KEY,
  student_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cgpa_encrypted TEXT NOT NULL,
  source TEXT NOT NULL,
  verified_at TEXT,
  updated_by TEXT NOT NULL REFERENCES users(id)
);

CREATE TABLE achievements (
  id TEXT PRIMARY KEY,
  student_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  visibility TEXT NOT NULL DEFAULT 'university' CHECK (visibility IN ('private','university','public')),
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','approved','rejected','changes_requested')),
  verified_by TEXT REFERENCES users(id),
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clubs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  description TEXT NOT NULL,
  president_user_id TEXT REFERENCES users(id),
  faculty_coordinator_user_id TEXT REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','published','archived'))
);

CREATE TABLE events (
  id TEXT PRIMARY KEY,
  club_id TEXT REFERENCES clubs(id),
  title TEXT NOT NULL,
  description TEXT,
  starts_at TEXT NOT NULL,
  registration_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','published','cancelled','archived')),
  created_by TEXT NOT NULL REFERENCES users(id)
);

CREATE TABLE faculty_student_assignments (
  faculty_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL CHECK (relationship IN ('advisor','mentor','club_coordinator','project_guide')),
  PRIMARY KEY (faculty_user_id, student_user_id, relationship)
);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  result TEXT NOT NULL,
  request_id TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role_status ON users(role, account_status);
CREATE INDEX idx_achievements_student_status ON achievements(student_user_id, verification_status);
CREATE INDEX idx_events_status_starts ON events(status, starts_at);
CREATE INDEX idx_audit_actor_created ON audit_logs(actor_user_id, created_at);
