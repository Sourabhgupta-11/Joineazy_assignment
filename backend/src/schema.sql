CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(150)  NOT NULL,
    email           VARCHAR(150)  NOT NULL,
    password_hash   VARCHAR(255)  NOT NULL,
    role            VARCHAR(10)   NOT NULL DEFAULT 'student',
    student_id      VARCHAR(50),
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_users_email        UNIQUE (email),
    CONSTRAINT uq_users_student_id   UNIQUE (student_id),
    CONSTRAINT chk_users_role        CHECK (role IN ('student', 'admin'))
);

CREATE TABLE IF NOT EXISTS groups (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(150)  NOT NULL,
    created_by      INTEGER       NOT NULL,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_groups_creator
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS group_members (
    id              SERIAL PRIMARY KEY,
    group_id        INTEGER       NOT NULL,
    user_id         INTEGER       NOT NULL,
    joined_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_gm_group
        FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
    CONSTRAINT fk_gm_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_gm_group_user
        UNIQUE (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS assignments (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(200)  NOT NULL,
    description     TEXT,
    due_date        TIMESTAMP     NOT NULL,
    onedrive_link   VARCHAR(500)  NOT NULL,
    target_type     VARCHAR(10)   NOT NULL DEFAULT 'all',
    created_by      INTEGER       NOT NULL,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_assignments_creator
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_assignments_target_type
        CHECK (target_type IN ('all', 'group'))
);

CREATE TABLE IF NOT EXISTS assignment_groups (
    id              SERIAL PRIMARY KEY,
    assignment_id   INTEGER       NOT NULL,
    group_id        INTEGER       NOT NULL,

    CONSTRAINT fk_ag_assignment
        FOREIGN KEY (assignment_id) REFERENCES assignments (id) ON DELETE CASCADE,
    CONSTRAINT fk_ag_group
        FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
    CONSTRAINT uq_ag_assignment_group
        UNIQUE (assignment_id, group_id)
);

CREATE TABLE IF NOT EXISTS submissions (
    id              SERIAL PRIMARY KEY,
    assignment_id   INTEGER       NOT NULL,
    group_id        INTEGER       NOT NULL,
    status          VARCHAR(10)   NOT NULL DEFAULT 'pending',
    confirmed_by    INTEGER,
    confirmed_at    TIMESTAMP,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sub_assignment
        FOREIGN KEY (assignment_id) REFERENCES assignments (id) ON DELETE CASCADE,
    CONSTRAINT fk_sub_group
        FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
    CONSTRAINT fk_sub_confirmed_by
        FOREIGN KEY (confirmed_by) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT uq_sub_assignment_group
        UNIQUE (assignment_id, group_id),
    CONSTRAINT chk_sub_status
        CHECK (status IN ('pending', 'confirmed'))
);


CREATE INDEX IF NOT EXISTS ix_group_members_by_group       ON group_members (group_id);
CREATE INDEX IF NOT EXISTS ix_group_members_by_user         ON group_members (user_id);
CREATE INDEX IF NOT EXISTS ix_assignment_groups_by_assign    ON assignment_groups (assignment_id);
CREATE INDEX IF NOT EXISTS ix_submissions_by_assignment      ON submissions (assignment_id);
CREATE INDEX IF NOT EXISTS ix_submissions_by_group           ON submissions (group_id);
