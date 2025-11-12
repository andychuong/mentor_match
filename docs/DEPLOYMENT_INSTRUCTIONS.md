# 🚀 Complete Deployment Instructions for us-east-2

Follow these steps in order to deploy your backend to AWS ECS in `us-east-2`.

---

## ✅ Prerequisites

Before starting, make sure you have:

1. **AWS CLI installed and configured**
   ```bash
   aws --version
   aws configure  # If not already configured
   ```

2. **Docker installed and running**
   ```bash
   docker --version
   ```

3. **Your database information ready:**
   - Database endpoint: `mentor-match-db.c1uuigcm4bd1.us-east-2.rds.amazonaws.com`
   - Port: `5432`
   - Username: (your master username, likely `postgres`)
   - Password: (your master password)
   - Database name: (usually `postgres`)

4. **Other required values:**
   - JWT secrets (generate with `openssl rand -hex 32`)
   - OpenAI API key
   - Frontend URL (your Amplify app URL)

---

## 📋 Step-by-Step Instructions

### Step 1: Push Docker Image to ECR (us-east-2)

This creates the ECR repository and pushes your Docker image.

```bash
./docs/setup-ecr-us-east-2.sh
```

**What this does:**
- Creates ECR repository in `us-east-2`
- Builds your Docker image
- Pushes it to ECR

**Expected output:**
```
✅ Image pushed successfully!
ECR Image URI: 971422717446.dkr.ecr.us-east-2.amazonaws.com/office-hours-backend:latest
```

**⏱️ Time:** ~5-10 minutes

---

### Step 2: Create ECS Resources

This creates all AWS resources (load balancer, ECS cluster, service, etc.).

```bash
./docs/setup-ecs-backend.sh
```

**The script will prompt you for:**

1. **DATABASE_URL**
   ```
   postgresql://[username]:[password]@mentor-match-db.c1uuigcm4bd1.us-east-2.rds.amazonaws.com:5432/[database]
   ```
   - Replace `[username]` with your RDS master username
   - Replace `[password]` with your RDS master password
   - Replace `[database]` with your database name (usually `postgres`)

2. **JWT_SECRET** (64-char hex string)
   - Generate with: `openssl rand -hex 32`
   - Example: `77f145541d9b7d4528c0bb43e15ceecc4b659d8d0183c09fea551097daa98027`

3. **JWT_REFRESH_SECRET** (64-char hex string)
   - Generate with: `openssl rand -hex 32`
   - Example: `55acb26696ebb6b3855b646c9ca5798d743c1b869ad4f44134abb987c2b6c0e6`

4. **FRONTEND_URL**
   - Your Amplify app URL
   - Example: `https://main.d9615h0u1yd6d.amplifyapp.com`

5. **OPENAI_API_KEY**
   - Your OpenAI API key
   - Example: `sk-proj-...`

6. **Optional:**
   - `ENCRYPTION_KEY` (for calendar tokens) - Generate with `openssl rand -hex 32`
   - `EMAIL_MOCK_MODE` - Set to `true` for demos
   - `SMS_MOCK_MODE` - Set to `true` for demos

**What this creates:**
- Security groups (ALB + Backend)
- Application Load Balancer
- Target group
- ECS cluster
- Task definition
- ECS service
- CloudWatch log group

**⏱️ Time:** ~5-10 minutes

**Expected output at the end:**
```
✅ ECS Backend Setup Complete!

Backend URL: http://office-hours-alb-xxxxx.us-east-2.elb.amazonaws.com/api/v1
```

---

### Step 3: Wait for Service to Start

After the script completes, wait 2-3 minutes for the ECS service to start.

**Check service status:**
```bash
aws ecs describe-services \
  --cluster office-hours-cluster \
  --services office-hours-backend-service \
  --region us-east-2 \
  --query 'services[0].[status,runningCount,desiredCount]' \
  --output table
```

You should see:
- `status`: `ACTIVE`
- `runningCount`: `1` (or more)
- `desiredCount`: `1`

---

### Step 4: Test Backend Health

Once the service is running, test the health endpoint:

```bash
# Replace with your actual ALB DNS name from Step 2 output
curl http://office-hours-alb-xxxxx.us-east-2.elb.amazonaws.com/api/v1/health
```

**Expected response:**
```json
{"success":true,"data":{"status":"ok"}}
```

If you get a `503` error, wait a bit longer and check the service status again.

---

### Step 5: Update Amplify Environment Variables

1. Go to **AWS Amplify Console** → Your App → **App settings** → **Environment variables**

2. Add/Update:
   - **Key:** `VITE_API_URL`
   - **Value:** `http://office-hours-alb-xxxxx.us-east-2.elb.amazonaws.com/api/v1`
     (Use the ALB DNS name from Step 2 output)

3. **Save** and trigger a new deployment

---

### Step 6: Update Backend CORS (if needed)

Make sure your backend allows requests from your Amplify domain.

The `FRONTEND_URL` environment variable you set in Step 2 should handle this, but verify in your backend code that CORS is configured correctly.

---

## 🔍 Troubleshooting

### Issue: Service shows 0 running tasks

**Check task status:**
```bash
aws ecs list-tasks \
  --cluster office-hours-cluster \
  --service-name office-hours-backend-service \
  --region us-east-2
```

**Check stopped tasks for errors:**
```bash
TASK_ARN=$(aws ecs list-tasks --cluster office-hours-cluster --service-name office-hours-backend-service --desired-status STOPPED --region us-east-2 --query 'taskArns[0]' --output text)
aws ecs describe-tasks --cluster office-hours-cluster --tasks "$TASK_ARN" --region us-east-2 --query 'tasks[0].[stoppedReason,containers[0].reason]' --output table
```

**Common issues:**
- Database connection failed (check DATABASE_URL)
- Missing environment variables
- Image pull error (verify image exists in ECR)

### Issue: 503 Service Temporarily Unavailable

**Check target group health:**
```bash
TG_ARN=$(aws elbv2 describe-target-groups --names office-hours-backend-tg --region us-east-2 --query 'TargetGroups[0].TargetGroupArn' --output text)
aws elbv2 describe-target-health --target-group-arn $TG_ARN --region us-east-2
```

**Solutions:**
- Wait for tasks to become healthy (2-3 minutes)
- Check CloudWatch logs for application errors
- Verify health check path is `/api/v1/health`

### Issue: Database Connection Failed

**Verify:**
1. Database is in `us-east-2` (matches ECS region)
2. RDS security group allows connections from backend security group
3. DATABASE_URL is correct (username, password, endpoint, port, database name)

**Test database connection:**
```bash
# From your local machine (if database is publicly accessible)
psql -h mentor-match-db.c1uuigcm4bd1.us-east-2.rds.amazonaws.com \
     -U postgres \
     -d postgres \
     -p 5432
```

### Issue: View Logs

**View CloudWatch logs:**
```bash
aws logs tail /ecs/office-hours-backend --region us-east-2 --follow
```

**Or in AWS Console:**
- CloudWatch → Log groups → `/ecs/office-hours-backend`

---

## 📝 Quick Reference

### Important URLs

After deployment, you'll have:

- **Backend API:** `http://office-hours-alb-xxxxx.us-east-2.elb.amazonaws.com/api/v1`
- **Health Check:** `http://office-hours-alb-xxxxx.us-east-2.elb.amazonaws.com/api/v1/health`
- **ECS Console:** https://console.aws.amazon.com/ecs/v2/clusters/office-hours-cluster/services/office-hours-backend-service?region=us-east-2
- **CloudWatch Logs:** https://console.aws.amazon.com/cloudwatch/home?region=us-east-2#logsV2:log-groups/log-group/%2Fecs%2Foffice-hours-backend

### Useful Commands

**Check service status:**
```bash
aws ecs describe-services \
  --cluster office-hours-cluster \
  --services office-hours-backend-service \
  --region us-east-2
```

**Force new deployment (after updating image):**
```bash
aws ecs update-service \
  --cluster office-hours-cluster \
  --service office-hours-backend-service \
  --force-new-deployment \
  --region us-east-2
```

**Get ALB DNS name:**
```bash
aws elbv2 describe-load-balancers \
  --names office-hours-alb \
  --region us-east-2 \
  --query 'LoadBalancers[0].DNSName' \
  --output text
```

---

## ✅ Deployment Checklist

- [ ] Docker image pushed to ECR in `us-east-2`
- [ ] ECS resources created (cluster, service, ALB)
- [ ] Environment variables configured correctly
- [ ] Service is running (1+ tasks)
- [ ] Health check endpoint returns 200 OK
- [ ] `VITE_API_URL` set in Amplify
- [ ] Frontend can connect to backend
- [ ] Database connection working
- [ ] Test login/authentication

---

## 🎉 You're Done!

Once all steps are complete:
1. Your backend is running in `us-east-2`
2. Your database is in `us-east-2` (same region = fast connection)
3. Your frontend in Amplify can connect to the backend
4. Everything is working! 🚀

---

## 🔄 Updating the Backend

To update your backend after making code changes:

1. **Rebuild and push image:**
   ```bash
   ./docs/setup-ecr-us-east-2.sh
   ```

2. **Force new deployment:**
   ```bash
   aws ecs update-service \
     --cluster office-hours-cluster \
     --service office-hours-backend-service \
     --force-new-deployment \
     --region us-east-2
   ```

3. **Wait 2-3 minutes** for new tasks to start

4. **Test the health endpoint** to verify it's working

---

## 💰 Cost Estimate

- **ECS Fargate:** ~$15-20/month (0.5 vCPU, 1GB RAM, 24/7)
- **Application Load Balancer:** ~$16/month
- **CloudWatch Logs:** ~$0.50/GB ingested
- **Data Transfer:** ~$0.09/GB out

**Total:** ~$30-40/month for backend infrastructure

---

## 🆘 Need Help?

If you encounter issues:
1. Check CloudWatch logs for errors
2. Verify all environment variables are set correctly
3. Ensure database security group allows connections
4. Check that tasks are running (not stuck in PENDING)

For more details, see:
- [ECS Setup Guide](./ECS_SETUP_GUIDE.md)
- [Environment Variables Guide](./ENVIRONMENT_VARIABLES.md)
- [Database Setup Guide](./DATABASE_SETUP.md)


