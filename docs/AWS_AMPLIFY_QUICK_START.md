# AWS Amplify Quick Start Guide

Quick reference for deploying to AWS Amplify. For detailed instructions, see [AWS_AMPLIFY_DEPLOYMENT_GUIDE.md](./AWS_AMPLIFY_DEPLOYMENT_GUIDE.md).

---

## 🚀 5-Minute Frontend Deployment

### Step 1: Push Code to Git
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Create Amplify App
1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click **"New app"** → **"Host web app"**
3. Connect your Git repository
4. Select branch: `main`
5. **App root:** `frontend`
6. Click **"Save and deploy"**

### Step 3: Set Environment Variables
In Amplify Console → **App settings** → **Environment variables**:

```bash
VITE_API_URL=http://your-backend-url.com/api/v1
```

**Note:** Update this after deploying your backend!

### Step 4: Wait for Deployment
Deployment takes 5-10 minutes. You'll get a URL like:
`https://main.xxxxx.amplifyapp.com`

---

## 🐳 Backend Deployment (ECS Fargate - Quick)

### Prerequisites
```bash
# Install AWS CLI
aws --version

# Configure AWS credentials
aws configure
```

### Step 1: Create ECR Repository
```bash
aws ecr create-repository \
  --repository-name office-hours-backend \
  --region us-east-1
```

### Step 2: Build and Push Docker Image
```bash
cd backend

# Get ECR login
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag
docker build -t office-hours-backend .
docker tag office-hours-backend:latest \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/office-hours-backend:latest

# Push
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/office-hours-backend:latest
```

### Step 3: Create ECS Cluster & Service
Use AWS Console:
1. **ECS** → **Clusters** → **Create Cluster** (Fargate)
2. **Task Definitions** → **Create** (use ECR image)
3. **Services** → **Create** (from task definition)

### Step 4: Get Backend URL
From Load Balancer DNS name, update Amplify:
```
VITE_API_URL=http://<alb-dns-name>/api/v1
```

---

## 🗄️ Database Setup (RDS - Quick)

### Step 1: Create RDS Instance
1. **RDS Console** → **Create database**
2. **PostgreSQL** → **Free tier**
3. **Public access:** Yes (for testing)
4. **Security group:** Allow port 5432 from backend

### Step 2: Run Migrations
```bash
cd backend

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://postgres:password@<rds-endpoint>:5432/postgres

# Run migrations
npx prisma migrate deploy
npx prisma generate
```

---

## 📝 Required Environment Variables

### Frontend (Amplify)
```bash
VITE_API_URL=https://your-backend-url.com/api/v1
```

### Backend (ECS/EC2)
```bash
# Required
NODE_ENV=production
PORT=8000
FRONTEND_URL=https://your-amplify-app.amplifyapp.com
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/dbname
JWT_SECRET=your-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
```

See [full list](./AWS_AMPLIFY_DEPLOYMENT_GUIDE.md#environment-variables) for all variables.

---

## ✅ Post-Deployment Checklist

- [ ] Frontend deployed to Amplify
- [ ] Backend deployed and accessible
- [ ] Database created and migrations run
- [ ] `VITE_API_URL` updated in Amplify
- [ ] CORS configured in backend
- [ ] Test login functionality
- [ ] Test API endpoints

---

## 🔧 Common Commands

### Update Frontend
```bash
git push origin main  # Auto-deploys via Amplify
```

### Update Backend (ECS)
```bash
cd backend
docker build -t office-hours-backend .
docker tag office-hours-backend:latest <ecr-uri>:latest
docker push <ecr-uri>:latest
# Then update ECS service to use new image
```

### View Logs
- **Frontend:** Amplify Console → **Deployments** → **View logs**
- **Backend:** CloudWatch Logs or `pm2 logs` (if using EC2)

---

## 💰 Cost Estimate

**First Year (Free Tier):**
- Amplify: Free (15GB storage)
- EC2 (t2.micro): Free (750 hrs/month)
- RDS (db.t2.micro): Free (750 hrs/month)
- **Total: ~$0-20/month**

**After Free Tier:**
- **Option 1 (ECS):** ~$66-96/month
- **Option 2 (EC2):** ~$28-38/month

---

## 🆘 Quick Troubleshooting

**Frontend blank?**
- Check `VITE_API_URL` is set
- Check browser console for errors
- Verify backend is running

**CORS errors?**
- Update backend CORS to include Amplify domain
- Check `FRONTEND_URL` in backend env vars

**Database connection fails?**
- Verify `DATABASE_URL` is correct
- Check RDS security group allows connections
- Ensure database is "available"

---

For detailed instructions, see [AWS_AMPLIFY_DEPLOYMENT_GUIDE.md](./AWS_AMPLIFY_DEPLOYMENT_GUIDE.md).

