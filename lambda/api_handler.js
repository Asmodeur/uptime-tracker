/**
 * CSE2025 – AWS Solution Architect
 * Student: Nilam Sikdar (Roll No: 24BCC7025) - VIT-AP University
 * Faculty: Dr Renita R
 * 
 * AWS Lambda Function: API Handler
 * Triggered by: Amazon API Gateway (REST API / HTTP API Proxy)
 * Database: Amazon RDS (PostgreSQL)
 * Least-Privilege IAM Role: WebsiteUptimeTracker-ApiLambdaRole
 */

const { Pool } = require('pg');

// Reusable connection pool across Lambda container invocations
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

// Standard CORS response headers for API Gateway
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
};

function buildResponse(statusCode, body) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

/**
 * Main AWS Lambda Entrypoint
 */
exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  // Handle preflight CORS OPTIONS requests
  const httpMethod = event.httpMethod || event.requestContext?.http?.method || 'GET';
  if (httpMethod === 'OPTIONS') {
    return buildResponse(200, { message: 'CORS OK' });
  }

  // Normalize path
  const path = event.path || event.rawPath || '/';
  const pathParameters = event.pathParameters || {};
  const db = getDbPool();

  try {
    // -------------------------------------------------------------------------
    // GET /sites - List all monitored websites with live status & uptime %
    // -------------------------------------------------------------------------
    if (httpMethod === 'GET' && (path === '/sites' || path === '/prod/sites' || path === '/dev/sites')) {
      const sitesQuery = `
        SELECT 
          s.id,
          s.name,
          s.url,
          s.check_interval,
          s.is_active,
          s.created_at,
          COUNT(c.id) AS total_checks,
          COUNT(CASE WHEN c.status = 'up' THEN 1 END) AS up_checks,
          CASE 
            WHEN COUNT(c.id) > 0 THEN 
              ROUND((COUNT(CASE WHEN c.status = 'up' THEN 1 END)::numeric / COUNT(c.id)::numeric) * 100, 1)
            ELSE NULL 
          END AS uptime_percentage,
          ROUND(AVG(CASE WHEN c.status = 'up' THEN c.response_time END), 0) AS avg_response_time
        FROM sites s
        LEFT JOIN checks c ON s.id = c.site_id
        GROUP BY s.id
        ORDER BY s.id ASC;
      `;
      const sitesResult = await db.query(sitesQuery);

      // Fetch the latest check for each site
      const enrichedSites = await Promise.all(
        sitesResult.rows.map(async (site) => {
          const latestCheck = await db.query(
            'SELECT status, response_time, http_status_code, checked_at FROM checks WHERE site_id = $1 ORDER BY checked_at DESC LIMIT 1',
            [site.id]
          );
          const latest = latestCheck.rows[0];
          return {
            ...site,
            status: latest?.status || 'unknown',
            response_time: latest?.response_time || null,
            last_checked_at: latest?.checked_at || null,
            latest_status_code: latest?.http_status_code || null,
          };
        })
      );

      return buildResponse(200, enrichedSites);
    }

    // -------------------------------------------------------------------------
    // POST /sites - Register a new website to monitor
    // -------------------------------------------------------------------------
    if (httpMethod === 'POST' && (path === '/sites' || path === '/prod/sites' || path === '/dev/sites')) {
      const body = event.body ? JSON.parse(event.body) : {};
      let { name, url, check_interval } = body;

      if (!name || !url) {
        return buildResponse(400, { error: 'Both name and url fields are required.' });
      }

      // Automatically prepend protocol if omitted
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const insertQuery = `
        INSERT INTO sites (name, url, check_interval)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      const result = await db.query(insertQuery, [name.trim(), url.trim(), check_interval || 30]);

      return buildResponse(201, {
        message: 'Website registered successfully',
        site: {
          ...result.rows[0],
          status: 'unknown',
          uptime_percentage: null,
          response_time: null,
        },
      });
    }

    // -------------------------------------------------------------------------
    // DELETE /sites/{id} - Remove a monitored site
    // -------------------------------------------------------------------------
    if (httpMethod === 'DELETE' && (path.startsWith('/sites/') || pathParameters.id)) {
      const id = pathParameters.id || path.split('/').filter(Boolean).pop();

      const deleteQuery = 'DELETE FROM sites WHERE id = $1 RETURNING id;';
      const result = await db.query(deleteQuery, [id]);

      if (result.rowCount === 0) {
        return buildResponse(404, { error: 'Site not found' });
      }

      return buildResponse(200, { message: 'Site deleted successfully', id });
    }

    // -------------------------------------------------------------------------
    // GET /sites/{id}/history - Fetch historical check logs for a site
    // -------------------------------------------------------------------------
    if (httpMethod === 'GET' && path.includes('/history')) {
      const parts = path.split('/').filter(Boolean);
      const siteIdIndex = parts.indexOf('history') - 1;
      const id = pathParameters.id || parts[siteIdIndex];

      const historyQuery = `
        SELECT id, site_id, status, response_time, http_status_code, error_message, checked_at
        FROM checks
        WHERE site_id = $1
        ORDER BY checked_at DESC
        LIMIT 20;
      `;
      const result = await db.query(historyQuery, [id]);

      return buildResponse(200, result.rows);
    }

    // -------------------------------------------------------------------------
    // POST /check - Trigger an immediate health check ping across all sites
    // -------------------------------------------------------------------------
    if (httpMethod === 'POST' && (path === '/check' || path === '/prod/check' || path === '/dev/check')) {
      // Import the shared checker module
      const { runHealthChecks } = require('./health_checker');
      const summary = await runHealthChecks();
      return buildResponse(200, {
        message: 'Manual health check invocation complete',
        timestamp: new Date().toISOString(),
        summary,
      });
    }

    // -------------------------------------------------------------------------
    // GET /stats - Overall CloudWatch & RDS system status
    // -------------------------------------------------------------------------
    if (httpMethod === 'GET' && (path === '/stats' || path === '/prod/stats' || path === '/dev/stats')) {
      const statsQuery = `
        SELECT 
          COUNT(s.id) AS total_monitored_sites,
          (SELECT COUNT(*) FROM checks) AS total_checks_logged,
          (SELECT COUNT(*) FROM alerts) AS total_alerts_dispatched,
          (
            SELECT ROUND((COUNT(CASE WHEN status = 'up' THEN 1 END)::numeric / NULLIF(COUNT(*), 0)::numeric) * 100, 2)
            FROM checks
          ) AS global_uptime_percentage
        FROM sites s;
      `;
      const result = await db.query(statsQuery);

      return buildResponse(200, {
        ...result.rows[0],
        cloud_provider: 'AWS',
        region: process.env.AWS_REGION || 'us-east-1',
        architecture: {
          iam: 'Active (Least Privilege)',
          compute: 'AWS Lambda (Node.js 20.x)',
          storage: 'Amazon S3 (Static Hosting + Reports)',
          database: 'Amazon RDS (PostgreSQL 16)',
          gateway: 'Amazon API Gateway',
          scheduler: 'Amazon EventBridge (30s schedule)',
          monitoring: 'Amazon CloudWatch',
          alerting: 'Amazon SNS',
        },
      });
    }

    // Default Route Not Found
    return buildResponse(404, { error: `Route not found: ${httpMethod} ${path}` });
  } catch (error) {
    console.error('Lambda Execution Error:', error);
    return buildResponse(500, {
      error: 'Internal Server Error',
      details: error.message,
    });
  }
};
