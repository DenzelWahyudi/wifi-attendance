-- Connect to your attendance database before running this file.
-- In psql, for example: CREATE DATABASE wifi_attendance;
-- Then: \connect wifi_attendance
-- Then: \i 'C:/Users/denze/Downloads/wifi-attendance/db.sql'
-- Safe to run again: existing registrations and attendance are preserved.

BEGIN;

CREATE TABLE IF NOT EXISTS students (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL CHECK (length(btrim(name)) > 0),
    identity_number VARCHAR(32) NOT NULL UNIQUE
        CHECK (identity_number ~ '^[A-Za-z0-9-]{1,32}$'),
    attended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Identity numbers are text, so leading zeroes are preserved.
-- One manually reset session; no attendance history is retained.
CREATE TABLE IF NOT EXISTS attendance_state (
    id SMALLINT PRIMARY KEY CHECK (id = 1),
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO attendance_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

COMMIT;
