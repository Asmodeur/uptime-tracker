# AWS Architecture Specification
## Website Uptime Tracker — Cloud Migration
### Course: CSE2025 – AWS Solution Architect | Student: Nilam Sikdar (24BCC7025) | Guide: Dr Renita R

---

## 1. High-Level Architecture Overview

The system consists of three distinct tiers designed for scalability, zero idle compute waste, and strict boundary isolation:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT & EDGE TIER                                   │
│                                                                                        │
│   [ Client Browser ]                                                                   │
│           │                                                                            │
│           ├─── HTTPS ────► [ Amazon CloudFront (Edge CDN) ]                            │
│           │                          │                                                 │
│           │                          ▼ (Origin Access Control)                         │
│           │                [ Amazon S3 Bucket: Static React Frontend ]                 │
│           │                                                                            │
│           └─── HTTPS REST ► [ Amazon API Gateway (HTTP API) ]                          │
└──────────────────────────────────────┬─────────────────────────────────────────────────┘
                                       │
                                       ▼ (Proxy Integration)
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                  COMPUTE & SCHEDULING                                  │
│                                                                                        │
│   [ AWS Lambda: API Handler ] ◄─────────────────────────────────────────────────────── │
│   - GET /sites (Aggregate uptime & status)                                             │
│   - POST /sites (Register URL)                                                         │
│   - DELETE /sites/:id (Remove monitor)                                                 │
│   - GET /sites/:id/history (Fetch check logs)                                          │
│   - POST /check (Manual check trigger)                                                 │
│                                                                                        │
│   [ Amazon EventBridge ] (Rate: 1 min / Cron: every minute)                            │
│           │                                                                            │
│           ▼                                                                            │
│   [ AWS Lambda: Health Checker ]                                                       │
│   - Queries active sites from RDS                                                      │
│   - Asynchronously pings target endpoints with 5000ms timeout                          │
│   - Measures roundtrip latency & HTTP response codes                                   │
│   - Emits custom metrics to CloudWatch                                                 │
│   - Dispatches alerts to Amazon SNS on state changes                                   │
└──────────────────┬───────────────────────────────────────────────────┬─────────────────┘
                   │                                                   │
                   ▼                                                   ▼
┌──────────────────────────────────────┐     ┌───────────────────────────────────────────┐
│           DATA PERSISTENCE           │     │          MONITORING & ALERTING            │
│                                      │     │                                           │
│   [ Amazon RDS (PostgreSQL 16) ]     │     │   [ Amazon CloudWatch ]                   │
│   - sites (Catalog)                  │     │   - Custom Namespace: WebsiteUptimeTracker│
│   - checks (History & Latencies)     │     │   - Metrics: ResponseTime, SiteStatus     │
│   - alerts (Notification Audit)      │     │   - Alarms: Checker Errors, High Latency  │
│   - v_site_uptime_stats (View)       │     │                                           │
│                                      │     │   [ Amazon SNS ]                          │
│   [ Amazon S3: Reports Bucket ]      │     │   - Topic: WebsiteUptimeAlertsTopic       │
│   - Long-term uptime JSON/CSV audits │     │   - Protocol: Email & SMS                 │
└──────────────────────────────────────┘     └───────────────────────────────────────────┘
```

---

## 2. AWS Well-Architected Framework Evaluation

### Pillar 1: Operational Excellence
- **Infrastructure as Code (IaC)**: The entire infrastructure is provisioned through Terraform (`terraform/`) and AWS SAM (`aws/template.yaml`). No manual, error-prone console configurations.
- **Observability**: CloudWatch Logs captures execution telemetry for both API and Checker Lambdas. Custom metrics in the `WebsiteUptimeTracker` namespace provide immediate visibility into site latency and availability.
- **Self-Monitoring**: A dedicated CloudWatch Alarm (`WebsiteUptimeChecker-ErrorAlarm`) monitors the health check function itself; if the checker encounters errors or halts, an SNS notification is dispatched.

### Pillar 2: Security
- **Identity and Access Management (IAM)**: Scoped execution roles govern Lambda compute. The API Lambda has zero permissions to alter S3 reports or publish SNS alerts; the Health Checker Lambda has strictly scoped write permissions to `WebsiteUptimeAlertsTopic` and the custom metric namespace.
- **Origin Access Control (OAC)**: Direct public access to the S3 frontend bucket is disabled. The bucket policy requires traffic to originate through the authenticated CloudFront distribution via AWS SigV4.
- **Secret Isolation**: Database credentials are provided via environment variables injected through Terraform/SAM without hardcoding.

### Pillar 3: Reliability
- **Fault-Tolerant Scheduling**: Moving from client-side JavaScript intervals to Amazon EventBridge guarantees health checks execute 24/7, independent of whether any user has the dashboard open.
- **Stateless Serverless Compute**: If a Lambda execution environment encounters an unhandled network error, the container is destroyed and replaced automatically without affecting subsequent checks.
- **PostgreSQL Connection Resiliency**: The database adapter reuses connection pools across warm Lambda invocations and handles graceful reconnects.

### Pillar 4: Performance Efficiency
- **Edge Caching via CloudFront**: Static HTML, JavaScript chunks, and CSS stylesheets are cached at CloudFront edge locations worldwide, reducing latency to <30ms globally.
- **Asynchronous Health Checks**: The Health Checker Lambda tests multiple endpoints concurrently using non-blocking Node.js HTTP/HTTPS requests with configured timeouts (5000ms), completing full cluster checks in seconds.
- **Database Indexing**: Relational queries on `checks (site_id, checked_at DESC)` ensure latency remains sub-millisecond even with hundreds of thousands of historical check records.

### Pillar 5: Cost Optimization
- **Zero Idle Compute Cost**: By replacing an always-on Railway/EC2 server with AWS Lambda, compute cost drops to $0.00 when the system is inactive.
- **100% Free Tier Compliance**:
  - Amazon RDS: `db.t4g.micro` (750 hours/month free).
  - AWS Lambda: 1,000,000 requests/month free (~43,200 used).
  - Amazon S3: 5GB storage free (<50MB used).
  - CloudFront: 1TB transfer out free.

---

## 3. Data Flow & Request Lifecycles

### 3.1 Scheduled Health Check Lifecycle (Every 1 Minute)
1. **EventBridge Rule**: Fires a scheduled cloud event every minute (`rate(1 minute)`).
2. **Lambda Invocation**: The EventBridge rule invokes `HealthCheckerFunction` with an event payload.
3. **Database Query**: Lambda queries Amazon RDS PostgreSQL for active sites (`is_active = true`).
4. **Concurrent HTTP Ping**: Lambda performs asynchronous `GET` requests to each target URL, measuring response latency and response codes.
5. **Persistence**: Check results (status, latency, status code, error) are committed to the `checks` table.
6. **CloudWatch Metrics**: Lambda calls `cloudwatch:PutMetricData` to push `ResponseTime` and `SiteStatus`.
7. **State Transition & Alerting**:
   - If previous status was `up` and new status is `down`, an incident alert is published to the `WebsiteUptimeAlertsTopic` Amazon SNS topic.
   - SNS pushes emails to subscribed users.
   - An audit row is inserted into the `alerts` table.

### 3.2 User Dashboard Request Lifecycle
1. **Frontend Asset Retrieval**: The user navigates to the CloudFront distribution domain (`https://d1234.cloudfront.net`). CloudFront serves cached assets from Amazon S3.
2. **API Data Fetch**: The React app issues a `GET` request to Amazon API Gateway (`/sites`).
3. **Lambda Execution**: API Gateway routes the request to `WebsiteUptimeTracker-ApiLambda`.
4. **Analytical SQL Query**: Lambda executes an optimized query against RDS PostgreSQL calculating uptime percentage using `COUNT(CASE WHEN status = 'up' THEN 1 END) / COUNT(*) * 100`.
5. **JSON Response**: Lambda returns JSON with CORS headers; React renders live status badges and sparkline timelines.
