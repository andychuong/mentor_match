# Custom Domain Setup Guide for ALB

This guide will help you configure a custom domain (`api.aideator.app`) to point to your ALB and fix the SSL certificate issue.

## 🎯 Goal

Set up `api.aideator.app` → `office-hours-alb-2030945038.us-east-2.elb.amazonaws.com` so your SSL certificate (`*.aideator.app`) works correctly.

---

## Step 1: Set Up DNS Record

### Option A: Using Route 53 (If domain is in AWS)

1. **Go to Route 53 Console**
   - Navigate to [Route 53 Console](https://console.aws.amazon.com/route53/)
   - Click **"Hosted zones"**
   - Select `aideator.app`

2. **Create CNAME Record**
   - Click **"Create record"**
   - **Record name:** `api` (creates `api.aideator.app`)
   - **Record type:** CNAME
   - **Value:** `office-hours-alb-2030945038.us-east-2.elb.amazonaws.com`
   - **TTL:** 300 (or default)
   - Click **"Create records"**

### Option B: Using External DNS Provider (GoDaddy, Namecheap, etc.)

1. **Log in to your DNS provider**
   - Go to your domain management panel
   - Find DNS settings for `aideator.app`

2. **Add CNAME Record**
   - **Type:** CNAME
   - **Name/Host:** `api`
   - **Value/Target:** `office-hours-alb-2030945038.us-east-2.elb.amazonaws.com`
   - **TTL:** 300 (or 5 minutes)
   - **Save** the record

### Verify DNS Propagation

Wait 5-30 minutes, then verify:

```bash
# Check DNS resolution
dig api.aideator.app
# or
nslookup api.aideator.app

# Should return: office-hours-alb-2030945038.us-east-2.elb.amazonaws.com
```

---

## Step 2: Verify ALB Listener Configuration

The HTTPS listener should already be configured with your certificate. Let's verify:

### Check Current Listener

```bash
# Get ALB ARN
ALB_ARN=$(aws elbv2 describe-load-balancers \
    --names office-hours-alb \
    --region us-east-2 \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text)

# List listeners
aws elbv2 describe-listeners \
    --load-balancer-arn $ALB_ARN \
    --region us-east-2 \
    --query 'Listeners[*].[Port,Protocol,Certificates[0].CertificateArn]' \
    --output table
```

### Update Listener (If Needed)

If the listener isn't using the correct certificate:

```bash
# Get HTTPS listener ARN
HTTPS_LISTENER_ARN=$(aws elbv2 describe-listeners \
    --load-balancer-arn $ALB_ARN \
    --region us-east-2 \
    --query 'Listeners[?Port==`443`].ListenerArn' \
    --output text)

# Get target group ARN
TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups \
    --names office-hours-backend-tg \
    --region us-east-2 \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)

# Certificate ARN (from earlier)
CERT_ARN="arn:aws:acm:us-east-2:971422717446:certificate/44bb3745-a0f5-4133-90f0-3dbf88f23f3e"

# Update listener
aws elbv2 modify-listener \
    --listener-arn $HTTPS_LISTENER_ARN \
    --certificates CertificateArn=$CERT_ARN \
    --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN \
    --region us-east-2
```

---

## Step 3: Test Custom Domain

After DNS propagates (5-30 minutes), test:

```bash
# Test health endpoint
curl https://api.aideator.app/api/v1/health

# Should return:
# {"success":true,"status":"healthy","timestamp":"..."}
```

If you get SSL errors, wait a bit longer for DNS propagation.

---

## Step 4: Update Amplify Environment Variable

1. **Go to Amplify Console**
   - Navigate to [Amplify Console](https://console.aws.amazon.com/amplify)
   - Select your app: `mentor_match`
   - Go to **App settings** → **Environment variables**

2. **Update VITE_API_URL**
   - Find `VITE_API_URL`
   - Change value to: `https://api.aideator.app/api/v1`
   - Click **"Save"**

3. **Trigger New Build**
   - Amplify should auto-trigger a build
   - Or manually trigger: **Build history** → **Redeploy this version**
   - Wait for build to complete (5-10 minutes)

---

## Step 5: Verify Everything Works

### Test Backend

```bash
# Test health endpoint
curl https://api.aideator.app/api/v1/health

# Test login endpoint
curl -X POST https://api.aideator.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mentee1@test.com","password":"mentee123"}'
```

### Test Frontend

1. Go to: `https://main.d9615h0u1yd6d.amplifyapp.com/login`
2. Login with: `mentee1@test.com` / `mentee123`
3. Should work without SSL errors!

---

## 🐛 Troubleshooting

### Issue: DNS not resolving

**Solution:**
- Wait longer (can take up to 48 hours, usually 5-30 minutes)
- Verify CNAME record is correct
- Check DNS provider's propagation status
- Try: `dig api.aideator.app` or `nslookup api.aideator.app`

### Issue: SSL certificate error

**Solution:**
- Verify certificate covers `*.aideator.app` (wildcard)
- Ensure DNS is fully propagated
- Clear browser cache
- Try incognito/private browsing mode

### Issue: 502 Bad Gateway

**Solution:**
- Check ALB target group health
- Verify ECS tasks are running
- Check security groups allow traffic
- Review CloudWatch logs

### Issue: CORS errors

**Solution:**
- Update backend `FRONTEND_URL` environment variable to include Amplify domain
- Verify CORS configuration in backend code

---

## 📋 Quick Checklist

- [ ] DNS CNAME record created: `api` → ALB DNS name
- [ ] DNS propagated (verified with `dig` or `nslookup`)
- [ ] ALB HTTPS listener configured with certificate
- [ ] Backend accessible via `https://api.aideator.app/api/v1/health`
- [ ] Amplify `VITE_API_URL` updated to `https://api.aideator.app/api/v1`
- [ ] New Amplify build triggered and completed
- [ ] Frontend login works without errors

---

## 🔗 Quick Reference

- **Custom Domain:** `api.aideator.app`
- **ALB DNS:** `office-hours-alb-2030945038.us-east-2.elb.amazonaws.com`
- **Certificate ARN:** `arn:aws:acm:us-east-2:971422717446:certificate/44bb3745-a0f5-4133-90f0-3dbf88f23f3e`
- **Backend URL:** `https://api.aideator.app/api/v1`
- **Frontend URL:** `https://main.d9615h0u1yd6d.amplifyapp.com`

---

## 💡 Alternative: Use Route 53 Alias Record (Recommended)

If using Route 53, you can use an **Alias record** instead of CNAME for better performance:

1. **Create Alias Record**
   - **Record name:** `api`
   - **Record type:** A (IPv4)
   - **Alias:** Yes
   - **Alias target:** Select your ALB from the dropdown
   - **Routing policy:** Simple routing
   - Click **"Create records"**

Alias records are:
- ✅ Free (no queries)
- ✅ Faster (no CNAME lookup)
- ✅ Can be used at root domain (CNAME can't)

---

**Last Updated:** November 13, 2025

