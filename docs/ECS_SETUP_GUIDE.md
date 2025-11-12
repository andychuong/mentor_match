# ECS Backend Setup Guide

This guide will help you automatically set up your backend in AWS ECS Fargate.

## 🚀 Quick Start

### Prerequisites

1. **AWS CLI installed and configured**
   ```bash
   aws --version
   aws configure  # If not already configured
   ```

2. **Docker image pushed to ECR**
   - If you haven't pushed your image yet, run:
   ```bash
   ./docs/DEPLOY_COMMANDS.sh
   ```

3. **Required information ready:**
   - Database URL (from RDS)
   - JWT secrets (generate with `openssl rand -hex 32`)
   - OpenAI API key
   - Frontend URL (your Amplify app URL)

### Run the Setup Script

```bash
./docs/setup-ecs-backend.sh
```

The script will:
1. ✅ Create security groups (ALB + Backend)
2. ✅ Create Application Load Balancer
3. ✅ Create target group
4. ✅ Create ECS cluster
5. ✅ Create task definition with your environment variables
6. ✅ Create ECS service
7. ✅ Configure everything to work together

**The script will prompt you for:**
- Database URL
- JWT secrets
- Frontend URL
- OpenAI API key
- Other optional environment variables

---

## 📋 What Gets Created

### AWS Resources

1. **Security Groups:**
   - `office-hours-alb-sg` - Allows HTTP (port 80) from internet
   - `office-hours-backend-sg` - Allows port 8000 from ALB

2. **Application Load Balancer:**
   - `office-hours-alb` - Internet-facing ALB
   - Listener on port 80 (HTTP)
   - Health checks on `/api/v1/health`

3. **Target Group:**
   - `office-hours-backend-tg` - Routes traffic to ECS tasks on port 8000

4. **ECS Cluster:**
   - `office-hours-cluster` - Fargate cluster

5. **Task Definition:**
   - `office-hours-backend` - Container configuration with environment variables

6. **ECS Service:**
   - `office-hours-backend-service` - Runs and maintains your backend tasks

7. **CloudWatch Log Group:**
   - `/ecs/office-hours-backend` - For application logs

---

## 🔧 Manual Setup (Alternative)

If you prefer to set up manually or the script doesn't work, follow these steps:

### Step 1: Create Security Groups

**ALB Security Group:**
```bash
aws ec2 create-security-group \
  --group-name office-hours-alb-sg \
  --description "Security group for Office Hours ALB" \
  --vpc-id <your-vpc-id>

# Allow HTTP from internet
aws ec2 authorize-security-group-ingress \
  --group-id <alb-sg-id> \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0
```

**Backend Security Group:**
```bash
aws ec2 create-security-group \
  --group-name office-hours-backend-sg \
  --description "Security group for Office Hours backend" \
  --vpc-id <your-vpc-id>

# Allow port 8000 from ALB
aws ec2 authorize-security-group-ingress \
  --group-id <backend-sg-id> \
  --protocol tcp \
  --port 8000 \
  --source-group <alb-sg-id>
```

### Step 2: Create Load Balancer

```bash
aws elbv2 create-load-balancer \
  --name office-hours-alb \
  --subnets <subnet-1> <subnet-2> \
  --security-groups <alb-sg-id> \
  --scheme internet-facing \
  --type application
```

### Step 3: Create Target Group

```bash
aws elbv2 create-target-group \
  --name office-hours-backend-tg \
  --protocol HTTP \
  --port 8000 \
  --vpc-id <your-vpc-id> \
  --target-type ip \
  --health-check-path /api/v1/health
```

### Step 4: Create Listener

```bash
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=<target-group-arn>
```

### Step 5: Create ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name office-hours-cluster \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1
```

### Step 6: Create Task Definition

Create a file `task-definition.json`:

```json
{
  "family": "office-hours-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::971422717446:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "971422717446.dkr.ecr.us-east-1.amazonaws.com/office-hours-backend:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "8000"},
        {"name": "DATABASE_URL", "value": "postgresql://..."},
        {"name": "JWT_SECRET", "value": "..."},
        {"name": "JWT_REFRESH_SECRET", "value": "..."},
        {"name": "FRONTEND_URL", "value": "https://..."},
        {"name": "OPENAI_API_KEY", "value": "sk-..."}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/office-hours-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

Register it:
```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

### Step 7: Create ECS Service

```bash
aws ecs create-service \
  --cluster office-hours-cluster \
  --service-name office-hours-backend-service \
  --task-definition office-hours-backend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<subnet-1>,<subnet-2>],securityGroups=[<backend-sg-id>],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=<target-group-arn>,containerName=backend,containerPort=8000"
```

---

## ✅ Verification

### Check Service Status

```bash
aws ecs describe-services \
  --cluster office-hours-cluster \
  --services office-hours-backend-service
```

### Get Backend URL

```bash
# Get ALB DNS name
aws elbv2 describe-load-balancers \
  --names office-hours-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text
```

### Test Backend

```bash
# Replace with your ALB DNS
curl http://office-hours-alb-xxxxx.us-east-1.elb.amazonaws.com/api/v1/health
```

### View Logs

```bash
# View recent logs
aws logs tail /ecs/office-hours-backend --follow
```

Or in AWS Console:
- CloudWatch → Log groups → `/ecs/office-hours-backend`

---

## 🔄 Updating the Backend

### Update Docker Image

1. Build and push new image:
   ```bash
   ./docs/DEPLOY_COMMANDS.sh
   ```

2. Force new deployment:
   ```bash
   aws ecs update-service \
     --cluster office-hours-cluster \
     --service office-hours-backend-service \
     --force-new-deployment
   ```

### Update Environment Variables

1. Update task definition:
   ```bash
   # Edit task-definition.json with new env vars
   aws ecs register-task-definition --cli-input-json file://task-definition.json
   ```

2. Update service:
   ```bash
   aws ecs update-service \
     --cluster office-hours-cluster \
     --service office-hours-backend-service \
     --task-definition office-hours-backend:NEW_REVISION
   ```

---

## 🐛 Troubleshooting

### Service Won't Start

1. **Check task status:**
   ```bash
   aws ecs list-tasks --cluster office-hours-cluster --service-name office-hours-backend-service
   aws ecs describe-tasks --cluster office-hours-cluster --tasks <task-id>
   ```

2. **Check logs:**
   - CloudWatch Logs → `/ecs/office-hours-backend`

3. **Common issues:**
   - Missing environment variables
   - Database connection issues
   - Invalid image URI
   - Security group misconfiguration

### Health Checks Failing

1. **Check health check endpoint:**
   ```bash
   curl http://<alb-dns>/api/v1/health
   ```

2. **Verify health check path in target group:**
   - Should be `/api/v1/health`

3. **Check task logs for errors**

### Can't Connect to Backend

1. **Verify security groups:**
   - ALB SG allows port 80 from internet
   - Backend SG allows port 8000 from ALB SG

2. **Check target group health:**
   ```bash
   aws elbv2 describe-target-health --target-group-arn <target-group-arn>
   ```

3. **Verify tasks are running:**
   ```bash
   aws ecs describe-services --cluster office-hours-cluster --services office-hours-backend-service
   ```

---

## 💰 Cost Estimate

- **ECS Fargate:** ~$15-20/month (0.5 vCPU, 1GB RAM, 24/7)
- **Application Load Balancer:** ~$16/month
- **CloudWatch Logs:** ~$0.50/GB ingested
- **Data Transfer:** ~$0.09/GB out

**Total:** ~$30-40/month for backend infrastructure

---

## 📝 Next Steps

After setup is complete:

1. ✅ **Get backend URL** from ALB DNS name
2. ✅ **Set in Amplify:** `VITE_API_URL=http://<alb-dns>/api/v1`
3. ✅ **Update backend CORS** to allow Amplify domain
4. ✅ **Test the connection** from frontend
5. ✅ **Run database migrations** if needed

---

## 🔗 Related Documentation

- [Environment Variables Guide](./ENVIRONMENT_VARIABLES.md)
- [Database Setup Guide](./DATABASE_SETUP.md)
- [AWS Amplify Deployment Guide](./AWS_AMPLIFY_DEPLOYMENT_GUIDE.md)
- [Getting Backend URL from ECS v2](./ECS_V2_BACKEND_URL.md)



