# AWS Deployment Guide
## Website Uptime Tracker — Cloud Migration
### Student: Nilam Sikdar (24BCC7025) | Guide: Dr Renita R | VIT-AP University

---

## Overview
This guide provides complete instructions to deploy the Website Uptime Tracker into an AWS account. Three deployment options are supported:
1. **Option A (Recommended)**: Automated Infrastructure as Code using **Terraform**.
2. **Option B**: Automated Serverless deployment using **AWS SAM** (Serverless Application Model).
3. **Option C**: Manual deployment walkthrough via the **AWS Management Console**.

---

## Prerequisites
- An active AWS Account (Free Tier eligible).
- Node.js (v18 or higher) and npm installed locally.
- AWS CLI configured with valid credentials (`aws configure`).
- Terraform (>= 1.5.0) or AWS SAM CLI installed.

---

## Option A: Automated Deployment with Terraform

### Step 1: Initialize Terraform
Navigate to the terraform directory:
```bash
cd "v/Uptime Website/terraform"
terraform init
```

### Step 2: Review and Customize Variables
Inspect `variables.tf`. You can optionally create a `terraform.tfvars` file to supply custom values:
```hcl
aws_region   = "us-east-1"
environment  = "prod"
alert_email  = "your.email@example.com"
db_password  = "YourSecurePassword2026!"
```

### Step 3: Plan and Apply
Generate an execution plan and apply the configuration:
```bash
terraform plan
terraform apply -auto-approve
```

Terraform will provision:
- IAM execution roles and least-privilege policies.
- Amazon RDS PostgreSQL database instance (`db.t4g.micro`, 20GB gp3).
- AWS Lambda functions (`api_handler`, `health_checker`, `export_reports`).
- Amazon API Gateway HTTP API with CORS.
- Amazon EventBridge 1-minute recurring rule.
- Amazon S3 frontend and reports buckets.
- Amazon CloudFront CDN distribution with Origin Access Control (OAC).
- Amazon CloudWatch metric alarms and Amazon SNS alert topic with email subscription.

### Step 4: Run Database Migrations
Once the RDS instance is online, apply the schema and seed data:
```bash
# Obtain the RDS endpoint from Terraform outputs
terraform output rds_postgres_endpoint

# Apply the schema using psql
psql -h <RDS_ENDPOINT> -p 5432 -U postgresadmin -d uptime_db -f "../database/schema.sql"
psql -h <RDS_ENDPOINT> -p 5432 -U postgresadmin -d uptime_db -f "../database/seed.sql"
```

### Step 5: Build and Deploy the React Frontend to Amazon S3
```bash
cd "../"
# Set the API Gateway URL in your build environment
export VITE_API_URL="<API_GATEWAY_URL_FROM_TERRAFORM>"

# Build production assets
npm run build

# Synchronize build artifacts to S3
aws s3 sync dist/ s3://<S3_FRONTEND_BUCKET_NAME>/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id <CLOUDFRONT_DISTRIBUTION_ID> --paths "/*"
```

Your application is now live at `https://<CLOUDFRONT_DOMAIN_NAME>`!

---

## Option B: Deployment with AWS SAM

### Step 1: Build the SAM Application
```bash
cd "v/Uptime Website/aws"
sam build
```

### Step 2: Guided Deployment
```bash
sam deploy --guided
```
Prompt responses:
- Stack Name: `website-uptime-tracker-stack`
- AWS Region: `us-east-1`
- Parameter AlertEmail: `your.email@example.com`
- Parameter DbPassword: `YourSecurePassword2026!`
- Confirm changes before deploy: `Y`
- Allow SAM CLI IAM role creation: `Y`

SAM will deploy the CloudFormation stack and output the API Gateway URL, S3 bucket names, and RDS endpoint.

---

## Option C: Manual AWS Console Walkthrough

### 1. Amazon RDS (PostgreSQL)
1. Open the **Amazon RDS Console** > **Databases** > **Create database**.
2. Engine: **PostgreSQL** (Version: 16.x).
3. Template: **Free Tier**.
4. DB instance identifier: `uptime-tracker-postgres-db`.
5. Master username: `postgresadmin`, Master password: `<Choose a password>`.
6. DB instance class: `db.t4g.micro` or `db.t3.micro`.
7. Storage: **gp3**, Allocated storage: **20 GiB**, Disable Autoscaling.
8. Connectivity: Public access: **Yes** (for viva testing), choose default VPC.
9. Initial database name: `uptime_db`.
10. Click **Create database**.

### 2. AWS IAM Roles
1. Open **IAM Console** > **Roles** > **Create role**.
2. Trusted entity: **AWS Service** > **Lambda**.
3. Attach policies:
   - `AWSLambdaBasicExecutionRole`
   - Create and attach custom policy from `aws/iam/lambda-checker-policy.json`.
4. Role name: `WebsiteUptimeTracker-LambdaExecutionRole`.

### 3. Amazon SNS Topic & Subscription
1. Open **Amazon SNS Console** > **Topics** > **Create topic**.
2. Type: **Standard**, Name: `WebsiteUptimeAlertsTopic`.
3. Create Subscription: Protocol: **Email**, Endpoint: `<Your Email>`.
4. Check your inbox and click **Confirm subscription**.

### 4. AWS Lambda Functions
1. Open **Lambda Console** > **Create function**.
2. Name: `WebsiteUptimeTracker-ApiLambda`, Runtime: **Node.js 20.x**.
3. Execution role: Use `WebsiteUptimeTracker-LambdaExecutionRole`.
4. Upload code from `lambda/` directory.
5. Set Environment Variables:
   - `DB_HOST`: `<RDS Endpoint>`
   - `DB_USER`: `postgresadmin`
   - `DB_PASSWORD`: `<Your Password>`
   - `DB_NAME`: `uptime_db`
   - `AWS_SNS_TOPIC_ARN`: `<SNS Topic ARN>`
6. Repeat for `WebsiteUptimeTracker-HealthChecker` (Timeout: 30s).

### 5. Amazon EventBridge Rule
1. Open **Amazon EventBridge Console** > **Rules** > **Create rule**.
2. Name: `WebsiteUptimeScheduledPing`.
3. Rule type: **Schedule** > Fixed rate of **1 minute**.
4. Target: **Lambda function** > `WebsiteUptimeTracker-HealthChecker`.

### 6. Amazon API Gateway
1. Open **API Gateway Console** > **Create API** > **HTTP API**.
2. Name: `WebsiteUptimeTracker-HttpApi`.
3. Configure Integration: **Lambda** > `WebsiteUptimeTracker-ApiLambda`.
4. Configure Routes: `$default` (Any).
5. Enable CORS: Allow Origins: `*`, Methods: `GET, POST, DELETE, OPTIONS`.

### 7. Amazon S3 & CloudFront
1. Open **S3 Console** > **Create bucket** > `website-uptime-frontend-<account-id>`.
2. Enable Static website hosting (Index: `index.html`, Error: `index.html`).
3. Open **CloudFront Console** > **Create distribution** > Origin: S3 bucket.
4. Origin access: **Origin Access Control (OAC)**.
5. Viewer protocol policy: **Redirect HTTP to HTTPS**.
6. Upload built React files (`dist/`) into the S3 bucket.

---

## Verification & Testing
1. Visit the CloudFront URL in your browser.
2. Verify that monitored sites load from Amazon RDS.
3. Click **Trigger Cloud Check** to initiate an on-demand check cycle.
4. Check your email for confirmation that Amazon SNS dispatches downtime alerts when a target URL fails.
5. Inspect the **Amazon CloudWatch Console** to see custom metrics under namespace `WebsiteUptimeTracker`.
