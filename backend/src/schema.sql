CREATE TABLE IF NOT EXISTS users(
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(10) NOT NULL CHECK (role IN ('student', 'admin')),
    student_id      VARCHAR(50) UNIQUE,          
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS groups(
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    created_by      INTEGER NOT NULL REFERENCES users(id),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members(
    id              SERIAL PRIMARY KEY,
    group_id        INTEGER NOT NULL REFERENCES groups(id),
    user_id         INTEGER NOT NULL REFERENCES users(id),
    joined_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS assignments(
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    due_date        TIMESTAMP NOT NULL,
    onedrive_link   VARCHAR(500) NOT NULL,
    target_type     VARCHAR(10) NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'group')),
    created_by      INTEGER NOT NULL REFERENCES users(id),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignment_groups(
    id              SERIAL PRIMARY KEY,
    assignment_id   INTEGER NOT NULL REFERENCES assignments(id),
    group_id        INTEGER NOT NULL REFERENCES groups(id),
    UNIQUE (assignment_id, group_id)
);

