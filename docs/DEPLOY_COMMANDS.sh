#!/bin/bash
# AWS ECR Deployment Commands for Office Hours Backend
# Replace <account-id> with your actual AWS account ID: 971422717446

set -e  # Exit on error

ACCOUNT_ID="971422717446"
REGION="us-east-2"
REPO_NAME="office-hours-backend"
IMAGE_NAME="office-hours-backend"

echo "🚀 Starting ECR deployment process..."

# Step 1: Create ECR repository (if it doesn't exist)
echo ""
echo "Step 1: Creating ECR repository..."
aws ecr create-repository \
  --repository-name ${REPO_NAME} \
  --region ${REGION} \
  --image-scanning-configuration scanOnPush=true \
  2>/dev/null || echo "Repository already exists, continuing..."

# Step 2: Get ECR login token
echo ""
echo "Step 2: Logging into ECR..."
aws ecr get-login-password --region ${REGION} | \
  docker login --username AWS --password-stdin \
  ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com

# Step 3: Build Docker image for linux/amd64 (required for ECS Fargate)
echo ""
echo "Step 3: Building Docker image for linux/amd64 platform..."
cd backend
docker build --platform linux/amd64 -t ${IMAGE_NAME} .

# Step 4: Tag image for ECR
echo ""
echo "Step 4: Tagging image for ECR..."
docker tag ${IMAGE_NAME}:latest \
  ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO_NAME}:latest

# Step 5: Push to ECR
echo ""
echo "Step 5: Pushing image to ECR..."
docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO_NAME}:latest

echo ""
echo "✅ Image pushed successfully!"
echo ""
echo "ECR Image URI:"
echo "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO_NAME}:latest"
echo ""
echo "Next steps:"
echo "1. Create ECS task definition using this image URI"
echo "2. Create ECS service from the task definition"
echo "3. Configure environment variables in ECS task definition"


