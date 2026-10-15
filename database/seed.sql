-- ==============================================================================
-- CSE2025 AWS Solution Architect - Seed Data for Website Uptime Tracker
-- Student: Nilam Sikdar (Roll No: 24BCC7025)
-- ==============================================================================

INSERT INTO sites (name, url, check_interval, timeout_ms, is_active) VALUES
    ('Google Search', 'https://www.google.com', 30, 5000, true),
    ('GitHub Portal', 'https://github.com', 30, 5000, true),
    ('AWS Cloud Portal', 'https://aws.amazon.com', 30, 5000, true),
    ('VIT-AP University', 'https://vitap.ac.in', 30, 5000, true),
    ('Cloudflare DNS', 'https://1.1.1.1', 30, 3000, true)
ON CONFLICT (url) DO NOTHING;

-- Seed historical checks for demonstration (Last 5 checks for each)
INSERT INTO checks (site_id, status, response_time, http_status_code, error_message, checked_at)
SELECT 
    s.id, 
    'up', 
    (120 + (s.id * 18)), 
    200, 
    NULL, 
    NOW() - INTERVAL '5 minutes'
FROM sites s;

INSERT INTO checks (site_id, status, response_time, http_status_code, error_message, checked_at)
SELECT 
    s.id, 
    'up', 
    (135 + (s.id * 15)), 
    200, 
    NULL, 
    NOW() - INTERVAL '4 minutes'
FROM sites s;

INSERT INTO checks (site_id, status, response_time, http_status_code, error_message, checked_at)
SELECT 
    s.id, 
    'up', 
    (110 + (s.id * 20)), 
    200, 
    NULL, 
    NOW() - INTERVAL '3 minutes'
FROM sites s;

INSERT INTO checks (site_id, status, response_time, http_status_code, error_message, checked_at)
SELECT 
    s.id, 
    'up', 
    (140 + (s.id * 12)), 
    200, 
    NULL, 
    NOW() - INTERVAL '2 minutes'
FROM sites s;

INSERT INTO checks (site_id, status, response_time, http_status_code, error_message, checked_at)
SELECT 
    s.id, 
    'up', 
    (125 + (s.id * 16)), 
    200, 
    NULL, 
    NOW() - INTERVAL '1 minute'
FROM sites s;
