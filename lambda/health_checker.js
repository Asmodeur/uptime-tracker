/**
 * CSE2025 – AWS Solution Architect
 * Student: Nilam Sikdar (Roll No: 24BCC7025) - VIT-AP University
 * Faculty: Dr Renita R
 * 
 * AWS Lambda Function: Scheduled Health Checker
 * Triggered by: Amazon EventBridge Rule (e.g. rate(1 minute))
 * Database: Amazon RDS (PostgreSQL)
 * Cloud Monitoring: Amazon CloudWatch (Custom Metrics)
 * Cloud Alerting: Amazon SNS (Downtime Notifications)
 */

const { Pool } = require('pg');
const https = require('https');
const http = require('http');

let pool;
function getDbPool() {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'uptime_db',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

/**
 * Pings an HTTP/HTTPS endpoint with latency measurement and error diagnosis
 */
function pingUrl(targetUrl, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let urlObj;
    try {
      urlObj = new URL(targetUrl);
    } catch (e) {
      return resolve({
        status: 'down',
        responseTime: null,
        statusCode: null,
        error: 'Invalid URL format',
      });
    }

    const client = urlObj.protocol === 'https:' ? https : http;
    const req = client.get(
      targetUrl,
      {
        timeout: timeoutMs,
        headers: {
          'User-Agent': 'AWS-Uptime-Tracker-Lambda/1.0 (VIT-AP CSE2025)',
        },
      },
      (res) => {
        const responseTime = Date.now() - startTime;
        // Consume response data to free sockets
        res.resume();
        const isUp = res.statusCode >= 200 && res.statusCode < 400;
        resolve({
          status: isUp ? 'up' : 'down',
          responseTime,
          statusCode: res.statusCode,
          error: isUp ? null : `HTTP Status ${res.statusCode}`,
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 'down',
        responseTime: null,
        statusCode: 408,
        error: 'Request Timeout (exceeded 5000ms)',
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 'down',
        responseTime: null,
        statusCode: null,
        error: err.code || err.message,
      });
    });
  });
}

/**
 * Publishes custom metric to Amazon CloudWatch
 */
async function publishCloudWatchMetric(siteName, status, responseTime) {
  const namespace = 'WebsiteUptimeTracker';
  const metricData = [
    {
      MetricName: 'SiteStatus',
      Dimensions: [{ Name: 'SiteName', Value: siteName }],
      Value: status === 'up' ? 1.0 : 0.0,
      Unit: 'Count',
      Timestamp: new Date(),
    },
  ];

  if (responseTime !== null) {
    metricData.push({
      MetricName: 'ResponseTime',
      Dimensions: [{ Name: 'SiteName', Value: siteName }],
      Value: responseTime,
      Unit: 'Milliseconds',
      Timestamp: new Date(),
    });
  }

  // AWS SDK V3 CloudWatch Client check (available natively in AWS Lambda Node 18/20 runtime)
  try {
    const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
    const cw = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' });
    await cw.send(new PutMetricDataCommand({ Namespace: namespace, MetricData: metricData }));
    console.log(`[CloudWatch] Metric published for ${siteName}: ${status} (${responseTime}ms)`);
  } catch (cwErr) {
    // When running locally or mock, log as CloudWatch formatted metric output
    console.log(`[CloudWatch Metric Telemetry] Namespace: ${namespace} | Site: ${siteName} | Status: ${status} | Latency: ${responseTime}ms`);
  }
}

/**
 * Publishes downtime or recovery alert to Amazon SNS topic
 */
async function publishSnsAlert(site, alertType, checkResult) {
  const topicArn = process.env.AWS_SNS_TOPIC_ARN;
  const subject = `[ALERT - AWS Uptime Tracker] ${site.name} is ${alertType.toUpperCase()}!`;
  const message = `
======================================================
AWS Website Uptime Tracker Alert Notification
======================================================
Monitored Service : ${site.name}
Target URL        : ${site.url}
New State         : ${alertType.toUpperCase()}
Status Code       : ${checkResult.statusCode || 'N/A'}
Diagnosis         : ${checkResult.error || 'Normal Operation Restored'}
Timestamp         : ${new Date().toISOString()}
AWS Region        : ${process.env.AWS_REGION || 'us-east-1'}
Trigger Source    : Amazon EventBridge -> AWS Lambda (HealthChecker)
======================================================
  `.trim();

  if (topicArn) {
    try {
      const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
      const sns = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });
      const res = await sns.send(new PublishCommand({
        TopicArn: topicArn,
        Subject: subject,
        Message: message,
      }));
      console.log(`[Amazon SNS] Alert published to topic: MessageId ${res.MessageId}`);
      return res.MessageId;
    } catch (snsErr) {
      console.error('[Amazon SNS Error]', snsErr.message);
    }
  } else {
    console.log(`[Amazon SNS Simulation] Alert dispatched for ${site.name}: ${alertType}`);
  }
  return 'MOCK-SNS-' + Date.now();
}

/**
 * Core health check cycle: pings all sites, stores results in RDS, emits telemetry
 */
async function runHealthChecks() {
  const db = getDbPool();
  console.log('[EventBridge Scheduled Event] Health checker Lambda execution started');

  const sitesResult = await db.query('SELECT * FROM sites WHERE is_active = true');
  const sites = sitesResult.rows;

  if (sites.length === 0) {
    console.log('[HealthChecker] No active sites configured in database.');
    return { checked: 0, up: 0, down: 0 };
  }

  let upCount = 0;
  let downCount = 0;

  for (const site of sites) {
    // Determine previous status to detect state changes
    const prevCheck = await db.query(
      'SELECT status FROM checks WHERE site_id = $1 ORDER BY checked_at DESC LIMIT 1',
      [site.id]
    );
    const previousStatus = prevCheck.rows[0]?.status || 'unknown';

    const result = await pingUrl(site.url, site.timeout_ms || 5000);

    if (result.status === 'up') {
      upCount++;
    } else {
      downCount++;
    }

    // Persist check in Amazon RDS
    await db.query(
      `INSERT INTO checks (site_id, status, response_time, http_status_code, error_message, checked_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      [site.id, result.status, result.responseTime, result.statusCode, result.error]
    );

    // Emit CloudWatch custom metric
    await publishCloudWatchMetric(site.name, result.status, result.responseTime);

    // State transition detection -> Dispatch Amazon SNS alert
    if (result.status === 'down' && previousStatus !== 'down') {
      const snsMsgId = await publishSnsAlert(site, 'DOWNTIME', result);
      await db.query(
        `INSERT INTO alerts (site_id, alert_type, status_changed_to, message, sns_message_id)
         VALUES ($1, 'DOWNTIME', 'down', $2, $3)`,
        [site.id, `Website down: ${result.error}`, snsMsgId]
      );
    } else if (result.status === 'up' && previousStatus === 'down') {
      const snsMsgId = await publishSnsAlert(site, 'RECOVERY', result);
      await db.query(
        `INSERT INTO alerts (site_id, alert_type, status_changed_to, message, sns_message_id)
         VALUES ($1, 'RECOVERY', 'up', $2, $3)`,
        [site.id, 'Website has recovered and is now responding normally.', snsMsgId]
      );
    }

    console.log(`[HealthChecker] ${site.name} (${site.url}) -> ${result.status} [${result.responseTime || 0}ms]`);
  }

  return { checked: sites.length, up: upCount, down: downCount };
}

/**
 * AWS Lambda Scheduled Event handler (Amazon EventBridge)
 */
exports.handler = async (event, context) => {
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }
  const summary = await runHealthChecks();
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'EventBridge scheduled health check complete',
      summary,
    }),
  };
};

exports.runHealthChecks = runHealthChecks;
exports.pingUrl = pingUrl;
