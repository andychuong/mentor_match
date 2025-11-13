#!/bin/bash
# Custom Domain Setup Script for ALB
# This script helps configure api.aideator.app to point to your ALB

set -e  # Exit on error

# Configuration
REGION="us-east-2"
ALB_NAME="office-hours-alb"
CUSTOM_DOMAIN="api.aideator.app"
CERT_ARN="arn:aws:acm:us-east-2:971422717446:certificate/44bb3745-a0f5-4133-90f0-3dbf88f23f3e"

echo "🌐 Custom Domain Setup for ALB"
echo "================================"
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

# Step 1: Get ALB DNS name
echo "Step 1: Getting ALB DNS name..."
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --names ${ALB_NAME} \
    --region ${REGION} \
    --query 'LoadBalancers[0].DNSName' \
    --output text)

if [ -z "$ALB_DNS" ] || [ "$ALB_DNS" == "None" ]; then
    echo "❌ ALB '${ALB_NAME}' not found"
    exit 1
fi

echo "  ✅ ALB DNS: ${ALB_DNS}"
echo ""

# Step 2: Check if domain is in Route 53
echo "Step 2: Checking if domain is in Route 53..."
DOMAIN_NAME="aideator.app"
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
    --query "HostedZones[?Name=='${DOMAIN_NAME}.'].[Id]" \
    --output text 2>/dev/null | sed 's|/hostedzone/||')

if [ ! -z "$HOSTED_ZONE_ID" ] && [ "$HOSTED_ZONE_ID" != "None" ]; then
    echo "  ✅ Domain found in Route 53"
    echo "  Hosted Zone ID: ${HOSTED_ZONE_ID}"
    echo ""
    
    # Check if record already exists
    echo "Step 3: Checking for existing DNS record..."
    EXISTING_RECORD=$(aws route53 list-resource-record-sets \
        --hosted-zone-id ${HOSTED_ZONE_ID} \
        --query "ResourceRecordSets[?Name=='${CUSTOM_DOMAIN}.']" \
        --output json 2>/dev/null)
    
    if [ "$EXISTING_RECORD" != "[]" ] && [ ! -z "$EXISTING_RECORD" ]; then
        echo "  ⚠️  DNS record already exists for ${CUSTOM_DOMAIN}"
        read -p "  Do you want to update it? (y/n): " UPDATE_RECORD
        if [ "$UPDATE_RECORD" != "y" ]; then
            echo "  Skipping DNS record creation..."
            SKIP_DNS=true
        fi
    fi
    
    if [ "$SKIP_DNS" != "true" ]; then
        echo "  Creating/updating DNS record..."
        
        # Create change batch for Route 53
        CHANGE_BATCH=$(cat <<EOF
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "${CUSTOM_DOMAIN}",
      "Type": "CNAME",
      "TTL": 300,
      "ResourceRecords": [{"Value": "${ALB_DNS}"}]
    }
  }]
}
EOF
)
        
        CHANGE_ID=$(aws route53 change-resource-record-sets \
            --hosted-zone-id ${HOSTED_ZONE_ID} \
            --change-batch "$CHANGE_BATCH" \
            --query 'ChangeInfo.Id' \
            --output text)
        
        echo "  ✅ DNS record created/updated"
        echo "  Change ID: ${CHANGE_ID}"
        echo "  ⏳ DNS propagation may take 5-30 minutes"
    fi
else
    echo "  ⚠️  Domain not found in Route 53"
    echo "  You'll need to create the DNS record manually in your DNS provider"
    echo ""
    echo "  Create CNAME record:"
    echo "    Name: api"
    echo "    Value: ${ALB_DNS}"
    echo "    TTL: 300"
fi
echo ""

# Step 4: Verify ALB listener
echo "Step 4: Verifying ALB HTTPS listener..."
ALB_ARN=$(aws elbv2 describe-load-balancers \
    --names ${ALB_NAME} \
    --region ${REGION} \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text)

HTTPS_LISTENER=$(aws elbv2 describe-listeners \
    --load-balancer-arn ${ALB_ARN} \
    --region ${REGION} \
    --query 'Listeners[?Port==`443`]' \
    --output json)

if [ "$HTTPS_LISTENER" != "[]" ] && [ ! -z "$HTTPS_LISTENER" ]; then
    CURRENT_CERT=$(echo $HTTPS_LISTENER | jq -r '.[0].Certificates[0].CertificateArn' 2>/dev/null || echo "")
    if [ "$CURRENT_CERT" == "$CERT_ARN" ]; then
        echo "  ✅ HTTPS listener configured with correct certificate"
    else
        echo "  ⚠️  HTTPS listener exists but certificate may be different"
        echo "  Current: ${CURRENT_CERT}"
        echo "  Expected: ${CERT_ARN}"
    fi
else
    echo "  ⚠️  No HTTPS listener found on port 443"
    echo "  Run setup-alb-https.sh first"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Custom Domain Setup Complete!"
echo ""
echo "📋 Summary:"
echo "  Custom Domain: ${CUSTOM_DOMAIN}"
echo "  ALB DNS: ${ALB_DNS}"
echo "  Backend URL: https://${CUSTOM_DOMAIN}/api/v1"
echo ""
echo "📝 Next Steps:"
echo "  1. Wait for DNS propagation (5-30 minutes)"
echo "  2. Test DNS: dig ${CUSTOM_DOMAIN} or nslookup ${CUSTOM_DOMAIN}"
echo "  3. Test backend: curl https://${CUSTOM_DOMAIN}/api/v1/health"
echo "  4. Update Amplify environment variable:"
echo "     VITE_API_URL=https://${CUSTOM_DOMAIN}/api/v1"
echo "  5. Trigger new Amplify build"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

