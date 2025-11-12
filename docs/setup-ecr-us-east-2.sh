#!/bin/bash
# Setup ECR in us-east-2 and push Docker image

set -e

ACCOUNT_ID="971422717446"
REGION="us-east-2"
REPO_NAME="office-hours-backend"
IMAGE_NAME="office-hours-backend"

echo "🚀 Setting up ECR in ${REGION}..."
echo ""

# Step 1: Create ECR repository
echo "Step 1: Creating ECR repository..."
aws ecr create-repository \
  --repository-name ${REPO_NAME} \
  --region ${REGION} \
  --image-scanning-configuration scanOnPush=true \
  2>/dev/null || echo "  Repository already exists, continuing..."

echo "  ✅ ECR repository created"
echo ""

# Step 2: Get ECR login token
echo "Step 2: Logging into ECR..."
aws ecr get-login-password --region ${REGION} | \
  docker login --username AWS --password-stdin \
  ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com

echo "  ✅ Logged into ECR"
echo ""

# Step 3: Build Docker image for linux/amd64 (required for ECS Fargate)
echo "Step 3: Building Docker image for linux/amd64 platform..."
cd backend
docker build --platform linux/amd64 -t ${IMAGE_NAME} .

echo "  ✅ Docker image built"
echo ""

# Step 4: Tag image for ECR
echo "Step 4: Tagging image for ECR..."
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO_NAME}:latest"
docker tag ${IMAGE_NAME}:latest ${ECR_URI}

echo "  ✅ Image tagged"
echo ""

# Step 5: Push to ECR
echo "Step 5: Pushing image to ECR..."
docker push ${ECR_URI}

echo ""
echo "✅ Image pushed successfully!"
echo ""
echo "ECR Image URI: ${ECR_URI}"
echo ""
echo "Next: Run ./docs/setup-ecs-backend.sh to create ECS resources in us-east-2"


