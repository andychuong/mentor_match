# ALB HTTPS Configuration Guide

This guide will help you configure HTTPS on your Application Load Balancer to fix the mixed content error.

## 🎯 Problem

Your frontend (Amplify) is served over HTTPS, but your backend API uses HTTP, causing browsers to block requests with a "Mixed Content" error.

## ✅ Solution: Configure HTTPS on ALB

### Prerequisites

- AWS CLI configured with appropriate permissions
- Existing ALB (Application Load Balancer)
- Domain name (optional, but recommended) OR use ALB DNS name

---

## Option 1: Using AWS Certificate Manager (ACM) - Recommended

### Step 1: Request SSL Certificate in ACM

#### Option A: Using ALB DNS Name (Quick Testing)

**Note:** ACM certificates require domain validation. For ALB DNS names, you'll need to use a custom domain or use Option 2 (self-signed for testing only).

#### Option B: Using Custom Domain (Production Recommended)

1. **Go to AWS Certificate Manager**
   - Navigate to [ACM Console](https://console.aws.amazon.com/acm/)
   - Select region: **us-east-2** (must match ALB region)

2. **Request Certificate**
   - Click **"Request certificate"**
   - Select **"Request a public certificate"**
   - Enter domain name: `api.yourdomain.com` (or your domain)
   - Add additional names if needed
   - Choose **"DNS validation"** (recommended)
   - Click **"Request"**

3. **Validate Certificate**
   - ACM will provide DNS records to add to your domain
   - Add the CNAME records to your DNS provider
   - Wait for validation (usually 5-30 minutes)

### Step 2: Get Your ALB ARN

```bash
# Get ALB ARN
ALB_ARN=$(aws elbv2 describe-load-balancers \
    --names office-hours-alb \
    --region us-east-2 \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text)

echo "ALB ARN: $ALB_ARN"
```

### Step 3: Get Certificate ARN

```bash
# List certificates
aws acm list-certificates --region us-east-2

# Get certificate ARN (replace with your certificate ARN)
CERT_ARN="arn:aws:acm:us-east-2:971422717446:certificate/xxxxx-xxxxx-xxxxx"
```

### Step 4: Add HTTPS Listener to ALB

```bash
# Get target group ARN
TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups \
    --names office-hours-backend-tg \
    --region us-east-2 \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)

# Create HTTPS listener
aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTPS \
    --port 443 \
    --certificates CertificateArn=$CERT_ARN \
    --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN \
    --region us-east-2
```

### Step 5: (Optional) Redirect HTTP to HTTPS

```bash
# Get HTTP listener ARN
HTTP_LISTENER_ARN=$(aws elbv2 describe-listeners \
    --load-balancer-arn $ALB_ARN \
    --region us-east-2 \
    --query 'Listeners[?Port==`80`].ListenerArn' \
    --output text)

# Update HTTP listener to redirect to HTTPS
aws elbv2 modify-listener \
    --listener-arn $HTTP_LISTENER_ARN \
    --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}' \
    --region us-east-2
```

### Step 6: Update Security Group

```bash
# Get ALB security group ID
ALB_SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=office-hours-alb-sg" \
    --region us-east-2 \
    --query 'SecurityGroups[0].GroupId' \
    --output text)

# Allow HTTPS traffic (port 443)
aws ec2 authorize-security-group-ingress \
    --group-id $ALB_SG_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0 \
    --region us-east-2
```

### Step 7: Update Amplify Environment Variable

1. **Get ALB DNS Name**
   ```bash
   ALB_DNS=$(aws elbv2 describe-load-balancers \
       --names office-hours-alb \
       --region us-east-2 \
       --query 'LoadBalancers[0].DNSName' \
       --output text)
   
   echo "Backend URL: https://${ALB_DNS}/api/v1"
   ```

2. **Update Amplify**
   - Go to [Amplify Console](https://console.aws.amazon.com/amplify)
   - Select your app → **App settings** → **Environment variables**
   - Update `VITE_API_URL` to: `https://${ALB_DNS}/api/v1`
   - Click **"Save"**
   - Trigger a new deployment

---

## Option 2: Quick Script (Automated)

Run the automated script:

```bash
cd docs
chmod +x setup-alb-https.sh
./setup-alb-https.sh
```

**Note:** This script requires a certificate ARN. See Option 1 for certificate setup.

---

## Option 3: Self-Signed Certificate (Testing Only - Not Recommended)

**⚠️ Warning:** Self-signed certificates will show security warnings in browsers. Only use for testing.

```bash
# This approach is complex and not recommended
# Better to use ACM with a domain or use HTTP for testing
```

---

## 🔍 Verification

### Test HTTPS Endpoint

```bash
# Test health endpoint over HTTPS
curl https://office-hours-alb-2030945038.us-east-2.elb.amazonaws.com/api/v1/health

# Should return:
# {"success":true,"data":{"status":"ok"}}
```

### Test from Browser

1. Navigate to: `https://office-hours-alb-2030945038.us-east-2.elb.amazonaws.com/api/v1/health`
2. Should see JSON response (may show certificate warning if self-signed)

### Test Frontend Login

1. Go to: `https://main.d9615h0u1yd6d.amplifyapp.com/login`
2. Enter credentials: `mentee1@test.com` / `mentee123`
3. Should successfully login without mixed content errors

---

## 🐛 Troubleshooting

### Issue: Certificate validation pending

**Solution:**
- Check DNS records are correctly added
- Wait up to 30 minutes for validation
- Verify DNS records match ACM requirements

### Issue: Certificate not found in region

**Solution:**
- ACM certificates are region-specific
- Ensure certificate is in the same region as ALB (us-east-2)
- Request certificate in correct region

### Issue: HTTPS listener creation fails

**Solution:**
- Verify certificate ARN is correct
- Check certificate status is "Issued"
- Ensure ALB ARN is correct
- Verify you have permissions to create listeners

### Issue: Security group doesn't allow HTTPS

**Solution:**
- Check security group allows port 443 from 0.0.0.0/0
- Verify security group is attached to ALB

### Issue: Still getting mixed content errors

**Solution:**
- Clear browser cache
- Verify `VITE_API_URL` uses `https://` not `http://`
- Check Amplify deployment completed
- Verify backend CORS allows Amplify domain

---

## 📋 Checklist

- [ ] SSL certificate requested in ACM (us-east-2)
- [ ] Certificate validated (status: Issued)
- [ ] HTTPS listener created on ALB (port 443)
- [ ] Security group allows HTTPS (port 443)
- [ ] HTTP listener redirects to HTTPS (optional)
- [ ] `VITE_API_URL` updated in Amplify to use HTTPS
- [ ] Amplify deployment triggered
- [ ] Backend health endpoint accessible via HTTPS
- [ ] Frontend login works without mixed content errors

---

## 💡 Best Practices

1. **Use Custom Domain**
   - Point `api.yourdomain.com` to ALB DNS
   - Request certificate for custom domain
   - More professional and easier to remember

2. **Enable HTTP to HTTPS Redirect**
   - Automatically redirects all HTTP traffic to HTTPS
   - Better security and SEO

3. **Monitor Certificate Expiration**
   - ACM certificates auto-renew
   - Set up CloudWatch alarms for certificate issues

4. **Update CORS Configuration**
   - Ensure backend allows requests from Amplify domain
   - Update `FRONTEND_URL` environment variable

---

## 🔗 Related Documentation

- [AWS Certificate Manager](https://docs.aws.amazon.com/acm/)
- [ALB Listeners](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/listener-authenticate-users.html)
- [Mixed Content](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content)

---

**Last Updated:** November 13, 2025

