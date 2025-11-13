#!/bin/bash
# ALB HTTPS Configuration Script
# This script configures HTTPS on your Application Load Balancer

set -e  # Exit on error

# Configuration
REGION="us-east-2"
ALB_NAME="office-hours-alb"
TARGET_GROUP_NAME="office-hours-backend-tg"
ALB_SECURITY_GROUP_NAME="office-hours-alb-sg"

echo "🔒 Starting ALB HTTPS Configuration..."
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

# Step 1: Get ALB ARN
echo "Step 1: Getting ALB information..."
ALB_ARN=$(aws elbv2 describe-load-balancers \
    --names ${ALB_NAME} \
    --region ${REGION} \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text)

if [ "$ALB_ARN" == "None" ] || [ -z "$ALB_ARN" ]; then
    echo "❌ ALB '${ALB_NAME}' not found in region ${REGION}"
    exit 1
fi

ALB_DNS=$(aws elbv2 describe-load-balancers \
    --load-balancer-arns ${ALB_ARN} \
    --region ${REGION} \
    --query 'LoadBalancers[0].DNSName' \
    --output text)

echo "  ✅ ALB found: ${ALB_DNS}"
echo "  ✅ ALB ARN: ${ALB_ARN}"
echo ""

# Step 2: List available certificates
echo "Step 2: Listing available SSL certificates..."
echo ""
echo "Available certificates in ${REGION}:"
aws acm list-certificates \
    --region ${REGION} \
    --query 'CertificateSummaryList[*].[CertificateArn,DomainName,Status]' \
    --output table

echo ""
read -p "Enter the Certificate ARN (or press Enter to skip): " CERT_ARN

if [ -z "$CERT_ARN" ]; then
    echo ""
    echo "⚠️  No certificate selected. Please:"
    echo "   1. Request a certificate in ACM (us-east-2)"
    echo "   2. Validate the certificate"
    echo "   3. Run this script again with the certificate ARN"
    echo ""
    echo "Or use the manual steps in docs/ALB_HTTPS_SETUP.md"
    exit 1
fi

# Verify certificate exists
CERT_STATUS=$(aws acm describe-certificate \
    --certificate-arn ${CERT_ARN} \
    --region ${REGION} \
    --query 'Certificate.Status' \
    --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$CERT_STATUS" != "ISSUED" ]; then
    echo "❌ Certificate not found or not issued. Status: ${CERT_STATUS}"
    echo "   Please ensure the certificate is validated and issued."
    exit 1
fi

echo "  ✅ Certificate found and issued: ${CERT_ARN}"
echo ""

# Step 3: Get Target Group ARN
echo "Step 3: Getting target group..."
TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups \
    --names ${TARGET_GROUP_NAME} \
    --region ${REGION} \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)

if [ "$TARGET_GROUP_ARN" == "None" ] || [ -z "$TARGET_GROUP_ARN" ]; then
    echo "❌ Target group '${TARGET_GROUP_NAME}' not found"
    exit 1
fi

echo "  ✅ Target Group: ${TARGET_GROUP_ARN}"
echo ""

# Step 4: Check if HTTPS listener already exists
echo "Step 4: Checking for existing HTTPS listener..."
EXISTING_HTTPS=$(aws elbv2 describe-listeners \
    --load-balancer-arn ${ALB_ARN} \
    --region ${REGION} \
    --query 'Listeners[?Port==`443`].ListenerArn' \
    --output text)

if [ ! -z "$EXISTING_HTTPS" ] && [ "$EXISTING_HTTPS" != "None" ]; then
    echo "  ⚠️  HTTPS listener already exists: ${EXISTING_HTTPS}"
    read -p "  Do you want to update it? (y/n): " UPDATE_LISTENER
    if [ "$UPDATE_LISTENER" != "y" ]; then
        echo "  Skipping listener creation..."
    else
        echo "  Updating HTTPS listener..."
        aws elbv2 modify-listener \
            --listener-arn ${EXISTING_HTTPS} \
            --certificates CertificateArn=${CERT_ARN} \
            --default-actions Type=forward,TargetGroupArn=${TARGET_GROUP_ARN} \
            --region ${REGION}
        echo "  ✅ HTTPS listener updated"
    fi
else
    echo "  Creating HTTPS listener..."
    HTTPS_LISTENER_ARN=$(aws elbv2 create-listener \
        --load-balancer-arn ${ALB_ARN} \
        --protocol HTTPS \
        --port 443 \
        --certificates CertificateArn=${CERT_ARN} \
        --default-actions Type=forward,TargetGroupArn=${TARGET_GROUP_ARN} \
        --region ${REGION} \
        --query 'Listeners[0].ListenerArn' \
        --output text)
    echo "  ✅ HTTPS listener created: ${HTTPS_LISTENER_ARN}"
fi
echo ""

# Step 5: Update Security Group
echo "Step 5: Updating security group..."
ALB_SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=${ALB_SECURITY_GROUP_NAME}" \
    --region ${REGION} \
    --query 'SecurityGroups[0].GroupId' \
    --output text)

if [ "$ALB_SG_ID" == "None" ] || [ -z "$ALB_SG_ID" ]; then
    echo "  ⚠️  Security group not found: ${ALB_SECURITY_GROUP_NAME}"
else
    # Check if rule already exists
    EXISTING_RULE=$(aws ec2 describe-security-groups \
        --group-ids ${ALB_SG_ID} \
        --region ${REGION} \
        --query 'SecurityGroups[0].IpPermissions[?FromPort==`443`]' \
        --output json)

    if [ "$EXISTING_RULE" == "[]" ] || [ -z "$EXISTING_RULE" ]; then
        echo "  Adding HTTPS rule (port 443)..."
        aws ec2 authorize-security-group-ingress \
            --group-id ${ALB_SG_ID} \
            --protocol tcp \
            --port 443 \
            --cidr 0.0.0.0/0 \
            --region ${REGION} 2>/dev/null || echo "  Rule already exists or error occurred"
        echo "  ✅ Security group updated"
    else
        echo "  ✅ HTTPS rule already exists in security group"
    fi
fi
echo ""

# Step 6: (Optional) Configure HTTP to HTTPS redirect
echo "Step 6: Configuring HTTP to HTTPS redirect..."
HTTP_LISTENER_ARN=$(aws elbv2 describe-listeners \
    --load-balancer-arn ${ALB_ARN} \
    --region ${REGION} \
    --query 'Listeners[?Port==`80`].ListenerArn' \
    --output text)

if [ ! -z "$HTTP_LISTENER_ARN" ] && [ "$HTTP_LISTENER_ARN" != "None" ]; then
    read -p "  Do you want to redirect HTTP to HTTPS? (y/n): " REDIRECT_HTTP
    if [ "$REDIRECT_HTTP" == "y" ]; then
        echo "  Updating HTTP listener to redirect to HTTPS..."
        aws elbv2 modify-listener \
            --listener-arn ${HTTP_LISTENER_ARN} \
            --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}' \
            --region ${REGION}
        echo "  ✅ HTTP to HTTPS redirect configured"
    fi
else
    echo "  ⚠️  No HTTP listener found (this is okay)"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ HTTPS Configuration Complete!"
echo ""
echo "📋 Summary:"
echo "  ALB DNS: ${ALB_DNS}"
echo "  Backend HTTPS URL: https://${ALB_DNS}/api/v1"
echo ""
echo "📝 Next Steps:"
echo "  1. Update Amplify environment variable:"
echo "     - Go to Amplify Console → App settings → Environment variables"
echo "     - Update VITE_API_URL to: https://${ALB_DNS}/api/v1"
echo "     - Save and trigger new deployment"
echo ""
echo "  2. Test HTTPS endpoint:"
echo "     curl https://${ALB_DNS}/api/v1/health"
echo ""
echo "  3. Test frontend login:"
echo "     https://main.d9615h0u1yd6d.amplifyapp.com/login"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

