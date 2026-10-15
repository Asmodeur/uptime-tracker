# CSE2025: AWS Solution Architect — Viva Defense Guide
## Website Uptime Tracker — Cloud Migration to AWS
### Candidate: Nilam Sikdar (Roll No: 24BCC7025) | Faculty Guide: Dr Renita R | VIT-AP University

---

## 1. Core Architecture & Service Selection Questions

### Q1: Why did you migrate this project to AWS instead of keeping it on Vercel/Railway/Supabase?
**Answer**:
"The summer prototype on Vercel, Railway, and Supabase was a monolithic web deployment with significant architectural drawbacks:
1. **Idle compute waste**: Railway runs a continuously active container even when no checks or users are present, generating unnecessary costs.
2. **Client-dependent scheduling**: The health check was triggered by an in-app JavaScript 30-second interval, which meant health checks only ran reliably when a browser tab was open.
3. **Vendor fragmentation**: Managing three separate platforms created security silos without unified identity, centralized logging, or custom alarming.

By migrating to AWS, we unified compute, storage, scheduling, and database onto AWS-managed infrastructure. We decoupled scheduling into **Amazon EventBridge**, compute into **AWS Lambda**, data into **Amazon RDS**, edge delivery into **Amazon CloudFront + S3**, and automated self-monitoring via **Amazon CloudWatch + SNS**, all governed by **AWS IAM** least-privilege security."

---

### Q2: How did you meet the mandatory course rubric requirement of four AWS services?
**Answer**:
"The course rubric requires at least four AWS services spanning Access Management, Compute, Storage, and Database:
1. **AWS IAM (Access Management — Mandatory)**: We defined least-privilege IAM execution roles for the Lambda functions and scoped resource policies restricting access to S3, CloudWatch metric namespaces, and the SNS topic.
2. **AWS Lambda (Compute — Mandatory)**: We wrote serverless Node.js 20.x handlers: one for the REST API Gateway proxy and one for the recurring health-check ping worker.
3. **Amazon S3 (Storage — Mandatory)**: We use S3 for hosting the compiled React static website with CloudFront Origin Access Control, and a second bucket for cold-storage archiving of historical uptime audit reports.
4. **Amazon RDS PostgreSQL (Database — Mandatory)**: We provisioned an RDS instance running PostgreSQL 16 to persist sites, checks, and alerts with optimized relational views, replacing Supabase.

In addition, we integrated 5 supplemental services: **Amazon API Gateway** (REST API), **Amazon EventBridge** (cloud scheduler), **Amazon CloudWatch** (telemetry & alarms), **Amazon SNS** (pub/sub alerts), and **Amazon CloudFront** (edge CDN)."

---

### Q3: Why did you choose Amazon RDS (PostgreSQL) instead of Amazon DynamoDB (NoSQL)?
**Answer**:
"While DynamoDB is an excellent serverless NoSQL database, Amazon RDS (PostgreSQL) was deliberately selected for three reasons:
1. **Complex Relational Aggregations**: Computing uptime percentage requires aggregating historical check statuses per site (`COUNT(up) / COUNT(total) * 100`). In PostgreSQL, this is computed via a single indexed relational view in sub-milliseconds. In DynamoDB, calculating this across tens of thousands of items would require expensive partition table scans or maintaining synchronized atomic counters.
2. **Referential Integrity**: When a site is deleted, cascading foreign keys (`ON DELETE CASCADE`) automatically purge its associated checks and alerts, preventing orphaned records.
3. **Zero Cost on Free Tier**: Amazon RDS Free Tier provides 750 monthly hours of `db.t4g.micro` with 20GB of gp3 storage, allowing us to run a managed PostgreSQL instance for $0.00/month."

---

### Q4: How does Amazon EventBridge replace the original client-side polling loop?
**Answer**:
"In the original app, `setInterval(runCheck, 30000)` was executed in the React frontend. If the user closed their laptop, monitoring ceased completely.
In our AWS architecture, **Amazon EventBridge** runs a managed cloud schedule rule (`rate(1 minute)`). It triggers the `HealthCheckerFunction` Lambda on AWS infrastructure 24 hours a day, 365 days a year, completely independent of whether any client browser is active. This decouples monitoring logic from client presence."

---

## 2. Security & Access Management (AWS IAM) Questions

### Q5: Explain how you implemented the Principle of Least Privilege in AWS IAM.
**Answer**:
"We implemented least privilege across three dimensions:
1. **Zero Long-Lived Credentials**: We do not store or transmit hardcoded `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY`. Lambda functions assume IAM execution roles dynamically via AWS Security Token Service (STS) temporary credentials.
2. **Action and Resource Scoping**:
   - The API Lambda role has permissions only to write CloudWatch logs and connect to VPC network interfaces.
   - The Health-Checker Lambda policy specifically restricts `sns:Publish` to the exact ARN of `WebsiteUptimeAlertsTopic`, and restricts `cloudwatch:PutMetricData` using a condition key requiring `cloudwatch:namespace = WebsiteUptimeTracker`.
3. **S3 Origin Access Control (OAC)**: Public read access to the S3 bucket is completely blocked. The bucket policy permits `s3:GetObject` only if the caller is the Amazon CloudFront service principal matching the specific distribution ARN."

---

## 3. Monitoring, Alarms & Alerting Questions

### Q6: How does the system achieve 'self-monitoring' using Amazon CloudWatch?
**Answer**:
"A key objective was ensuring the monitoring tool itself is monitored. We achieved this via two CloudWatch mechanisms:
1. **Custom Telemetry**: During each execution, the health-check Lambda emits custom metrics (`ResponseTime` and `SiteStatus`) to the `WebsiteUptimeTracker` namespace with dimensions identifying each site name and URL.
2. **Self-Monitoring CloudWatch Alarm**: We created an alarm (`WebsiteUptimeChecker-ErrorAlarm`) on the AWS Lambda native metric `Errors`. If the health checker Lambda crashes, times out, or throws an unhandled exception, CloudWatch triggers the alarm and publishes a high-priority incident message to the Amazon SNS topic."

---

### Q7: How does Amazon SNS prevent alert fatigue or notification flooding?
**Answer**:
"In our Lambda logic, before dispatching an alert, we query the `checks` table for the target website's previous status.
- An alert is **only published upon state transition**:
  - `up` ➔ `down` dispatches a **Downtime Incident Notification**.
  - `down` ➔ `up` dispatches a **Recovery Confirmation Notification**.
- If a site remains down across 10 consecutive check cycles, the system does not spam the user with 10 duplicate emails. It logs each check to RDS while keeping SNS dispatches strictly limited to state change events."

---

## 4. Performance, Cost & Scaling Questions

### Q8: How did you ensure the project stays strictly within the AWS Free Tier?
**Answer**:
"We carefully engineered each resource to adhere to AWS Free Tier limits:
- **RDS**: Configured with `instance_class = db.t4g.micro` and `allocated_storage = 20` (within the 750 hours/month and 20GB gp3 allowance).
- **Lambda**: Configured with 256MB memory. Running 1 check/minute consumes 43,200 invocations/month, well within the 1,000,000 free monthly requests.
- **S3 & CloudFront**: S3 storage is <50MB (within 5GB limit), and CloudFront traffic is <1GB (within 1TB transfer out limit).
- **EventBridge & SNS**: EventBridge usage is ~43,200 events/month (within 14M limit), and SNS email usage is ~20-50 messages/month (within 1,000 free email notifications limit).
The total operating cost is **$0.00 per month**."

---

### Q9: How do you handle AWS Lambda cold starts and database connection limits?
**Answer**:
"1. **Lambda Cold Starts**: We chose the lightweight **Node.js 20.x** runtime, which has sub-200ms cold starts compared to Java or .NET.
2. **PostgreSQL Connection Pooling**: Lambda containers are ephemeral, and creating a new DB connection on every invocation can exhaust database connection limits. We defined the `pg.Pool` instance outside the Lambda handler function. In warm Lambda containers, the database connection pool is reused across consecutive invocations, reducing connection overhead to zero."

---

### Q10: If the system scaled to 10,000 tracked websites, how would you evolve the architecture?
**Answer**:
"To scale from dozens of sites to 10,000+:
1. **Fan-Out via Amazon SQS**: Instead of a single Lambda pinging 10,000 sites sequentially, EventBridge would trigger a dispatcher Lambda that pushes check tasks into an **Amazon SQS** queue.
2. **Worker Concurrency**: Worker Lambda functions would scale horizontally to consume SQS messages in batches of 10, pinging hundreds of websites in parallel.
3. **Amazon RDS Proxy**: We would deploy **Amazon RDS Proxy** in front of PostgreSQL to pool and share database connections across thousands of concurrent Lambda instances.
4. **Read Replicas & TimescaleDB / DynamoDB**: Historical time-series check data could be partitioned into Amazon Timestream or DynamoDB, keeping relational RDS focused on catalog metadata."
