# CSE2025 – AWS Solution Architect
## Final Project Report & Implementation Review
### Website Uptime Tracker — Cloud Migration to AWS

---

| Field | Detail |
| :--- | :--- |
| **Student Name** | Nilam Sikdar |
| **Roll Number** | 24BCC7025 |
| **Branch / Specialization** | B.Tech CSE / Blockchain Engineering |
| **Institution** | VIT-AP University |
| **Faculty Guide** | Dr Renita R |
| **Course Code & Title** | CSE2025 – AWS Solution Architect |
| **Project Title** | Website Uptime Tracker — Cloud Migration to AWS |
| **Submission Date** | October 2026 |

---

## 1. Executive Summary & Abstract
Maintaining high availability is a mission-critical requirement for modern internet services. Even brief periods of unexpected downtime can result in immediate loss of revenue, degraded user experience, and reputational damage. Existing commercial uptime monitoring platforms are frequently prohibitively expensive or enforce restrictive check frequencies on free tiers.

This project delivers the complete cloud re-architecture and deployment of the **Website Uptime Tracker** on **Amazon Web Services (AWS)**. Originally prototyped as a monolithic web app on third-party platforms (React/Vite on Vercel, Node.js/Express on Railway, and PostgreSQL on Supabase), the system has been re-engineered into an enterprise-grade, serverless, decoupled cloud architecture adhering to the **AWS Well-Architected Framework**.

The migrated system fulfills all course rubric guidelines by deploying:
1. **AWS IAM (Mandatory — Access Management)**: Least-privilege execution roles and scoped resource policies.
2. **AWS Lambda (Mandatory — Compute)**: Serverless REST API handlers and an automated scheduled health-check worker.
3. **Amazon S3 (Mandatory — Storage)**: Secure static website hosting for the React dashboard and cold-storage bucket for historical reliability audit reports.
4. **Amazon RDS PostgreSQL (Mandatory — Database)**: Managed relational database replacing Supabase, running indexed relational schemas and analytical views.
5. **Amazon API Gateway (Optional — Networking)**: Low-latency HTTPS REST API proxy with cross-origin resource sharing (CORS).
6. **Amazon EventBridge (Optional — Scheduling)**: Decoupled recurring cloud cron triggering health checks automatically.
7. **Amazon CloudWatch (Optional — Monitoring)**: Self-monitoring telemetry, capturing execution logs, custom metrics, and alarm triggers.
8. **Amazon SNS (Optional — Alerting)**: Multi-channel pub/sub notification topic alerting subscribers via Email and SMS on downtime.
9. **Amazon CloudFront (Optional — Edge CDN)**: Low-latency global edge caching with SSL termination and Origin Access Control (OAC).

The entire infrastructure operates **100% within the AWS Free Tier ($0.00/month)**.

---

## 2. Problem Statement & Motivation
In the initial summer prototype, website monitoring was dependent on:
- An in-memory, client-side polling interval that only ran while a browser tab was open.
- Server hosting tied to Railway containers with idling cold-starts.
- Supabase hosted PostgreSQL with vendor lock-in.

### Cloud Migration Objectives:
- **Cloud-Native Decoupling**: Eliminate continuous server idle costs by migrating compute to on-demand serverless functions (**AWS Lambda**).
- **Persistent Scheduling**: Move check triggers from in-app timers to a managed cloud cron engine (**Amazon EventBridge**) that runs 24/7/365 without human intervention.
- **Enterprise Security**: Enforce granular access boundaries with **AWS IAM**, ensuring compute functions only access specific DB credentials and S3 prefixes.
- **Self-Monitoring**: Implement cloud telemetry using **Amazon CloudWatch** so the monitoring tool itself is monitored for errors, stalls, and high latency.
- **Automated Incident Alerting**: Dispatch immediate push notifications through **Amazon SNS** when downtime occurs.

---

## 3. System Architecture & Component Mapping

```
                                 AWS Cloud Architecture
                                 ======================

       [ User Browser ]
              │
              ├─── HTTPS (GET Static Assets) ──► [ Amazon CloudFront (CDN) ]
              │                                             │
              │                                             ▼ (Origin Access Control)
              │                                   [ Amazon S3 (Frontend Bucket) ]
              │
              └─── HTTPS (REST API Calls) ─────► [ Amazon API Gateway ]
                                                            │
                                                            ▼ (Proxy Integration)
                                                  [ AWS Lambda (API Handler) ]
                                                            │
                                                            ▼ (PostgreSQL Connection Pool)
                                                 [ Amazon RDS (PostgreSQL 16) ]
                                                            ▲
                                                            │
        [ Amazon EventBridge ] ────────────────► [ AWS Lambda (Health-Checker) ]
        (Rate: 1 min Schedule)                              │
                                                            ├───► [ CloudWatch (Metrics & Logs) ]
                                                            │           │
                                                            │           ▼ (On Alarm / Transition)
                                                            └───► [ Amazon SNS (Email/SMS Alerts) ]
                                                            │
                                                            └───► [ Amazon S3 (Audit Reports Bucket) ]

    * AWS IAM: Enforces Least-Privilege Execution Roles and Scoped Policies across all services.
```

### 3.1 Course Rubric Fulfillment Matrix

| AWS Service | Category | Rubric Role | Project Implementation Detail | Free Tier Allocation |
| :--- | :--- | :--- | :--- | :--- |
| **AWS IAM** | Access Management | **Mandatory #1** | Execution roles for API & Checker Lambdas; scoped policies for S3, RDS, CloudWatch, and SNS. | Always Free ($0.00) |
| **AWS Lambda** | Compute | **Mandatory #2** | Serverless Node.js 20.x runtime; handles REST endpoints and asynchronous ping worker. | 1,000,000 requests/mo + 3.2M sec compute |
| **Amazon S3** | Storage | **Mandatory #3** | Bucket 1: React static build (HTML, JS, CSS). Bucket 2: Exported uptime audit logs (JSON/CSV). | 5 GB Standard Storage + 20,000 GETs |
| **Amazon RDS** | Database | **Mandatory #4** | PostgreSQL 16 engine hosting `sites`, `checks`, and `alerts` tables with analytical uptime views. | 750 hrs/mo db.t4g.micro + 20GB gp3 |
| **Amazon API Gateway** | Networking | Supplemental | HTTP REST API proxy routing `/sites`, `/check`, and `/stats` to Lambda with CORS. | 1,000,000 API calls/mo |
| **Amazon EventBridge** | Scheduling | Supplemental | Cloud cron rule (`rate(1 minute)`) triggering health-check Lambda 24/7 independently. | 14,000,000 events/mo |
| **Amazon CloudWatch** | Monitoring | Supplemental | Emits custom metric `WebsiteUptimeTracker/ResponseTime` & `SiteStatus`; alarms on checker stalls. | 10 custom metrics + 5 GB logs |
| **Amazon SNS** | Alerting | Supplemental | Pub/Sub topic `WebsiteUptimeAlertsTopic` sending instant email & SMS notices on downtime. | 1,000 email notifications/mo |
| **Amazon CloudFront** | Edge CDN | Supplemental | Edge distribution with Origin Access Control (OAC) providing HTTPS and global asset caching. | 1 TB data transfer out/mo |

---

## 4. Database Schema Design (Amazon RDS PostgreSQL)

The schema replaces third-party Supabase dependencies with a high-performance, indexed PostgreSQL structure:

```sql
-- 1. Sites Table: Monitored endpoint catalog
CREATE TABLE sites (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    url TEXT NOT NULL UNIQUE,
    check_interval INT DEFAULT 30,
    timeout_ms INT DEFAULT 5000,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Checks Table: Historical ping results
CREATE TABLE checks (
    id BIGSERIAL PRIMARY KEY,
    site_id INT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('up', 'down', 'degraded')),
    response_time INT,
    http_status_code INT,
    error_message TEXT,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_checks_site_id_checked_at ON checks (site_id, checked_at DESC);

-- 3. Alerts Table: Dispatch audit trail
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    site_id INT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    status_changed_to VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    sns_message_id VARCHAR(100),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Analytical View: Real-time Uptime Computation
CREATE OR REPLACE VIEW v_site_uptime_stats AS
SELECT 
    s.id,
    s.name,
    s.url,
    COUNT(c.id) AS total_checks,
    COUNT(CASE WHEN c.status = 'up' THEN 1 END) AS up_checks,
    ROUND((COUNT(CASE WHEN c.status = 'up' THEN 1 END)::numeric / NULLIF(COUNT(c.id), 0)::numeric) * 100, 2) AS uptime_percentage,
    ROUND(AVG(CASE WHEN c.status = 'up' THEN c.response_time END), 0) AS avg_response_time_ms
FROM sites s
LEFT JOIN checks c ON s.id = c.site_id
GROUP BY s.id, s.name, s.url;
```

---

## 5. Security & Least-Privilege IAM Architecture
Security in AWS is enforced through the principle of least privilege:
- **No Shared Keys**: The application does not store hardcoded AWS credentials (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`). All compute services authenticate using IAM instance/execution roles via AWS STS temporary credentials.
- **Scoped S3 Policy**: The frontend bucket blocks all direct public traffic (`BlockPublicAcls = true`, `BlockPublicPolicy = true`). Traffic is strictly restricted to the Amazon CloudFront distribution using **Origin Access Control (OAC)** with AWS SigV4 request signing.
- **Scoped SNS Publishing**: The Health-Checker Lambda execution policy is scoped exclusively to `arn:aws:sns:*:*:WebsiteUptimeAlertsTopic`, preventing unauthorized messaging to other topics.
- **Scoped CloudWatch Metrics**: Permission is restricted to the custom metric namespace `WebsiteUptimeTracker`.

---

## 6. AWS Free Tier Cost Optimization
To comply with course guidelines prohibiting unnecessary expenditure, all services are strictly sized within AWS Free Tier limits:

| Resource | Free Tier Allowance | Project Consumption | Monthly Cost |
| :--- | :--- | :--- | :--- |
| **Amazon RDS PostgreSQL** | 750 hrs `db.t4g.micro` + 20 GB gp3 | 1 instance (744 hrs/mo), 20 GB storage | **$0.00** |
| **AWS Lambda** | 1,000,000 requests + 3.2M sec compute | ~43,200 scheduled runs + ~5,000 API calls | **$0.00** |
| **Amazon S3** | 5 GB storage + 20,000 GET requests | ~15 MB frontend build + ~5 MB reports | **$0.00** |
| **Amazon CloudFront** | 1 TB data transfer out | < 1 GB / month | **$0.00** |
| **Amazon API Gateway** | 1,000,000 HTTP API calls | ~10,000 requests / month | **$0.00** |
| **Amazon EventBridge** | 14,000,000 free events | ~43,200 events / month | **$0.00** |
| **Amazon CloudWatch** | 10 custom metrics + 5 GB logs | 2 custom metrics (`SiteStatus`, `ResponseTime`) | **$0.00** |
| **Amazon SNS** | 1,000 email alerts | ~20–50 alert dispatches | **$0.00** |
| **Total Monthly Cost** | — | — | **$0.00 / month** |

---

## 7. Verification & Implementation Results

1. **Live Network Health Checks**:
   - The health checker successfully pings active HTTP/HTTPS targets, records precise round-trip latency in milliseconds, captures HTTP status codes (200, 404, 500, etc.), and catches network connection errors (`ECONNRESET`, `ETIMEDOUT`).
2. **Real-Time Sparkline History & Analytics**:
   - The user interface renders a 10-interval historical sparkline bar indicator for each website, enabling immediate visualization of uptime reliability.
3. **Automated SNS Incident Notifications**:
   - When a site transitions from UP to DOWN, an incident notification payload is generated and published to the SNS topic, dispatching emails to `nilam.sikdar@example.com`.
4. **CloudWatch Custom Telemetry**:
   - Custom metrics are continuously pushed into the `WebsiteUptimeTracker` namespace, viewable in the interactive Viva telemetry panel.

---

## 8. Conclusion
The Website Uptime Tracker has been successfully migrated from third-party hosting to an enterprise-grade AWS architecture. By utilizing 4 mandatory services (IAM, Lambda, S3, RDS) and 5 complementary services (API Gateway, EventBridge, CloudWatch, SNS, CloudFront), the solution fulfills all evaluation parameters of the **CSE2025 – AWS Solution Architect** curriculum with 100% Free Tier compliance.
