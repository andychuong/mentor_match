#!/bin/bash
# AWS ECS Backend Setup Script
# This script creates all necessary AWS resources for deploying the backend to ECS Fargate

set -e  # Exit on error

# Configuration
ACCOUNT_ID="971422717446"
REGION="us-east-2"
CLUSTER_NAME="office-hours-cluster"
SERVICE_NAME="office-hours-backend-service"
TASK_DEFINITION_NAME="office-hours-backend"
REPO_NAME="office-hours-backend"
IMAGE_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO_NAME}:latest"
ALB_NAME="office-hours-alb"
TARGET_GROUP_NAME="office-hours-backend-tg"
SECURITY_GROUP_NAME="office-hours-backend-sg"
ALB_SECURITY_GROUP_NAME="office-hours-alb-sg"

echo "🚀 Starting ECS Backend Setup..."
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   https://aws.amazon.com/cli/"
    exit 1
fi

# Check AWS credentials
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure'"
    exit 1
fi
echo "✅ AWS credentials configured"
echo ""

# Get default VPC
echo "Getting default VPC..."
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text --region ${REGION})
if [ "$VPC_ID" == "None" ] || [ -z "$VPC_ID" ]; then
    echo "❌ No default VPC found. Please create a VPC first or update the script."
    exit 1
fi
echo "✅ Found VPC: ${VPC_ID}"

# Get subnets
echo "Getting subnets..."
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=${VPC_ID}" --query "Subnets[*].SubnetId" --output text --region ${REGION})
SUBNET_ARRAY=($SUBNET_IDS)
if [ ${#SUBNET_ARRAY[@]} -lt 2 ]; then
    echo "❌ Need at least 2 subnets. Found: ${#SUBNET_ARRAY[@]}"
    exit 1
fi
SUBNET_1=${SUBNET_ARRAY[0]}
SUBNET_2=${SUBNET_ARRAY[1]}
echo "✅ Using subnets: ${SUBNET_1}, ${SUBNET_2}"
echo ""

# Step 1: Create Security Groups
echo "Step 1: Creating security groups..."

# ALB Security Group
echo "  Creating ALB security group..."
ALB_SG_ID=$(aws ec2 create-security-group \
    --group-name ${ALB_SECURITY_GROUP_NAME} \
    --description "Security group for Office Hours ALB" \
    --vpc-id ${VPC_ID} \
    --region ${REGION} \
    --query 'GroupId' \
    --output text 2>/dev/null || \
    aws ec2 describe-security-groups \
        --filters "Name=group-name,Values=${ALB_SECURITY_GROUP_NAME}" "Name=vpc-id,Values=${VPC_ID}" \
        --query 'SecurityGroups[0].GroupId' \
        --output text \
        --region ${REGION})

# Allow HTTP traffic to ALB
aws ec2 authorize-security-group-ingress \
    --group-id ${ALB_SG_ID} \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --region ${REGION} 2>/dev/null || echo "  ALB security group rule already exists"

echo "  ✅ ALB Security Group: ${ALB_SG_ID}"

# Backend Security Group
echo "  Creating backend security group..."
BACKEND_SG_ID=$(aws ec2 create-security-group \
    --group-name ${SECURITY_GROUP_NAME} \
    --description "Security group for Office Hours backend" \
    --vpc-id ${VPC_ID} \
    --region ${REGION} \
    --query 'GroupId' \
    --output text 2>/dev/null || \
    aws ec2 describe-security-groups \
        --filters "Name=group-name,Values=${SECURITY_GROUP_NAME}" "Name=vpc-id,Values=${VPC_ID}" \
        --query 'SecurityGroups[0].GroupId' \
        --output text \
        --region ${REGION})

# Allow traffic from ALB to backend
aws ec2 authorize-security-group-ingress \
    --group-id ${BACKEND_SG_ID} \
    --protocol tcp \
    --port 8000 \
    --source-group ${ALB_SG_ID} \
    --region ${REGION} 2>/dev/null || echo "  Backend security group rule already exists"

echo "  ✅ Backend Security Group: ${BACKEND_SG_ID}"
echo ""

# Step 2: Create Application Load Balancer
echo "Step 2: Creating Application Load Balancer..."
ALB_ARN=$(aws elbv2 create-load-balancer \
    --name ${ALB_NAME} \
    --subnets ${SUBNET_1} ${SUBNET_2} \
    --security-groups ${ALB_SG_ID} \
    --scheme internet-facing \
    --type application \
    --region ${REGION} \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text 2>/dev/null || \
    aws elbv2 describe-load-balancers \
        --names ${ALB_NAME} \
        --query 'LoadBalancers[0].LoadBalancerArn' \
        --output text \
        --region ${REGION})

if [ "$ALB_ARN" == "None" ] || [ -z "$ALB_ARN" ]; then
    echo "  ⏳ Waiting for ALB to be available..."
    sleep 10
    ALB_ARN=$(aws elbv2 describe-load-balancers \
        --names ${ALB_NAME} \
        --query 'LoadBalancers[0].LoadBalancerArn' \
        --output text \
        --region ${REGION})
fi

ALB_DNS=$(aws elbv2 describe-load-balancers \
    --load-balancer-arns ${ALB_ARN} \
    --query 'LoadBalancers[0].DNSName' \
    --output text \
    --region ${REGION})

echo "  ✅ ALB created: ${ALB_DNS}"
echo ""

# Step 3: Create Target Group
echo "Step 3: Creating target group..."
TARGET_GROUP_ARN=$(aws elbv2 create-target-group \
    --name ${TARGET_GROUP_NAME} \
    --protocol HTTP \
    --port 8000 \
    --vpc-id ${VPC_ID} \
    --target-type ip \
    --health-check-path /api/v1/health \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3 \
    --region ${REGION} \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text 2>/dev/null || \
    aws elbv2 describe-target-groups \
        --names ${TARGET_GROUP_NAME} \
        --query 'TargetGroups[0].TargetGroupArn' \
        --output text \
        --region ${REGION})

echo "  ✅ Target Group: ${TARGET_GROUP_ARN}"
echo ""

# Step 4: Create Listener
echo "Step 4: Creating ALB listener..."
LISTENER_ARN=$(aws elbv2 create-listener \
    --load-balancer-arn ${ALB_ARN} \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=${TARGET_GROUP_ARN} \
    --region ${REGION} \
    --query 'Listeners[0].ListenerArn' \
    --output text 2>/dev/null || \
    aws elbv2 describe-listeners \
        --load-balancer-arn ${ALB_ARN} \
        --query 'Listeners[0].ListenerArn' \
        --output text \
        --region ${REGION})

echo "  ✅ Listener created"
echo ""

# Step 5: Create ECS Cluster
echo "Step 5: Creating ECS cluster..."
aws ecs create-cluster \
    --cluster-name ${CLUSTER_NAME} \
    --region ${REGION} \
    --capacity-providers FARGATE FARGATE_SPOT \
    --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
    2>/dev/null || echo "  Cluster already exists, continuing..."

echo "  ✅ Cluster: ${CLUSTER_NAME}"
echo ""

# Step 6: Get ECS Task Execution Role
echo "Step 6: Checking ECS task execution role..."
TASK_EXECUTION_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/ecsTaskExecutionRole"

# Check if role exists, if not create it
if ! aws iam get-role --role-name ecsTaskExecutionRole &> /dev/null; then
    echo "  Creating ECS task execution role..."
    
    # Create trust policy
    cat > /tmp/ecs-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

    # Create role
    aws iam create-role \
        --role-name ecsTaskExecutionRole \
        --assume-role-policy-document file:///tmp/ecs-trust-policy.json \
        --region ${REGION} > /dev/null

    # Attach policy
    aws iam attach-role-policy \
        --role-name ecsTaskExecutionRole \
        --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy \
        --region ${REGION}

    echo "  ✅ Task execution role created"
else
    echo "  ✅ Task execution role exists"
fi
echo ""

# Step 7: Prompt for environment variables
echo "Step 7: Environment Variables Configuration"
echo "=========================================="
echo ""
echo "Please provide the following required environment variables:"
echo ""

read -p "DATABASE_URL (postgresql://user:pass@host:5432/dbname): " DATABASE_URL
read -p "JWT_SECRET (64-char hex string): " JWT_SECRET
read -p "JWT_REFRESH_SECRET (64-char hex string): " JWT_REFRESH_SECRET
read -p "FRONTEND_URL (e.g., https://your-app.amplify.app): " FRONTEND_URL
read -p "OPENAI_API_KEY (required for AI matching): " OPENAI_API_KEY

echo ""
read -p "NODE_ENV [production]: " NODE_ENV
NODE_ENV=${NODE_ENV:-production}

read -p "PORT [8000]: " PORT
PORT=${PORT:-8000}

echo ""
echo "Optional environment variables (press Enter to skip):"
read -p "ENCRYPTION_KEY (64-char hex for calendar tokens): " ENCRYPTION_KEY
read -p "EMAIL_MOCK_MODE [true/false, default: true]: " EMAIL_MOCK_MODE
EMAIL_MOCK_MODE=${EMAIL_MOCK_MODE:-true}
read -p "SMS_MOCK_MODE [true/false, default: true]: " SMS_MOCK_MODE
SMS_MOCK_MODE=${SMS_MOCK_MODE:-true}

echo ""

# Step 8: Create Task Definition
echo "Step 8: Creating ECS task definition..."

# Build environment variables JSON
ENV_VARS="[
  {\"name\": \"NODE_ENV\", \"value\": \"${NODE_ENV}\"},
  {\"name\": \"PORT\", \"value\": \"${PORT}\"},
  {\"name\": \"DATABASE_URL\", \"value\": \"${DATABASE_URL}\"},
  {\"name\": \"JWT_SECRET\", \"value\": \"${JWT_SECRET}\"},
  {\"name\": \"JWT_REFRESH_SECRET\", \"value\": \"${JWT_REFRESH_SECRET}\"},
  {\"name\": \"FRONTEND_URL\", \"value\": \"${FRONTEND_URL}\"},
  {\"name\": \"OPENAI_API_KEY\", \"value\": \"${OPENAI_API_KEY}\"},
  {\"name\": \"EMAIL_MOCK_MODE\", \"value\": \"${EMAIL_MOCK_MODE}\"},
  {\"name\": \"SMS_MOCK_MODE\", \"value\": \"${SMS_MOCK_MODE}\"}
"

if [ ! -z "$ENCRYPTION_KEY" ]; then
    ENV_VARS="${ENV_VARS},
  {\"name\": \"ENCRYPTION_KEY\", \"value\": \"${ENCRYPTION_KEY}\"}"
fi

ENV_VARS="${ENV_VARS}
]"

# Create task definition JSON
TASK_DEF_JSON=$(cat <<EOF
{
  "family": "${TASK_DEFINITION_NAME}",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "${TASK_EXECUTION_ROLE_ARN}",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "${IMAGE_URI}",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": ${ENV_VARS},
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/${TASK_DEFINITION_NAME}",
          "awslogs-region": "${REGION}",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "node -e \"require('http').get('http://localhost:8000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\""],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
EOF
)

# Create CloudWatch log group
aws logs create-log-group \
    --log-group-name "/ecs/${TASK_DEFINITION_NAME}" \
    --region ${REGION} 2>/dev/null || echo "  Log group already exists"

# Create task definition JSON file using Python for proper escaping
TASK_DEF_FILE="/tmp/task-def-${TASK_DEFINITION_NAME}-$$.json"

# Export variables for Python
export DATABASE_URL JWT_SECRET JWT_REFRESH_SECRET FRONTEND_URL OPENAI_API_KEY
export NODE_ENV PORT EMAIL_MOCK_MODE SMS_MOCK_MODE ENCRYPTION_KEY
export TASK_DEFINITION_NAME IMAGE_URI TASK_EXECUTION_ROLE_ARN REGION

python3 <<'PYTHON_SCRIPT' > ${TASK_DEF_FILE}
import json
import os

env_vars = [
    {"name": "NODE_ENV", "value": os.environ.get("NODE_ENV", "production")},
    {"name": "PORT", "value": os.environ.get("PORT", "8000")},
    {"name": "DATABASE_URL", "value": os.environ.get("DATABASE_URL", "")},
    {"name": "JWT_SECRET", "value": os.environ.get("JWT_SECRET", "")},
    {"name": "JWT_REFRESH_SECRET", "value": os.environ.get("JWT_REFRESH_SECRET", "")},
    {"name": "FRONTEND_URL", "value": os.environ.get("FRONTEND_URL", "")},
    {"name": "OPENAI_API_KEY", "value": os.environ.get("OPENAI_API_KEY", "")},
    {"name": "EMAIL_MOCK_MODE", "value": os.environ.get("EMAIL_MOCK_MODE", "true")},
    {"name": "SMS_MOCK_MODE", "value": os.environ.get("SMS_MOCK_MODE", "true")}
]

encryption_key = os.environ.get("ENCRYPTION_KEY", "")
if encryption_key:
    env_vars.append({"name": "ENCRYPTION_KEY", "value": encryption_key})

task_def = {
    "family": os.environ.get("TASK_DEFINITION_NAME", "office-hours-backend"),
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "512",
    "memory": "1024",
    "executionRoleArn": os.environ.get("TASK_EXECUTION_ROLE_ARN", ""),
    "containerDefinitions": [
        {
            "name": "backend",
            "image": os.environ.get("IMAGE_URI", ""),
            "essential": True,
            "portMappings": [
                {
                    "containerPort": 8000,
                    "protocol": "tcp"
                }
            ],
            "environment": env_vars,
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": f"/ecs/{os.environ.get('TASK_DEFINITION_NAME', 'office-hours-backend')}",
                    "awslogs-region": os.environ.get("REGION", "us-east-2"),
                    "awslogs-stream-prefix": "ecs"
                }
            },
            "healthCheck": {
                "command": ["CMD-SHELL", "node -e \"require('http').get('http://localhost:8000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\""],
                "interval": 30,
                "timeout": 5,
                "retries": 3,
                "startPeriod": 60
            }
        }
    ]
}

print(json.dumps(task_def, indent=2))
PYTHON_SCRIPT

# Register task definition
TASK_DEF_ARN=$(aws ecs register-task-definition \
    --cli-input-json file://${TASK_DEF_FILE} \
    --region ${REGION} \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)

# Clean up temp file
rm -f ${TASK_DEF_FILE}

echo "  ✅ Task definition created: ${TASK_DEF_ARN}"
echo ""

# Step 9: Create ECS Service
echo "Step 9: Creating ECS service..."
SERVICE_ARN=$(aws ecs create-service \
    --cluster ${CLUSTER_NAME} \
    --service-name ${SERVICE_NAME} \
    --task-definition ${TASK_DEFINITION_NAME} \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_1},${SUBNET_2}],securityGroups=[${BACKEND_SG_ID}],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=${TARGET_GROUP_ARN},containerName=backend,containerPort=8000" \
    --region ${REGION} \
    --query 'service.serviceArn' \
    --output text 2>/dev/null || \
    aws ecs describe-services \
        --cluster ${CLUSTER_NAME} \
        --services ${SERVICE_NAME} \
        --query 'services[0].serviceArn' \
        --output text \
        --region ${REGION})

echo "  ✅ Service created: ${SERVICE_NAME}"
echo ""

# Summary
echo ""
echo "=========================================="
echo "✅ ECS Backend Setup Complete!"
echo "=========================================="
echo ""
echo "📋 Summary:"
echo "  Cluster: ${CLUSTER_NAME}"
echo "  Service: ${SERVICE_NAME}"
echo "  Load Balancer: ${ALB_DNS}"
echo "  Backend URL: http://${ALB_DNS}/api/v1"
echo ""
echo "🔧 Next Steps:"
echo "  1. Wait 2-3 minutes for the service to start"
echo "  2. Check service status:"
echo "     aws ecs describe-services --cluster ${CLUSTER_NAME} --services ${SERVICE_NAME} --region ${REGION}"
echo ""
echo "  3. Test backend health:"
echo "     curl http://${ALB_DNS}/api/v1/health"
echo ""
echo "  4. Set in Amplify environment variables:"
echo "     VITE_API_URL=http://${ALB_DNS}/api/v1"
echo ""
echo "  5. View logs in CloudWatch:"
echo "     https://console.aws.amazon.com/cloudwatch/home?region=${REGION}#logsV2:log-groups/log-group/%2Fecs%2F${TASK_DEFINITION_NAME}"
echo ""
echo "📝 Important URLs:"
echo "  Backend API: http://${ALB_DNS}/api/v1"
echo "  ECS Console: https://console.aws.amazon.com/ecs/v2/clusters/${CLUSTER_NAME}/services/${SERVICE_NAME}"
echo ""


