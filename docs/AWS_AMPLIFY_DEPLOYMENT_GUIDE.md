# AWS Amplify Deployment Guide

Complete step-by-step guide to deploy the Capital Factory Office Hours Matching Tool to AWS Amplify.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Frontend Deployment (AWS Amplify)](#frontend-deployment-aws-amplify)
4. [Backend Deployment Options](#backend-deployment-options)
5. [Database Setup (RDS PostgreSQL)](#database-setup-rds-postgresql)
6. [Environment Variables](#environment-variables)
7. [Post-Deployment Configuration](#post-deployment-configuration)
8. [Testing the Deployment](#testing-the-deployment)
9. [Troubleshooting](#troubleshooting)
10. [Cost Estimates](#cost-estimates)

---

## Prerequisites

### Required Accounts & Tools

- ✅ AWS Account (with appropriate permissions)
- ✅ GitHub/GitLab/Bitbucket account (for repository connection)
- ✅ AWS CLI installed and configured
- ✅ Docker installed (for backend deployment)
- ✅ Node.js and npm installed locally

### AWS Services You'll Use

- **AWS Amplify** - Frontend hosting
- **AWS ECS Fargate** (or EC2/Elastic Beanstalk) - Backend hosting
- **Amazon RDS** - PostgreSQL database
- **AWS Secrets Manager** (optional) - Secure environment variables
- **Amazon CloudWatch** - Logging and monitoring
- **AWS EventBridge** (optional) - Scheduled tasks (replaces cron jobs)

---

## Architecture Overview

### Recommended Architecture

```
┌─────────────────┐
│   AWS Amplify   │  ← Frontend (React/Vite)
│   (Frontend)    │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│  Application    │  ← Load Balancer
│  Load Balancer  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ECS Fargate    │  ← Backend (Express.js)
│   (Backend)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  RDS PostgreSQL │  ← Database
│   (Database)    │
└─────────────────┘
```

### Alternative: Simple Setup (For Testing/Demo)

```
Frontend → AWS Amplify
Backend  → EC2 Instance (t2.micro free tier)
Database → RDS PostgreSQL (db.t3.micro)
```

---

## Frontend Deployment (AWS Amplify)

### Step 1: Prepare Your Repository

Ensure your code is pushed to GitHub/GitLab/Bitbucket:

```bash
git add .
git commit -m "Prepare for Amplify deployment"
git push origin main
```

### Step 2: Create Amplify App

1. **Go to AWS Amplify Console**
   - Navigate to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
   - Click **"New app"** → **"Host web app"**

2. **Connect Repository**
   - Select your Git provider (GitHub, GitLab, or Bitbucket)
   - Authorize AWS Amplify to access your repository
   - Select your repository: `capital_factory_mentory_match`
   - Select branch: `main` (or your deployment branch)

3. **Configure Build Settings**
   - **Option A (Recommended):** Set **App root** to `/` (root directory)
     - **Build settings:** Use the existing `amplify.yml` file in repository root
     - The build configuration is already set up in `amplify.yml` at the root
   - **Option B:** Set **App root** to `frontend`
     - **Build settings:** Use the existing `amplify.yml` file in `frontend/` directory
     - The build configuration is already set up in `frontend/amplify.yml`

### Step 3: Configure Environment Variables

In the Amplify Console, go to **App settings** → **Environment variables** and add:

```bash
# API Configuration
VITE_API_URL=https://your-backend-api.com/api/v1

# Optional: Enable mock mode for demos
VITE_MOCK_MODE=false
```

**Note:** Update `VITE_API_URL` after deploying your backend (see Backend Deployment section).

### Step 4: Review Build Settings

**If App root is set to `/` (root directory):**
The `amplify.yml` file in the repository root is configured:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend && npm ci --legacy-peer-deps
    build:
      commands:
        - cd frontend && npm run build
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

**If App root is set to `frontend`:**
The `frontend/amplify.yml` file is configured:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci --legacy-peer-deps
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### Step 5: Deploy

1. Click **"Save and deploy"**
2. Amplify will:
   - Clone your repository
   - Install dependencies (`npm ci`)
   - Build the frontend (`npm run build`)
   - Deploy to a CDN
3. Wait for deployment to complete (5-10 minutes)
4. You'll get a URL like: `https://main.xxxxx.amplifyapp.com`

### Step 6: Custom Domain (Optional)

1. Go to **App settings** → **Domain management**
2. Click **"Add domain"**
3. Enter your domain name
4. Follow the DNS configuration instructions
5. SSL certificate is automatically provisioned

---

## Backend Deployment Options

You have three main options for deploying the backend:

### Option A: ECS Fargate (Recommended for Production)

**Pros:** Scalable, managed, no server management  
**Cons:** Requires Docker knowledge, slightly more complex setup

#### Step 1: Create Dockerfile (Already Exists)

The backend already has a `Dockerfile`. Verify it exists in `backend/Dockerfile`.

#### Step 2: Create ECR Repository

```bash
# Create ECR repository
aws ecr create-repository \
  --repository-name office-hours-backend \
  --region us-east-1

# Get login token
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

#### Step 3: Build and Push Docker Image

```bash
cd backend

# Build image
docker build -t office-hours-backend .

# Tag image
docker tag office-hours-backend:latest \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/office-hours-backend:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/office-hours-backend:latest
```

#### Step 4: Create ECS Cluster

1. Go to **ECS Console** → **Clusters** → **Create Cluster**
2. Select **"Fargate"** (serverless)
3. Name: `office-hours-cluster`
4. Click **"Create"**

#### Step 5: Create Task Definition

1. Go to **Task Definitions** → **Create new Task Definition**
2. **Launch type:** Fargate
3. **Task definition name:** `office-hours-backend`
4. **Task size:**
   - CPU: 0.5 vCPU
   - Memory: 1 GB
5. **Container definition:**
   - **Name:** `backend`
   - **Image URI:** `<account-id>.dkr.ecr.us-east-1.amazonaws.com/office-hours-backend:latest`
   - **Port mappings:** `8000:8000`
   - **Environment variables:** (Add all from [Environment Variables](#environment-variables) section)
6. Click **"Create"**

#### Step 6: Create ECS Service

1. Go to your cluster → **Services** → **Create**
2. **Launch type:** Fargate
3. **Task definition:** `office-hours-backend`
4. **Service name:** `office-hours-backend-service`
5. **Number of tasks:** 1
6. **VPC:** Select default or create new
7. **Subnets:** Select at least 2 subnets
8. **Security group:** Create new or use existing
   - Allow inbound: Port 8000 from Load Balancer
9. **Load balancer:** Create new Application Load Balancer
   - **Name:** `office-hours-alb`
   - **Listener:** HTTP:80 → Target Group
10. Click **"Create"**

#### Step 7: Get Backend URL

After the service is running:
1. Go to **Load Balancer** → Select your ALB
2. Copy the **DNS name** (e.g., `office-hours-alb-xxxxx.us-east-1.elb.amazonaws.com`)
3. Update Amplify environment variable: `VITE_API_URL=http://<alb-dns-name>/api/v1`

---

### Option B: EC2 Instance (Simpler, Good for Testing)

**Pros:** Simple, familiar, good for testing  
**Cons:** You manage the server, less scalable

#### Step 1: Launch EC2 Instance

1. Go to **EC2 Console** → **Launch Instance**
2. **Name:** `office-hours-backend`
3. **AMI:** Amazon Linux 2023 or Ubuntu 22.04
4. **Instance type:** t2.micro (free tier eligible) or t3.small
5. **Key pair:** Create or select existing
6. **Security group:** Create new
   - Allow SSH (port 22) from your IP
   - Allow HTTP (port 8000) from anywhere (or just Amplify domain)
7. **Launch instance**

#### Step 2: Connect to EC2 Instance

```bash
# SSH into instance
ssh -i your-key.pem ec2-user@<ec2-public-ip>

# Update system
sudo yum update -y  # Amazon Linux
# OR
sudo apt update && sudo apt upgrade -y  # Ubuntu
```

#### Step 3: Install Dependencies

```bash
# Install Node.js 18+
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install PostgreSQL client (for migrations)
sudo yum install -y postgresql15
```

#### Step 4: Clone and Setup Backend

```bash
# Clone repository
git clone https://github.com/your-username/capital_factory_mentory_match.git
cd capital_factory_mentory_match/backend

# Install dependencies
npm install

# Build TypeScript
npm run build
```

#### Step 5: Configure Environment Variables

```bash
# Create .env file
nano .env
```

Add all environment variables (see [Environment Variables](#environment-variables) section).

#### Step 6: Run Database Migrations

```bash
# Run Prisma migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

#### Step 7: Start Backend with PM2

```bash
# Start with PM2
pm2 start dist/index.js --name office-hours-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### Step 8: Configure Nginx (Optional but Recommended)

```bash
# Install Nginx
sudo yum install -y nginx

# Configure Nginx
sudo nano /etc/nginx/conf.d/office-hours.conf
```

Add configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### Step 9: Get Backend URL

- **With Nginx:** `http://<ec2-public-ip>`
- **Without Nginx:** `http://<ec2-public-ip>:8000`
- Update Amplify: `VITE_API_URL=http://<ec2-public-ip>/api/v1`

---

### Option C: Elastic Beanstalk (Easiest Backend Deployment)

**Pros:** Very easy, auto-scaling, managed  
**Cons:** Slightly more expensive than Fargate

#### Step 1: Install EB CLI

```bash
pip install awsebcli --upgrade --user
```

#### Step 2: Initialize Elastic Beanstalk

```bash
cd backend
eb init

# Select:
# - Region: us-east-1
# - Application name: office-hours-backend
# - Platform: Node.js
# - Platform version: Node.js 18
# - Setup SSH: Yes
```

#### Step 3: Create Environment

```bash
eb create office-hours-backend-env

# This will:
# - Create EC2 instance
# - Setup load balancer
# - Deploy your code
```

#### Step 4: Configure Environment Variables

```bash
eb setenv \
  DATABASE_URL=postgresql://... \
  JWT_SECRET=... \
  FRONTEND_URL=https://your-amplify-app.amplifyapp.com \
  # ... add all other variables
```

#### Step 5: Deploy Updates

```bash
eb deploy
```

#### Step 6: Get Backend URL

```bash
eb status
# Copy the CNAME URL
# Update Amplify: VITE_API_URL=http://<cname>/api/v1
```

---

## Database Setup (RDS PostgreSQL)

### Step 1: Create RDS Instance

1. Go to **RDS Console** → **Databases** → **Create database**
2. **Engine:** PostgreSQL
3. **Version:** 15.x or 16.x
4. **Template:** Free tier (for testing) or Production
5. **DB instance identifier:** `office-hours-db`
6. **Master username:** `postgres` (or your choice)
7. **Master password:** Create strong password (save it!)
8. **DB instance class:** `db.t3.micro` (free tier) or `db.t3.small`
9. **Storage:** 20 GB (free tier) or as needed
10. **VPC:** Same VPC as your backend (for ECS) or default
11. **Public access:** 
    - **Yes** if using EC2 (easier)
    - **No** if using ECS (more secure, requires VPC setup)
12. **Security group:** Create new
    - Allow PostgreSQL (port 5432) from your backend security group
13. Click **"Create database"**

### Step 2: Get Database Endpoint

1. Wait for database to be available (5-10 minutes)
2. Go to your database → **Connectivity & security**
3. Copy the **Endpoint** (e.g., `office-hours-db.xxxxx.us-east-1.rds.amazonaws.com`)
4. Update your backend `DATABASE_URL`:
   ```
   DATABASE_URL=postgresql://postgres:password@office-hours-db.xxxxx.us-east-1.rds.amazonaws.com:5432/postgres
   ```

### Step 3: Run Migrations

**From your local machine or EC2 instance:**

```bash
cd backend

# Update .env with RDS endpoint
DATABASE_URL=postgresql://postgres:password@office-hours-db.xxxxx.us-east-1.rds.amazonaws.com:5432/postgres

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# (Optional) Seed database
npm run db:seed
```

### Step 4: Verify Connection

```bash
# Test connection
npx prisma db pull
```

---

## Environment Variables

### Frontend (AWS Amplify)

Set these in **Amplify Console** → **App settings** → **Environment variables**:

```bash
# Required
VITE_API_URL=https://your-backend-url.com/api/v1

# Optional
VITE_MOCK_MODE=false
```

### Backend (ECS/EC2/EB)

Set these in your deployment platform:

#### Required Variables

```bash
# Server Configuration
NODE_ENV=production
PORT=8000
FRONTEND_URL=https://your-amplify-app.amplifyapp.com

# Database
DATABASE_URL=postgresql://user:password@rds-endpoint:5432/dbname

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

#### Optional Variables

```bash
# Redis (if using)
REDIS_URL=redis://elasticache-endpoint:6379

# Airtable Integration
AIRTABLE_API_KEY=your-airtable-api-key
AIRTABLE_BASE_ID=your-base-id
AIRTABLE_TABLE_USERS=Users
AIRTABLE_TABLE_MENTORS=Mentors

# Email (SendGrid)
EMAIL_SERVICE_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Capital Factory Office Hours
EMAIL_MOCK_MODE=false  # Set to true for demos

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
SMS_MOCK_MODE=false  # Set to true for demos

# Google Calendar OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-amplify-app.amplifyapp.com/auth/google/callback

# Microsoft Outlook OAuth
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=https://your-amplify-app.amplifyapp.com/auth/microsoft/callback

# AI/OpenAI (for matching)
OPENAI_API_KEY=your-openai-api-key

# Encryption (for OAuth tokens)
ENCRYPTION_KEY=your-32-byte-hex-encryption-key
```

### Using AWS Secrets Manager (Recommended for Production)

Instead of storing secrets in environment variables, use AWS Secrets Manager:

```bash
# Create secret
aws secrets-manager create-secret \
  --name office-hours-backend-secrets \
  --secret-string file://secrets.json

# secrets.json format:
{
  "DATABASE_URL": "postgresql://...",
  "JWT_SECRET": "...",
  "JWT_REFRESH_SECRET": "..."
}
```

Then in your ECS task definition or EC2 instance, reference the secret.

---

## Post-Deployment Configuration

### 1. Update CORS in Backend

Ensure your backend allows requests from Amplify domain. Update `backend/src/config/env.ts`:

```typescript
// Add Amplify URL to FRONTEND_URL or update CORS
frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
```

Or update `backend/src/index.ts` to allow multiple origins:

```typescript
// backend/src/index.ts
const allowedOrigins = [
  config.frontendUrl,
  process.env.AMPLIFY_URL, // Add this env var
  'https://main.xxxxx.amplifyapp.com',  // Your Amplify URL
  'https://yourdomain.com',  // Custom domain if used
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
```

**Environment Variable to Add:**
```bash
FRONTEND_URL=https://main.xxxxx.amplifyapp.com
# OR
AMPLIFY_URL=https://main.xxxxx.amplifyapp.com
```

### 2. Update OAuth Redirect URIs

If using Google/Microsoft OAuth:

1. **Google Cloud Console:**
   - Go to **APIs & Services** → **Credentials**
   - Update **Authorized redirect URIs:**
     - `https://your-amplify-app.amplifyapp.com/auth/google/callback`

2. **Microsoft Azure Portal:**
   - Go to **App registrations** → Your app → **Authentication**
   - Update **Redirect URIs:**
     - `https://your-amplify-app.amplifyapp.com/auth/microsoft/callback`

### 3. Configure Scheduled Tasks (EventBridge)

Replace the cron job scheduler with AWS EventBridge:

1. **Create Lambda Function** for reminder logic
2. **Create EventBridge Rule:**
   - **Schedule:** `rate(5 minutes)`
   - **Target:** Your Lambda function
3. Lambda calls your backend API or directly accesses database

---

## Testing the Deployment

### 1. Test Frontend

1. Visit your Amplify URL: `https://main.xxxxx.amplifyapp.com`
2. Verify the page loads
3. Check browser console for errors
4. Test login functionality

### 2. Test Backend API

```bash
# Test health endpoint
curl https://your-backend-url.com/api/v1/health

# Test login
curl -X POST https://your-backend-url.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mentee1@test.com","password":"mentee123"}'
```

### 3. Test Database Connection

```bash
# From backend server or locally
cd backend
npx prisma db pull
```

### 4. End-to-End Test

1. Login through frontend
2. Browse mentors
3. Book a session
4. View sessions
5. Check notifications

---

## Troubleshooting

### Frontend Issues

#### Issue: Blank Page or Build Errors

**Solution:**
1. Check Amplify build logs for specific error messages
2. Verify `VITE_API_URL` is set correctly in Amplify Console → Environment variables
3. Check browser console for errors
4. **Important:** Ensure `amplify.yml` is in the correct location:
   - If **App root** is set to `/` (root): `amplify.yml` must be in repository root
   - If **App root** is set to `frontend`: `amplify.yml` must be in `frontend/` directory
5. Verify build commands are correct for your App root setting
6. Check that `package-lock.json` exists in `frontend/` directory (required for `npm ci`)

#### Issue: Build Fails with "amplify.yml not found" or Commands Fail

**Solution:**
1. Verify the **App root** setting in Amplify Console → App settings → Build settings
2. If App root is `/`, ensure `amplify.yml` exists in repository root (not in `frontend/`)
3. If App root is `frontend`, ensure `amplify.yml` exists in `frontend/` directory
4. Check build logs to see which directory Amplify is running commands from
5. Ensure paths in `amplify.yml` match your App root setting:
   - App root `/`: Use `cd frontend && npm ci` and `baseDirectory: frontend/dist`
   - App root `frontend`: Use `npm ci` and `baseDirectory: dist`

#### Issue: CORS Errors

**Solution:**
1. Update backend CORS to include Amplify domain
2. Verify `FRONTEND_URL` environment variable in backend
3. Check backend logs for CORS errors

#### Issue: API Calls Failing

**Solution:**
1. Verify `VITE_API_URL` points to correct backend URL
2. Check backend is running and accessible
3. Verify security groups allow traffic
4. Check backend logs

### Backend Issues

#### Issue: Cannot Connect to Database

**Solution:**
1. Verify `DATABASE_URL` is correct
2. Check RDS security group allows connections from backend
3. Verify database is in "available" state
4. Test connection: `npx prisma db pull`

#### Issue: Prisma Client Not Found

**Solution:**
```bash
cd backend
npx prisma generate
npm run build
```

#### Issue: Environment Variables Not Loading

**Solution:**
1. Verify variables are set in deployment platform
2. For ECS: Check task definition environment variables
3. For EC2: Check `.env` file or system environment
4. Restart service after adding variables

#### Issue: Port Already in Use

**Solution:**
1. Check what's using port 8000: `lsof -i :8000`
2. Kill process or change PORT in environment variables
3. For ECS: Verify port mapping in task definition

### Database Issues

#### Issue: Migration Fails

**Solution:**
1. Verify database connection string
2. Check database user has proper permissions
3. Run migrations manually: `npx prisma migrate deploy`
4. Check Prisma migration logs

#### Issue: Connection Timeout

**Solution:**
1. Verify RDS security group allows connections
2. Check if database is in same VPC (for ECS)
3. For EC2: Ensure public access is enabled or use VPN
4. Test connection: `psql -h <rds-endpoint> -U postgres`

---

## Cost Estimates

### Monthly Costs (Low Traffic)

#### Option 1: Amplify + ECS Fargate + RDS

- **AWS Amplify Hosting:** $0 (first 15GB free, then $0.15/GB)
- **ECS Fargate:** ~$30-50/month
  - 0.5 vCPU, 1GB RAM, 1 task
- **RDS PostgreSQL (db.t3.micro):** ~$15-20/month
- **Application Load Balancer:** ~$16/month
- **Data Transfer:** ~$5-10/month
- **Total:** ~$66-96/month

#### Option 2: Amplify + EC2 + RDS

- **AWS Amplify Hosting:** $0 (free tier)
- **EC2 (t2.micro):** $0 (free tier) or ~$8/month (t3.small)
- **RDS PostgreSQL (db.t3.micro):** ~$15-20/month
- **Data Transfer:** ~$5-10/month
- **Total:** ~$20-38/month (with free tier) or ~$28-38/month

#### Option 3: Amplify + Elastic Beanstalk + RDS

- **AWS Amplify Hosting:** $0
- **Elastic Beanstalk:** ~$30-50/month (includes EC2 + ALB)
- **RDS PostgreSQL:** ~$15-20/month
- **Data Transfer:** ~$5-10/month
- **Total:** ~$50-80/month

### Free Tier Eligibility

- **AWS Amplify:** 15 GB storage, 5 GB served per month (12 months)
- **EC2:** 750 hours/month of t2.micro (12 months)
- **RDS:** 750 hours/month of db.t2.micro (12 months)
- **Data Transfer:** 15 GB out per month (12 months)

**First Year Cost:** ~$0-20/month (using free tier)

---

## Quick Start Checklist

### Pre-Deployment
- [ ] Code pushed to Git repository
- [ ] AWS account created and configured
- [ ] AWS CLI installed and configured
- [ ] Docker installed (for ECS option)

### Frontend Deployment
- [ ] Amplify app created
- [ ] Repository connected
- [ ] Build settings configured
- [ ] Environment variables set
- [ ] Deployment successful
- [ ] Frontend URL working

### Backend Deployment
- [ ] Backend deployment method chosen (ECS/EC2/EB)
- [ ] Backend deployed and running
- [ ] Backend URL accessible
- [ ] Health endpoint responding

### Database Setup
- [ ] RDS instance created
- [ ] Database endpoint obtained
- [ ] Migrations run successfully
- [ ] Database connection verified

### Configuration
- [ ] CORS updated in backend
- [ ] OAuth redirect URIs updated
- [ ] Environment variables configured
- [ ] Frontend API URL updated

### Testing
- [ ] Frontend loads correctly
- [ ] Backend API responds
- [ ] Database connection works
- [ ] Login functionality works
- [ ] End-to-end flow tested

---

## Additional Resources

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [ECS Fargate Getting Started](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/getting-started-fargate.html)
- [RDS PostgreSQL Setup](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_GettingStarted.CreatingConnecting.PostgreSQL.html)
- [Elastic Beanstalk Node.js Guide](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_nodejs.html)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)

---

## 🎯 Deployment Order Recommendation

For first-time deployment, follow this order:

1. **Database First** (RDS) - Takes longest to provision
2. **Backend Second** (ECS/EC2/EB) - Needs database connection
3. **Frontend Last** (Amplify) - Needs backend URL

This allows you to test each component as you deploy.

---

## 📞 Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review AWS CloudWatch logs
3. Check Amplify build logs
4. Verify all environment variables are set correctly
5. Ensure security groups allow necessary traffic
6. Test API endpoints with curl or Postman
7. Check browser console for frontend errors

---

## 🔄 Updating After Deployment

### Frontend Updates
```bash
git push origin main  # Auto-deploys via Amplify
```

### Backend Updates (ECS)
```bash
cd backend
docker build -t office-hours-backend .
docker tag office-hours-backend:latest <ecr-uri>:latest
docker push <ecr-uri>:latest
# In ECS Console: Update service → Force new deployment
```

### Backend Updates (EC2)
```bash
ssh into instance
cd capital_factory_mentory_match
git pull
cd backend
npm install
npm run build
pm2 restart office-hours-backend
```

---

**Last Updated:** November 12, 2025  
**Version:** 1.0

