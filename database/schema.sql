-- ==============================================================================
-- CSE2025 AWS Solution Architect - Website Uptime Tracker
-- Student: Nilam Sikdar (Roll No: 24BCC7025) - VIT-AP University
-- Faculty: Dr Renita R
-- Target Database: Amazon RDS (PostgreSQL 15 / 16)
-- ==============================================================================

-- Drop tables if needed (for fresh setup)
DROP VIEW IF EXISTS v_site_uptime_stats;
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS checks;
DROP TABLE IF EXISTS sites;

-- 1. Sites Table: Stores all registered URLs to be monitored
CREATE TABLE IF NOT EXISTS sites (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    url TEXT NOT NULL UNIQUE,
    check_interval INT DEFAULT 30, -- Interval in seconds
    timeout_ms INT DEFAULT 5000,   -- Timeout threshold in milliseconds
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Checks Table: Historical log of every health check ping
CREATE TABLE IF NOT EXISTS checks (
    id BIGSERIAL PRIMARY KEY,
    site_id INT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('up', 'down', 'degraded')),
    response_time INT,             -- Latency in milliseconds (null if timeout/down)
    http_status_code INT,          -- e.g., 200, 404, 500, or null
    error_message TEXT,            -- Diagnostic error message (e.g. ENOTFOUND, ETIMEDOUT)
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes for fast history lookups and dashboard aggregation
CREATE INDEX IF NOT EXISTS idx_checks_site_id_checked_at 
    ON checks (site_id, checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_checks_checked_at 
    ON checks (checked_at DESC);

-- 3. Alerts Table: Records Amazon SNS notification dispatch events
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    site_id INT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'DOWNTIME', 'RECOVERY', 'HIGH_LATENCY'
    status_changed_to VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    sns_message_id VARCHAR(100),     -- AWS SNS Message ID returned by sns:Publish
    channel VARCHAR(50) DEFAULT 'email',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_site_id 
    ON alerts (site_id, sent_at DESC);

-- 4. Analytical View: Real-time Uptime Percentage & Summary
CREATE OR REPLACE VIEW v_site_uptime_stats AS
SELECT 
    s.id,
    s.name,
    s.url,
    s.is_active,
    s.created_at,
    COUNT(c.id) AS total_checks,
    COUNT(CASE WHEN c.status = 'up' THEN 1 END) AS up_checks,
    COUNT(CASE WHEN c.status = 'down' THEN 1 END) AS down_checks,
    CASE 
        WHEN COUNT(c.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN c.status = 'up' THEN 1 END)::numeric / COUNT(c.id)::numeric) * 100, 2)
        ELSE NULL 
    END AS uptime_percentage,
    ROUND(AVG(CASE WHEN c.status = 'up' THEN c.response_time END), 0) AS avg_response_time_ms
FROM sites s
LEFT JOIN checks c ON s.id = c.site_id
GROUP BY s.id, s.name, s.url, s.is_active, s.created_at;
