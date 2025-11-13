# HTTPS Quick Start Guide

## 🚀 Fastest Path to Fix Mixed Content Error

### Option 1: Use ACM Certificate (Recommended - 15-30 minutes)

#### Step 1: Request Certificate (5 minutes)

1. **Go to AWS Certificate Manager**
   - [ACM Console - us-east-2](https://us-east-2.console.aws.amazon.com/acm/home?region=us-east-2)
   - Click **"Request certificate"**
   - Select **"Request a public certificate"**
   - **Domain name:** Enter your domain (e.g., `api.yourdomain.com`) OR use ALB DNS name
   - **Validation method:** DNS validation
   - Click **"Request"**

2. **Validate Certificate** (5-30 minutes)
   - ACM will show DNS records to add
   - Add CNAME records to your DNS provider
   - Wait for validation (check status in ACM console)

#### Step 2: Run Setup Script (2 minutes)

```bash
cd docs
./setup-alb-https.sh
```

When prompted, enter your certificate ARN from Step 1.

#### Step 3: Update Amplify (1 minute)

1. Go to [Amplify Console](https://console.aws.amazon.com/amplify)
2. Select your app → **App settings** → **Environment variables**
3. Update `VITE_API_URL` to: `https://office-hours-alb-2030945038.us-east-2.elb.amazonaws.com/api/v1`
4. Click **"Save"** (triggers auto-deployment)

#### Step 4: Test (1 minute)

```bash
# Test backend
curl https://office-hours-alb-2030945038.us-east-2.elb.amazonaws.com/api/v1/health

# Test frontend
# Go to: https://main.d9615h0u1yd6d.amplifyapp.com/login
# Login: mentee1@test.com / mentee123
```

---

### Option 2: Manual AWS Console Setup (10 minutes)

If you prefer using the AWS Console:

1. **Request Certificate in ACM** (see Option 1, Step 1)

2. **Add HTTPS Listener to ALB**
   - Go to [EC2 Load Balancers](https://us-east-2.console.aws.amazon.com/ec2/v2/home?region=us-east-2#LoadBalancers:)
   - Select `office-hours-alb`
   - Click **"Listeners"** tab
   - Click **"Add listener"**
   - **Protocol:** HTTPS
   - **Port:** 443
   - **Default action:** Forward to `office-hours-backend-tg`
   - **Certificate:** Select your ACM certificate
   - Click **"Add"**

3. **Update Security Group**
   - Go to [EC2 Security Groups](https://us-east-2.console.aws.amazon.com/ec2/v2/home?region=us-east-2#SecurityGroups:)
   - Find `office-hours-alb-sg`
   - Click **"Edit inbound rules"**
   - **Add rule:**
     - Type: HTTPS
     - Port: 443
     - Source: 0.0.0.0/0
   - Click **"Save rules"**

4. **Update Amplify** (see Option 1, Step 3)

---

### Option 3: Temporary Workaround (Testing Only - 1 minute)

**⚠️ Warning:** This is NOT a production solution. Only for immediate testing.

1. **Allow Mixed Content in Browser**
   - Chrome: Click lock icon → Site settings → Allow insecure content
   - Firefox: Click shield icon → Disable protection for this site
   - Safari: Develop menu → Disable Cross-Origin Restrictions

2. **Test Login**
   - Go to: https://main.d9615h0u1yd6d.amplifyapp.com/login
   - Login should work (but browser will show warnings)

**Note:** This workaround only works for your browser. Other users will still see errors.

---

## 🔍 Current Configuration

- **Frontend:** `https://main.d9615h0u1yd6d.amplifyapp.com` ✅ HTTPS
- **Backend:** `http://office-hours-alb-2030945038.us-east-2.elb.amazonaws.com` ❌ HTTP
- **Target:** `https://office-hours-alb-2030945038.us-east-2.elb.amazonaws.com` ✅ HTTPS

---

## 📋 Checklist

- [ ] Certificate requested in ACM (us-east-2)
- [ ] Certificate validated (status: Issued)
- [ ] HTTPS listener added to ALB (port 443)
- [ ] Security group allows HTTPS (port 443)
- [ ] `VITE_API_URL` updated in Amplify to HTTPS
- [ ] Amplify deployment completed
- [ ] Backend accessible via HTTPS
- [ ] Frontend login works

---

## 🆘 Need Help?

See detailed guide: [ALB_HTTPS_SETUP.md](./ALB_HTTPS_SETUP.md)

---

**Last Updated:** November 13, 2025

