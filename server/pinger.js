const axios = require('axios');
const db = require('./db');
const cloudwatch = require('./cloudwatch_emulator');
const sns = require('./sns_emulator');

// Individual ping helper
async function checkSingleSite(site) {
  const startTime = Date.now();
  let status = 'down';
  let responseTime = null;
  let httpStatusCode = null;
  let errorMessage = null;

  try {
    const response = await axios.get(site.url, {
      timeout: site.timeout_ms || 3500, // Fast 3.5s timeout to prevent thread blocking
      headers: {
        'User-Agent': 'AWS-Uptime-Tracker-Bot/1.0 (VIT-AP CSE2025)',
        'Accept': '*/*',
      },
      maxRedirects: 3,
      validateStatus: () => true, // capture all status codes
    });

    responseTime = Math.max(1, Date.now() - startTime);
    httpStatusCode = response.status;

    if (response.status >= 200 && response.status < 400) {
      status = 'up';
    } else {
      status = 'down';
      errorMessage = `HTTP Status ${response.status}`;
    }
  } catch (err) {
    status = 'down';
    responseTime = null;
    errorMessage = err.code || err.message;
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      errorMessage = 'Timeout (exceeded 3500ms)';
      httpStatusCode = 408;
    }
  }

  return { site, status, responseTime, httpStatusCode, errorMessage };
}

// Global ping cycle: fully concurrent via Promise.allSettled
let isPinging = false;
async function pingAllSites() {
  if (isPinging) {
    console.log('[HealthChecker] Ping cycle already in progress, skipping duplicate call.');
    return [];
  }
  isPinging = true;

  try {
    const sitesResult = await db.query('SELECT * FROM sites WHERE is_active = true');
    const sites = sitesResult.rows;

    if (!sites || sites.length === 0) {
      isPinging = false;
      return [];
    }

    // Ping all sites concurrently!
    const checkPromises = sites.map((site) => checkSingleSite(site));
    const settleResults = await Promise.allSettled(checkPromises);

    const results = [];

    for (const res of settleResults) {
      if (res.status !== 'fulfilled') continue;
      const { site, status, responseTime, httpStatusCode, errorMessage } = res.value;

      // Determine previous status to detect state changes
      const prevCheck = await db.query(
        'SELECT status FROM checks WHERE site_id = $1 ORDER BY checked_at DESC LIMIT 1',
        [site.id]
      );
      const previousStatus = prevCheck.rows[0]?.status || 'unknown';

      // Persist check in database
      await db.query(
        `INSERT INTO checks (site_id, status, response_time, http_status_code, error_message, checked_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [site.id, status, responseTime, httpStatusCode, errorMessage]
      );

      // Record CloudWatch metric telemetry
      cloudwatch.recordMetric('ResponseTime', site.name, responseTime || 0, 'ms');
      cloudwatch.recordMetric('SiteStatus', site.name, status === 'up' ? 1 : 0, 'count');

      // State transition checks & Amazon SNS alerts
      if (status === 'down' && previousStatus === 'up') {
        const msgId = sns.publish(site, 'DOWNTIME', errorMessage || 'Website unreachable');
        await db.query(
          `INSERT INTO alerts (site_id, alert_type, status_changed_to, message, sns_message_id)
           VALUES ($1, 'DOWNTIME', 'down', $2, $3)`,
          [site.id, errorMessage || 'Website unreachable', msgId]
        );
      } else if (status === 'up' && previousStatus === 'down') {
        const msgId = sns.publish(site, 'RECOVERY', 'Website restored and reachable');
        await db.query(
          `INSERT INTO alerts (site_id, alert_type, status_changed_to, message, sns_message_id)
           VALUES ($1, 'RECOVERY', 'up', $2, $3)`,
          [site.id, 'Website recovered', msgId]
        );
      }

      results.push({ siteId: site.id, name: site.name, status, responseTime, httpStatusCode, errorMessage });
    }

    return results;
  } catch (err) {
    console.error('[HealthChecker Error]', err.message);
    return [];
  } finally {
    isPinging = false;
  }
}

module.exports = pingAllSites;