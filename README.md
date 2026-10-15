# Website Uptime Tracker — Cloud Migration to AWS
### CSE2025: AWS Solution Architect | VIT-AP University
**Student:** Nilam Sikdar (`24BCC7025`) | **Faculty Guide:** Dr Renita R | **Specialization:** Blockchain Engineering

[![AWS Architecture](https://img.shields.io/badge/AWS-Solution%20Architect-FF9900?logo=amazon-aws)](ARCHITECTURE.md)
[![Status](https://img.shields.io/badge/Status-Fully%20Implemented-brightgreen)](CSE2025_FINAL_PROJECT_REPORT.md)
[![Free Tier](https://img.shields.io/badge/Cost-%240.00%2FMonth%20(Free%20Tier)-blue)](ARCHITECTURE.md#pillar-5-cost-optimization)

---

## 📌 Project Overview
The **Website Uptime Tracker** is an enterprise-grade cloud-native uptime monitoring and reliability platform re-architected on **Amazon Web Services (AWS)**. Migrated from a monolithic setup (Vercel, Railway, Supabase), it leverages AWS managed serverless services to provide 24/7 automated health-checks, millisecond latency measurements, historical uptime percentage analytics, and instantaneous multi-channel incident notifications via Amazon SNS.

The solution satisfies and exceeds the **CSE2025** rubric by deploying **4 mandatory AWS services** across IAM, Compute, Storage, and Database, rounded out by **5 supplemental cloud services**.

---

## 🏗️ Architecture & AWS Service Mapping

```
                               AWS Architecture Flow
                               ====================

       [ User Browser ]
              │
              ├─── HTTPS (Static Assets) ──────► [ Amazon CloudFront (Edge CDN) ]
              │                                                │
              │                                                ▼ (Origin Access Control)
              │                                      [ Amazon S3 (Frontend Bucket) ]
              │
              └─── HTTPS (REST API Calls) ─────► [ Amazon API Gateway (HTTP API) ]
                                                               │
                                                               ▼
                                                     [ AWS Lambda (API Handler) ]
                                                               │
                                                               ▼ (Connection Pool)
                                                    [ Amazon RDS (PostgreSQL 16) ]
                                                               ▲
                                                               │
        [ Amazon EventBridge ] ────────────────► [ AWS Lambda (Health-Checker) ]
        (Scheduled 1-min Cron)                                 │
                                                               ├───► [ CloudWatch (Custom Metrics) ]
                                                               │           │
                                                               │           ▼ (On Alarm / Down)
                                                               └───► [ Amazon SNS (Email/SMS Alerts) ]
                                                               │
                                                               └───► [ Amazon S3 (Reports Bucket) ]

    * AWS IAM Least-Privilege Execution Roles and Scoped Resource Policies govern all communication.
```

### Course Rubric Service Fulfillment

| AWS Service | Category | Rubric Status | Purpose in Architecture |
| :--- | :--- | :--- | :--- |
| **AWS IAM** | Access Management | **Mandatory #1** | Execution roles for Lambda functions; scoped least-privilege policies for S3, RDS, CloudWatch, and SNS. |
| **AWS Lambda** | Compute | **Mandatory #2** | Serverless REST API handlers and EventBridge scheduled health-check worker. |
| **Amazon S3** | Storage | **Mandatory #3** | Hosts the React static dashboard with OAC and archives historical uptime audit reports. |
| **Amazon RDS (PostgreSQL)** | Database | **Mandatory #4** | Managed relational database hosting `sites`, `checks`, `alerts` tables and uptime analytics view. |
| **Amazon API Gateway** | Networking | Supplemental | HTTP REST API proxy routing `/sites`, `/check`, and `/stats` to Lambda with CORS. |
| **Amazon EventBridge** | Scheduling | Supplemental | Decoupled cloud cron rule (`rate(1 minute)`) triggering health-check Lambda 24/7. |
| **Amazon CloudWatch** | Monitoring | Supplemental | Self-monitoring telemetry (`WebsiteUptimeTracker` namespace), logs, and checker error alarms. |
| **Amazon SNS** | Alerting | Supplemental | Pub/Sub topic `WebsiteUptimeAlertsTopic` sending instant downtime alerts via email & SMS. |
| **Amazon CloudFront** | Edge CDN | Supplemental | Low-latency global CDN with SSL termination and Origin Access Control (OAC). |

---

## 🚀 Quick Start & Local Demonstration

This project includes a **Dual-Mode Engine**: it connects natively to **Amazon RDS (PostgreSQL)** when AWS credentials are provided, or seamlessly falls back to a **zero-configuration embedded database** with local EventBridge, CloudWatch, and SNS simulation for instant demonstration and viva testing without AWS billing.

### 1. One-Click Development Start
From the project directory:
```bash
# Starts both the backend API server and the Vite frontend concurrently
npm run dev:all
```
The application will launch at:
- **Frontend Dashboard**: `http://localhost:5173`
- **Backend Cloud API**: `http://localhost:3001`

### 2. Standalone Commands
```bash
# Start backend server only
npm run server

# Start frontend Vite server only
npm run dev

# Build production bundle
npm run build
```

---

## 📂 Repository Structure

```
├── aws/
│   ├── iam/                         # Least-privilege IAM policy definitions
│   │   ├── lambda-api-policy.json
│   │   ├── lambda-checker-policy.json
│   │   ├── lambda-trust-policy.json
│   │   └── s3-static-hosting-policy.json
│   └── template.yaml                # AWS SAM / CloudFormation Infrastructure Template
├── database/
│   ├── schema.sql                   # Amazon RDS PostgreSQL DDL (tables, indexes, view)
│   └── seed.sql                     # Seed endpoints and initial check data
├── lambda/
│   ├── api_handler.js               # REST API Gateway Lambda handler
│   ├── health_checker.js            # EventBridge scheduled worker (pings, CW, SNS)
│   └── export_reports.js            # S3 uptime audit report generator
├── server/                          # Dual-mode backend server & AWS emulator
│   ├── index.js                     # Express API & EventBridge background scheduler
│   ├── db.js                        # Dual-mode DB adapter (RDS PostgreSQL + Fallback)
│   ├── local_db.js                  # Disk-persisted SQL-compatible mock engine
│   ├── pinger.js                    # Asynchronous network ping engine
│   ├── cloudwatch_emulator.js       # Live CloudWatch custom metric tracker
│   └── sns_emulator.js              # Live Amazon SNS alert notification dispatcher
├── src/                             # Upgraded React 19 + Tailwind CSS Frontend
│   ├── components/
│   │   ├── Header.jsx               # AWS Cloud branded navigation header
│   │   ├── AwsArchitectureBanner.jsx# 9-Service interactive status ribbon
│   │   ├── MetricCards.jsx          # Live uptime %, latency, and incident counters
│   │   ├── AddSiteForm.jsx          # URL auto-formatter & domain detection
│   │   ├── Sitecard.jsx             # Status badge, latency tag, & sparkline timeline
│   │   ├── HistoryLog.jsx           # Expandable RDS check logs drawer
│   │   └── AwsArchitectureModal.jsx # Interactive Viva Evidence & Telemetry showcase
│   ├── services/api.js              # Cloud API client with CloudWatch/SNS endpoints
│   └── App.jsx                      # Main dashboard controller & auto-sync
├── terraform/                       # Complete Terraform Infrastructure as Code
│   ├── main.tf                      # Provider setup & tags
│   ├── variables.tf                 # Free Tier parameter configuration
│   ├── iam.tf                       # Scoped IAM roles and policies
│   ├── rds.tf                       # Amazon RDS PostgreSQL db.t4g.micro instance
│   ├── lambda.tf                    # Lambda functions packaging & deployment
│   ├── apigateway.tf                # API Gateway HTTP API & CORS
│   ├── eventbridge.tf               # EventBridge 1-minute schedule rule
│   ├── s3_cloudfront.tf             # S3 buckets & CloudFront CDN with OAC
│   ├── cloudwatch_sns.tf            # Metric alarms & SNS topic subscriptions
│   └── outputs.tf                   # Endpoints summary for viva evaluation
├── ARCHITECTURE.md                  # Detailed AWS Solution Architecture Specification
├── AWS_DEPLOYMENT_GUIDE.md          # Step-by-step deployment manual (Terraform / SAM / Console)
├── CSE2025_FINAL_PROJECT_REPORT.md  # Official submission report for Dr Renita R
└── VIVA_QUESTIONS_AND_ANSWERS.md    # Comprehensive viva preparation cheat-sheet
```

---

## 💰 AWS Free Tier Compliance ($0.00/Month)

All services adhere strictly to AWS Free Tier limits:
- **Amazon RDS**: `db.t4g.micro`, 20GB gp3 (750 hours/mo included = $0.00)
- **AWS Lambda**: 256MB Node.js 20.x (~43,200 invocations/mo vs 1M free allowance = $0.00)
- **Amazon S3**: <50MB storage vs 5GB free allowance = $0.00
- **Amazon CloudFront**: <1GB data transfer vs 1TB free allowance = $0.00
- **CloudWatch & SNS**: 2 custom metrics (10 free) + ~50 alert emails (1,000 free) = $0.00
- **Total Operating Cost: $0.00 / month**

---

## 🎓 Academic Review & Viva Documents
- 📄 [Final Project Report](CSE2025_FINAL_PROJECT_REPORT.md)
- 🏛️ [AWS Solution Architecture Deep Dive](ARCHITECTURE.md)
- 🚀 [AWS Deployment Guide](AWS_DEPLOYMENT_GUIDE.md)
- 🎯 [Viva Questions & Answers Cheat-Sheet](VIVA_QUESTIONS_AND_ANSWERS.md)
