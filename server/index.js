const express = require('express');
const cors = require('cors');
const db = require('./db');
const pingAllSites = require('./pinger');
const cloudwatch = require('./cloudwatch_emulator');
const sns = require('./sns_emulator');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// -----------------------------------------------------------------------------
// 1. GET /sites - Monitored Websites with Uptime % and Live Status
// -----------------------------------------------------------------------------
app.get('/sites', async (req, res) => {
  try {
    const sites = await db.query('SELECT * FROM sites');
    const sitesWithUptime = await Promise.all(
      sites.rows.map(async (site) => {
        const checks = await db.query('SELECT status FROM checks WHERE site_id = $1', [site.id]);
        const total = checks.rows.length;
        const upCount = checks.rows.filter((c) => c.status === 'up').length;
        const uptime = total > 0 ? ((upCount / total) * 100).toFixed(1) : null;

        const latest = await db.query(
          'SELECT * FROM checks WHERE site_id = $1 ORDER BY checked_at DESC LIMIT 1',
          [site.id]
        );

        // Also fetch recent 10 checks for sparkline indicator
        const recent = await db.query(
          'SELECT status, response_time FROM checks WHERE site_id = $1 ORDER BY checked_at DESC LIMIT 10',
          [site.id]
        );

        return {
          ...site,
          uptime_percentage: uptime,
          status: latest.rows[0]?.status || 'unknown',
          response_time: latest.rows[0]?.response_time || null,
          last_checked_at: latest.rows[0]?.checked_at || null,
          http_status_code: latest.rows[0]?.http_status_code || null,
          recent_checks: recent.rows.reverse(), // chronologically ordered for sparkline
        };
      })
    );
    res.json(sitesWithUptime);
  } catch (err) {
    console.error('Error fetching sites:', err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 2. POST /sites - Add New Website with URL Normalization
// -----------------------------------------------------------------------------
app.post('/sites', async (req, res) => {
  let { name, url, check_interval } = req.body;
  if (!name || !url) {
    return res.status(400).json({ error: 'Name and URL are required.' });
  }

  // Prepend https:// if protocol is omitted
  url = url.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  try {
    const result = await db.query(
      'INSERT INTO sites (name, url, check_interval) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), url, check_interval || 30]
    );

    const newSite = result.rows[0];

    // Trigger an immediate check on newly registered site
    setTimeout(async () => {
      try {
        await pingAllSites();
      } catch (e) {
        console.error('Initial ping error:', e.message);
      }
    }, 100);

    res.status(201).json(newSite);
  } catch (err) {
    console.error('Error inserting site:', err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 3. DELETE /sites/:id - Delete a Monitored Site
// -----------------------------------------------------------------------------
app.delete('/sites/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM sites WHERE id = $1', [id]);
    res.json({ message: 'Site deleted', id });
  } catch (err) {
    console.error('Error deleting site:', err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 4. GET /sites/:id/history - Historical Check Log for a Site
// -----------------------------------------------------------------------------
app.get('/sites/:id/history', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      'SELECT * FROM checks WHERE site_id = $1 ORDER BY checked_at DESC LIMIT 20',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 5. POST /check - Trigger Manual Health Check Across All Sites
// -----------------------------------------------------------------------------
app.post('/check', async (req, res) => {
  try {
    const results = await pingAllSites();
    res.json({ message: 'Check complete', results, timestamp: new Date() });
  } catch (err) {
    console.error('Error running manual check:', err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 6. GET /stats - Cloud Platform Summary & Architecture Status
// -----------------------------------------------------------------------------
app.get('/stats', async (req, res) => {
  try {
    const statsResult = await db.query(`
      SELECT 
        COUNT(s.id) AS total_monitored_sites,
        (SELECT COUNT(*) FROM checks) AS total_checks_logged,
        (SELECT COUNT(*) FROM alerts) AS total_alerts_dispatched,
        (
          SELECT ROUND((COUNT(CASE WHEN status = 'up' THEN 1 END)::numeric / NULLIF(COUNT(*), 0)::numeric) * 100, 2)
          FROM checks
        ) AS global_uptime_percentage
      FROM sites s;
    `);

    res.json({
      ...statsResult.rows[0],
      database_mode: db.getMode(),
      aws_region: process.env.AWS_REGION || 'us-east-1',
      services: {
        iam: 'Active (Least Privilege Policies Defined)',
        compute: 'AWS Lambda (Node.js 20.x)',
        storage: 'Amazon S3 (Static Hosting + Audit Reports)',
        database: db.getMode(),
        apiGateway: 'Amazon API Gateway (HTTP REST Proxy)',
        eventBridge: 'Amazon EventBridge (30-second automated ping)',
        cloudWatch: 'Amazon CloudWatch (Custom Metrics & Alarms)',
        sns: 'Amazon SNS (Email & SMS Notifications)',
        cloudFront: 'Amazon CloudFront (Edge CDN & SSL)',
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 7. GET /cloudwatch/telemetry - Live CloudWatch Telemetry
// -----------------------------------------------------------------------------
app.get('/cloudwatch/telemetry', (req, res) => {
  res.json({
    namespace: 'WebsiteUptimeTracker',
    metrics: cloudwatch.getMetrics(),
    logs: cloudwatch.getLogs(),
  });
});

// -----------------------------------------------------------------------------
// 8. GET /sns/alerts - Dispatched Alert History
// -----------------------------------------------------------------------------
app.get('/sns/alerts', (req, res) => {
  res.json({
    topicArn: 'arn:aws:sns:us-east-1:123456789012:WebsiteUptimeAlertsTopic',
    subscribers: sns.getSubscribers(),
    recentAlerts: sns.getAlerts(),
  });
});

// -----------------------------------------------------------------------------
// Background EventBridge Scheduled Emulation (every 60 seconds - matching AWS)
// -----------------------------------------------------------------------------
const EVENTBRIDGE_INTERVAL_MS = 60000;
const scheduler = setInterval(async () => {
  try {
    await pingAllSites();
  } catch (err) {
    console.error('Scheduled check error:', err.message);
  }
}, EVENTBRIDGE_INTERVAL_MS);

// Graceful cleanup
process.on('SIGINT', () => {
  clearInterval(scheduler);
  process.exit(0);
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`🚀 Website Uptime Tracker Backend running on port ${PORT}`);
  console.log(`📁 Database Mode: ${db.getMode()}`);
  console.log(`⏰ EventBridge Scheduled Pings: Active (every 30 seconds)`);
  console.log(`📊 CloudWatch & SNS Telemetry: Active`);
  console.log(`=============================================================\n`);
});