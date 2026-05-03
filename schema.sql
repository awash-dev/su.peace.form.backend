-- ============================================================
-- Samara Peace Forum Union — Database Schema
-- Aligned with server/index.js (PostgreSQL / Neon)
-- ============================================================


-- 1. Categories / Positions Table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    image TEXT,                     -- Cloudinary logo URL
    description TEXT,               -- Short catchphrase/summary
    about_content TEXT,             -- Detailed "About Us" text
    mission_content TEXT,           -- Institutional mission statement
    vision_content TEXT,            -- Institutional vision statement
    goal_content TEXT,              -- Institutional goal statement
    leader_name TEXT,               -- Manually assigned institutional head
    leader_role TEXT                -- Manually assigned role title
);


-- 2. Union Members Table
CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    category TEXT,                  -- Links to categories.name
    grade TEXT,                     -- Academic level
    department TEXT,
    id_number TEXT,
    graduation_year TEXT,
    position TEXT,                  -- Role within the union
    image TEXT,                     -- Cloudinary profile photo URL
    id_image TEXT,                  -- Cloudinary student ID scan URL
    password_hash TEXT,             -- Default password for members
    status VARCHAR(20) DEFAULT 'pending',  -- pending | approved | rejected
    joined_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


-- 3. News Posts Table
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT,                  -- Links to categories.name
    image TEXT,                     -- Primary Cloudinary post image URL
    images TEXT[],                  -- Array of extra Cloudinary image URLs
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


-- 4. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',  -- admin | superadmin
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


-- 5. Inbox / Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_name TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    subject TEXT,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    status VARCHAR(20) DEFAULT 'unread',  -- unread | read | replied
    reply_content TEXT,
    replied_at TIMESTAMPTZ,
    replied_by TEXT,                -- Email of the admin who replied
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


-- 6. Executives Table
CREATE TABLE IF NOT EXISTS executives (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT,
    department TEXT,
    row_level INTEGER DEFAULT 3,    -- Display order / hierarchy level
    icon TEXT DEFAULT 'User',       -- Lucide icon name
    image TEXT,                     -- Cloudinary profile photo URL
    student_category TEXT,          -- Regular | Extension | Summer | etc.
    telegram TEXT,                  -- Telegram handle (@username)
    "union" TEXT,                   -- Union branch this executive belongs to
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


-- 7. Resources Table
CREATE TABLE IF NOT EXISTS resources (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,             -- pdf | doc | image | link | etc.
    size TEXT,                      -- Human-readable size string e.g. "2.4 MB"
    category TEXT NOT NULL,         -- Links to categories.name
    url TEXT NOT NULL,              -- R2 / Cloudinary public URL
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


-- 8. Plans Table
CREATE TABLE IF NOT EXISTS plans (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,         -- Links to categories.name (or admin role)
    status VARCHAR(20) DEFAULT 'pending',  -- pending | active | completed
    created_by TEXT,                -- Email of the admin who created the plan
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


-- 9. Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Default settings seed
INSERT INTO settings (key, value)
VALUES ('registrations_enabled', 'true')
ON CONFLICT (key) DO NOTHING;


-- ============================================================
-- Indexes for common query patterns
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_members_category    ON members (category);
CREATE INDEX IF NOT EXISTS idx_members_status      ON members (status);
CREATE INDEX IF NOT EXISTS idx_members_email       ON members (email);
CREATE INDEX IF NOT EXISTS idx_posts_category      ON posts (category);
CREATE INDEX IF NOT EXISTS idx_posts_created_at    ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_status     ON messages (status);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_executives_row      ON executives (row_level ASC, id ASC);
CREATE INDEX IF NOT EXISTS idx_plans_category      ON plans (category);
CREATE INDEX IF NOT EXISTS idx_resources_category  ON resources (category);


-- 10. Meetings Table
CREATE TABLE IF NOT EXISTS meetings (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMPTZ NOT NULL,
    location TEXT,
    category TEXT NOT NULL,         -- Links to categories.name
    status VARCHAR(20) DEFAULT 'upcoming', -- upcoming | completed | cancelled
    created_by TEXT,                -- Email of the admin who created the meeting
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_meetings_category    ON meetings (category);
CREATE INDEX IF NOT EXISTS idx_meetings_date        ON meetings (date ASC);