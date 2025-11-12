# AWS Amplify Deployment Guide

## ⚠️ Deployment Complexity Assessment

**Short Answer:** Not super quick, but doable with some modifications.

### Current Architecture Challenges

1. **Backend (Express.js)**: Amplify Hosting doesn't directly support Express.js backends
2. **Database**: Need separate RDS PostgreSQL instance
3. **Cron Jobs**: Scheduler service needs to be converted to AWS EventBridge/Lambda
4. **Redis**: Optional, but would need ElastiCache if used
5. **Environment Variables**: Multiple services need configuration

---

## 🎯 Deployment Options

### Option 1: Amplify Frontend + Separate Backend (Recommended)

**Frontend → AWS Amplify Hosting**  
**Backend → AWS ECS/Fargate or EC2**

**Pros:**
- ✅ Frontend deploys quickly to Amplify
- ✅ Backend stays as-is (minimal changes)
- ✅ Full control over backend infrastructure
- ✅ Easy to scale independently

**Cons:**
- ⚠️ Need to manage two separate deployments
- ⚠️ Backend requires containerization (Docker)

**Time Estimate:** 2-4 hours for initial setup

---

### Option 2: Full Amplify Stack (More Complex)

**Frontend → Amplify Hosting**  
**Backend → Lambda Functions (Serverless)**

**Pros:**
- ✅ Fully serverless
- ✅ Pay-per-use pricing
- ✅ Auto-scaling

**Cons:**
- ❌ Significant refactoring required (Express → Lambda functions)
- ❌ Cold start latency
- ❌ More complex for cron jobs and long-running processes
- ❌ Prisma with Lambda can be tricky

**Time Estimate:** 1-2 days of refactoring

---

### Option 3: Amplify Frontend + Elastic Beanstalk Backend

**Frontend → Amplify Hosting**  
**Backend → AWS Elastic Beanstalk**

**Pros:**
- ✅ Easy backend deployment
- ✅ Auto-scaling and load balancing
- ✅ Minimal code changes

**Cons:**
- ⚠️ Still need to manage database separately
- ⚠️ Slightly more expensive than Fargate

**Time Estimate:** 3-5 hours for initial setup

---

## 🚀 Recommended Approach: Option 1

### Step-by-Step Deployment Plan

#### Phase 1: Frontend to Amplify (30-60 minutes)

1. **Prepare Frontend Build**
   ```bash
   cd frontend
   npm run build
   ```

2. **Create Amplify App**
   - Go to AWS Amplify Console
   - Connect repository (GitHub/GitLab/Bitbucket)
   - Select frontend directory
   - Configure build settings

3. **Build Settings** (`amplify.yml` in frontend root):
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
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

4. **Environment Variables** (in Amplify Console):
   ```
   VITE_API_URL=https://your-backend-api.com/api/v1
   ```

#### Phase 2: Backend to ECS/Fargate (2-3 hours)

1. **Create Dockerfile** (already exists in backend/)
2. **Create ECR Repository**
3. **Build and Push Docker Image**
4. **Create ECS Task Definition**
5. **Create ECS Service**
6. **Set up Application Load Balancer**
7. **Configure Environment Variables**

#### Phase 3: Database Setup (1 hour)

1. **Create RDS PostgreSQL Instance**
2. **Run Migrations**
3. **Update DATABASE_URL in backend**

#### Phase 4: Additional Services (1-2 hours)

1. **EventBridge for Cron Jobs** (replace scheduler service)
2. **ElastiCache for Redis** (optional)
3. **Secrets Manager** for sensitive env vars
4. **Route 53** for custom domain (optional)

---

## 📋 Quick Start: Frontend Only (Fastest Option)

If you just want to deploy the frontend quickly:

### 1. Build Frontend
```bash
cd frontend
npm run build
```

### 2. Deploy to Amplify
- Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
- Click "New app" → "Host web app"
- Connect your Git repository
- Select branch and configure:
  - **App root:** `frontend`
  - **Build settings:** Auto-detect or use custom `amplify.yml`
  - **Environment variables:**
    ```
    VITE_API_URL=http://localhost:8000/api/v1  # Update to your backend URL
    ```

### 3. Update Backend CORS
Update `backend/src/index.ts` to allow Amplify domain:
```typescript
cors({
  origin: [
    config.frontendUrl,
    'https://your-amplify-app.amplifyapp.com', // Add Amplify URL
  ],
  credentials: true,
})
```

---

## 🐳 Docker Configuration (For Backend)

The backend already has a Dockerfile. To deploy:

### 1. Build Docker Image
```bash
cd backend
docker build -t office-hours-backend .
```

### 2. Test Locally
```bash
docker run -p 8000:8000 \
  -e DATABASE_URL=your_db_url \
  -e JWT_SECRET=your_secret \
  office-hours-backend
```

### 3. Push to ECR
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag office-hours-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/office-hours-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/office-hours-backend:latest
```

---

## ⚙️ Environment Variables Needed

### Frontend (Amplify)
```
VITE_API_URL=https://api.yourdomain.com/api/v1
```

### Backend (ECS/EC2/EB)
```
# Server
NODE_ENV=production
PORT=8000
FRONTEND_URL=https://your-amplify-app.amplifyapp.com

# Database
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/dbname

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Redis (optional)
REDIS_URL=redis://elasticache-endpoint:6379

# Airtable (optional)
AIRTABLE_API_KEY=your-key
AIRTABLE_BASE_ID=your-base-id

# Email (optional)
EMAIL_SERVICE_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@yourdomain.com

# SMS (optional)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=your-number

# Google Calendar (optional)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret
GOOGLE_REDIRECT_URI=https://your-amplify-app.amplifyapp.com/auth/google/callback

# Microsoft Outlook (optional)
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-secret
MICROSOFT_TENANT_ID=common

# AI (optional)
OPENAI_API_KEY=your-key

# Encryption (optional)
ENCRYPTION_KEY=your-32-byte-hex-key
```

---

## 🔄 Converting Cron Jobs to EventBridge

The current `scheduler.service.ts` uses `node-cron`. For AWS, convert to EventBridge:

### Current (node-cron)
```typescript
// Runs every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  // Send reminders
});
```

### AWS EventBridge Alternative
1. Create Lambda function for reminder logic
2. Create EventBridge rule: `rate(5 minutes)`
3. Connect rule to Lambda function
4. Lambda calls your backend API or directly accesses database

---

## 📊 Cost Estimate (Monthly)

### Option 1: Amplify + ECS Fargate
- **Amplify Hosting:** ~$0.15/GB served (first 15GB free)
- **ECS Fargate:** ~$30-50/month (1 task, 0.5 vCPU, 1GB RAM)
- **RDS PostgreSQL:** ~$15-30/month (db.t3.micro)
- **Application Load Balancer:** ~$16/month
- **Data Transfer:** ~$0.09/GB
- **Total:** ~$60-100/month (low traffic)

### Option 2: Amplify + Lambda
- **Amplify Hosting:** ~$0.15/GB served
- **Lambda:** ~$0.20 per 1M requests
- **API Gateway:** ~$3.50 per 1M requests
- **RDS PostgreSQL:** ~$15-30/month
- **Total:** ~$20-50/month (low traffic, pay-per-use)

---

## ✅ Pre-Deployment Checklist

- [ ] Backend Dockerfile tested locally
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] CORS configured for Amplify domain
- [ ] OAuth redirect URIs updated
- [ ] SSL certificates configured (if custom domain)
- [ ] Monitoring/logging set up (CloudWatch)
- [ ] Backup strategy for database
- [ ] Secrets stored in AWS Secrets Manager

---

## 🚨 Common Issues & Solutions

### Issue: CORS Errors
**Solution:** Update backend CORS to include Amplify domain

### Issue: Prisma Client Not Found in Lambda
**Solution:** Use Prisma's Lambda layer or bundle client in deployment

### Issue: Cold Starts in Lambda
**Solution:** Use provisioned concurrency or keep functions warm

### Issue: Database Connection Limits
**Solution:** Use connection pooling (Prisma already does this)

### Issue: Environment Variables Not Loading
**Solution:** Use AWS Systems Manager Parameter Store or Secrets Manager

---

## 🎯 Recommendation

**For Quick Demo/Testing:**
- Deploy frontend to Amplify (30-60 min)
- Keep backend running locally or on a small EC2 instance
- Use a free-tier RDS instance

**For Production:**
- Frontend: Amplify Hosting
- Backend: ECS Fargate (containerized)
- Database: RDS PostgreSQL
- Cron Jobs: EventBridge + Lambda
- Monitoring: CloudWatch

**Total Setup Time:** 4-6 hours for full production deployment

---

## 📚 Additional Resources

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [ECS Fargate Getting Started](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/getting-started-fargate.html)
- [RDS PostgreSQL Setup](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_GettingStarted.CreatingConnecting.PostgreSQL.html)
- [EventBridge Scheduled Rules](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-create-rule-schedule.html)

---

**Need help?** I can create the deployment configuration files (Dockerfile, amplify.yml, ECS task definitions, etc.) if you'd like!

