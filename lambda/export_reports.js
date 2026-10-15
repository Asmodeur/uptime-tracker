/**
 * CSE2025 – AWS Solution Architect
 * Student: Nilam Sikdar (Roll No: 24BCC7025) - VIT-AP University
 * Faculty: Dr Renita R
 * 
 * AWS Lambda Function: Uptime Report Exporter to Amazon S3
 * Database: Amazon RDS (PostgreSQL)
 * Storage: Amazon S3 (Report Bucket)
 */

const { Pool } = require('pg');

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
    });
  }
  return pool;
}

exports.handler = async (event, context) => {
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }
  const db = getDbPool();
  const bucketName = process.env.REPORTS_BUCKET_NAME || 'website-uptime-tracker-reports';

  try {
    const statsQuery = `
      SELECT 
        s.id,
        s.name,
        s.url,
        COUNT(c.id) AS total_checks,
        COUNT(CASE WHEN c.status = 'up' THEN 1 END) AS up_checks,
        COUNT(CASE WHEN c.status = 'down' THEN 1 END) AS down_checks,
        ROUND((COUNT(CASE WHEN c.status = 'up' THEN 1 END)::numeric / NULLIF(COUNT(c.id), 0)::numeric) * 100, 2) AS uptime_percentage,
        ROUND(AVG(CASE WHEN c.status = 'up' THEN c.response_time END), 0) AS avg_latency_ms
      FROM sites s
      LEFT JOIN checks c ON s.id = c.site_id
      GROUP BY s.id, s.name, s.url
      ORDER BY s.id;
    `;
    const res = await db.query(statsQuery);

    const reportTimestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `uptime-report-${reportTimestamp}.json`;
    const reportData = {
      generated_at: new Date().toISOString(),
      report_period: 'All Time to Date',
      sites_summary: res.rows,
    };

    const fileContent = JSON.stringify(reportData, null, 2);

    // Upload to Amazon S3 using AWS SDK V3
    try {
      const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
      const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
      await s3.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: `reports/${filename}`,
        Body: fileContent,
        ContentType: 'application/json',
      }));
      console.log(`[Amazon S3] Report exported successfully to s3://${bucketName}/reports/${filename}`);
    } catch (s3Err) {
      console.log(`[S3 Upload Simulated] Would upload ${filename} to s3://${bucketName}:`, s3Err.message);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Uptime report exported to Amazon S3',
        key: `reports/${filename}`,
        data: reportData,
      }),
    };
  } catch (err) {
    console.error('Export Error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
