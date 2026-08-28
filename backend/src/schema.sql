BEGIN;

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

CREATE TABLE IF NOT EXISTS courses (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(150)  NOT NULL,
    description     TEXT,
    code            VARCHAR(20)   NOT NULL,
    created_by      INTEGER       NOT NULL,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_courses_professor
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_courses_code
        UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS course_enrollments (
    id              SERIAL PRIMARY KEY,
    course_id       INTEGER       NOT NULL,
    student_id      INTEGER       NOT NULL,
    enrolled_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_enroll_course
        FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
    CONSTRAINT fk_enroll_student
        FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_enroll_course_student
        UNIQUE (course_id, student_id)
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

CREATE TABLE IF NOT EXISTS group_invites (
    id                SERIAL PRIMARY KEY,
    group_id          INTEGER       NOT NULL,
    invited_user_id   INTEGER       NOT NULL,
    invited_by        INTEGER       NOT NULL,
    status            VARCHAR(10)   NOT NULL DEFAULT 'pending',
    created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at      TIMESTAMP,

    CONSTRAINT fk_invite_group
        FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
    CONSTRAINT fk_invite_user
        FOREIGN KEY (invited_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_invite_inviter
        FOREIGN KEY (invited_by) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_invite_status
        CHECK (status IN ('pending', 'accepted', 'declined'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_invite_one_pending_per_target
    ON group_invites (group_id, invited_user_id)
    WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS assignments (
    id              SERIAL PRIMARY KEY,
    course_id       INTEGER,
    title           VARCHAR(200)  NOT NULL,
    description     TEXT,
    due_date        TIMESTAMP     NOT NULL,
    onedrive_link   VARCHAR(500)  NOT NULL,
    submission_type VARCHAR(12)   NOT NULL DEFAULT 'group',
    target_type     VARCHAR(10)   NOT NULL DEFAULT 'all',
    created_by      INTEGER       NOT NULL,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_assignments_course
        FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
    CONSTRAINT fk_assignments_creator
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_assignments_target_type
        CHECK (target_type IN ('all', 'group')),
    CONSTRAINT chk_assignments_submission_type
        CHECK (submission_type IN ('individual', 'group'))
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
    group_id        INTEGER,
    student_id      INTEGER,
    status          VARCHAR(10)   NOT NULL DEFAULT 'pending',
    confirmed_by    INTEGER,
    confirmed_at    TIMESTAMP,
    review_status   VARCHAR(12)   NOT NULL DEFAULT 'unchecked',
    feedback        TEXT,
    reviewed_by     INTEGER,
    reviewed_at     TIMESTAMP,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sub_assignment
        FOREIGN KEY (assignment_id) REFERENCES assignments (id) ON DELETE CASCADE,
    CONSTRAINT fk_sub_group
        FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
    CONSTRAINT fk_sub_student
        FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_sub_confirmed_by
        FOREIGN KEY (confirmed_by) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_sub_reviewed_by
        FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT uq_sub_assignment_group
        UNIQUE (assignment_id, group_id),
    CONSTRAINT uq_sub_assignment_student
        UNIQUE (assignment_id, student_id),
    CONSTRAINT chk_sub_status
        CHECK (status IN ('pending', 'confirmed')),
    CONSTRAINT chk_sub_review_status
        CHECK (review_status IN ('unchecked', 'approved', 'rejected')),
    CONSTRAINT chk_sub_target
        CHECK (
            (group_id IS NOT NULL AND student_id IS NULL) OR
            (group_id IS NULL AND student_id IS NOT NULL)
        )
);

CREATE INDEX IF NOT EXISTS ix_group_members_by_group       ON group_members (group_id);
CREATE INDEX IF NOT EXISTS ix_group_members_by_user         ON group_members (user_id);
CREATE INDEX IF NOT EXISTS ix_group_invites_by_group        ON group_invites (group_id);
CREATE INDEX IF NOT EXISTS ix_group_invites_by_user          ON group_invites (invited_user_id);
CREATE INDEX IF NOT EXISTS ix_assignment_groups_by_assign    ON assignment_groups (assignment_id);
CREATE INDEX IF NOT EXISTS ix_submissions_by_assignment      ON submissions (assignment_id);
CREATE INDEX IF NOT EXISTS ix_submissions_by_group           ON submissions (group_id);
CREATE INDEX IF NOT EXISTS ix_enrollments_by_course          ON course_enrollments (course_id);
CREATE INDEX IF NOT EXISTS ix_enrollments_by_student         ON course_enrollments (student_id);
CREATE INDEX IF NOT EXISTS ix_courses_by_creator             ON courses (created_by);

COMMIT;


ALTER TABLE assignments ADD COLUMN IF NOT EXISTS course_id INTEGER;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS submission_type VARCHAR(12) NOT NULL DEFAULT 'group';

ALTER TABLE submissions ALTER COLUMN group_id DROP NOT NULL;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS student_id INTEGER;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS review_status VARCHAR(12) NOT NULL DEFAULT 'unchecked';
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS feedback TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS reviewed_by INTEGER;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_assignments_course') THEN
    ALTER TABLE assignments
      ADD CONSTRAINT fk_assignments_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_assignments_submission_type') THEN
    ALTER TABLE assignments
      ADD CONSTRAINT chk_assignments_submission_type CHECK (submission_type IN ('individual', 'group'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_sub_student') THEN
    ALTER TABLE submissions
      ADD CONSTRAINT fk_sub_student FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_sub_reviewed_by') THEN
    ALTER TABLE submissions
      ADD CONSTRAINT fk_sub_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_sub_review_status') THEN
    ALTER TABLE submissions
      ADD CONSTRAINT chk_sub_review_status CHECK (review_status IN ('unchecked', 'approved', 'rejected'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_sub_assignment_student') THEN
    ALTER TABLE submissions
      ADD CONSTRAINT uq_sub_assignment_student UNIQUE (assignment_id, student_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_sub_target') THEN
    ALTER TABLE submissions
      ADD CONSTRAINT chk_sub_target CHECK (
        (group_id IS NOT NULL AND student_id IS NULL) OR
        (group_id IS NULL AND student_id IS NOT NULL)
      ) NOT VALID;
    ALTER TABLE submissions VALIDATE CONSTRAINT chk_sub_target;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_submissions_by_student ON submissions (student_id);
CREATE INDEX IF NOT EXISTS ix_assignments_by_course ON assignments (course_id);