# Getting Backend URL from ECS v2

## 🎯 Quick Answer

Your backend URL comes from the **Application Load Balancer (ALB)** connected to your ECS service.

---

## 📍 Method 1: From ECS Service (Easiest)

### In ECS v2 Console:

1. **Go to ECS Console**
   - Navigate to **Clusters** → Select your cluster (e.g., `office-hours-cluster`)

2. **Open Your Service**
   - Click on **Services** tab
   - Click on your service name (e.g., `office-hours-backend-service`)

3. **Find Load Balancer**
   - Scroll down to the **"Networking"** section
   - Look for **"Load balancer"** or **"Load balancer target group"**
   - Click on the load balancer name (it will be a link)

4. **Get DNS Name**
   - You'll be taken to the EC2 Load Balancers page
   - Copy the **DNS name** (e.g., `office-hours-alb-1234567890.us-east-1.elb.amazonaws.com`)

5. **Construct Backend URL**
   ```
   http://office-hours-alb-1234567890.us-east-1.elb.amazonaws.com/api/v1
   ```

---

## 📍 Method 2: Direct from EC2 Load Balancers

### In EC2 Console:

1. **Go to EC2 Console**
   - Search for "EC2" in AWS Console
   - Click **"Load Balancers"** in the left sidebar

2. **Find Your Load Balancer**
   - Look for your ALB (e.g., `office-hours-alb`)
   - Click on it

3. **Copy DNS Name**
   - At the top, you'll see **"DNS name"**
   - Copy it (e.g., `office-hours-alb-1234567890.us-east-1.elb.amazonaws.com`)

4. **Construct Backend URL**
   ```
   http://office-hours-alb-1234567890.us-east-1.elb.amazonaws.com/api/v1
   ```

---

## 📍 Method 3: From ECS Service Details (Alternative)

### In ECS v2 Console:

1. **Go to Your Service**
   - Clusters → Your Cluster → Services → Your Service

2. **Check Service Details**
   - Look at the **"Configuration"** tab
   - Scroll to **"Load balancing"** section
   - You should see the load balancer ARN or name

3. **Or Check Task Definition**
   - Go to **Task Definitions** → Your Task Definition
   - Check if load balancer is configured there

---

## 🔍 If You Don't Have a Load Balancer

If your ECS service doesn't have a load balancer attached, you have two options:

### Option A: Add a Load Balancer (Recommended)

1. **Edit Your Service**
   - Go to your ECS service
   - Click **"Update"** or **"Edit"**
   - Scroll to **"Load balancing"** section
   - Click **"Add load balancer"**
   - Select **"Application Load Balancer"**
   - Create a new ALB or select existing
   - Configure:
     - **Container to load balance:** Select your container
     - **Listener port:** `80` (HTTP) or `443` (HTTPS)
     - **Target group:** Create new or use existing
   - Save and update

2. **Wait for Service Update**
   - Service will update (takes a few minutes)
   - Then follow Method 1 or 2 above to get the DNS name

### Option B: Use Service Discovery (Advanced)

If using ECS Service Discovery, your backend URL would be:
```
http://<service-name>.<namespace>:8000/api/v1
```

But this requires additional setup and is less common.

---

## ✅ Verify Your Backend URL

Once you have the URL, test it:

```bash
# Test health endpoint
curl http://office-hours-alb-1234567890.us-east-1.elb.amazonaws.com/api/v1/health

# Should return something like:
# {"success":true,"data":{"status":"ok"}}
```

---

## 🔧 Set in AWS Amplify

After getting your backend URL:

1. **Go to Amplify Console**
   - Select your app → **App settings** → **Environment variables**

2. **Add/Update Variable**
   - **Key:** `VITE_API_URL`
   - **Value:** `http://<your-alb-dns-name>/api/v1`
   - Example: `http://office-hours-alb-1234567890.us-east-1.elb.amazonaws.com/api/v1`

3. **Save and Redeploy**
   - Click **"Save"**
   - Trigger a new deployment if needed

---

## 📋 Quick Checklist

- [ ] ECS service is running and healthy
- [ ] Load balancer is attached to the service
- [ ] Load balancer target group shows healthy targets
- [ ] Copied ALB DNS name
- [ ] Constructed URL with `/api/v1` suffix
- [ ] Tested backend URL with curl
- [ ] Set `VITE_API_URL` in Amplify
- [ ] Verified CORS allows Amplify domain

---

## 🐛 Troubleshooting

### Issue: Can't find load balancer in service

**Solution:**
- Your service might not have a load balancer configured
- Go to service → **Update** → Add load balancer
- Or check if you're using a Network Load Balancer (NLB) instead of ALB

### Issue: Load balancer shows unhealthy targets

**Solution:**
1. Check ECS service logs in CloudWatch
2. Verify security group allows traffic on port 8000
3. Check target group health checks are configured correctly
4. Verify backend is listening on port 8000

### Issue: Backend URL returns 502/503

**Solution:**
1. Check if ECS tasks are running: Service → **Tasks** tab
2. Check task logs in CloudWatch
3. Verify environment variables are set correctly
4. Check security group allows ALB to reach tasks

### Issue: CORS errors from frontend

**Solution:**
1. Update backend `FRONTEND_URL` environment variable to include Amplify domain
2. Verify CORS configuration in `backend/src/index.ts`
3. Check backend logs for CORS-related errors

---

## 🔗 Example: Complete Flow

1. **ECS Service:** `office-hours-backend-service`
2. **Load Balancer:** `office-hours-alb`
3. **ALB DNS:** `office-hours-alb-1234567890.us-east-1.elb.amazonaws.com`
4. **Backend URL:** `http://office-hours-alb-1234567890.us-east-1.elb.amazonaws.com/api/v1`
5. **Set in Amplify:** `VITE_API_URL=http://office-hours-alb-1234567890.us-east-1.elb.amazonaws.com/api/v1`

---

## 💡 Pro Tips

1. **Use HTTPS (Recommended)**
   - Set up SSL certificate in ALB
   - Use `https://` instead of `http://`
   - Update listener to port 443

2. **Custom Domain**
   - Point your domain to ALB DNS
   - Use `https://api.yourdomain.com/api/v1`

3. **Health Checks**
   - Ensure `/api/v1/health` endpoint works
   - Configure ALB health checks to use this endpoint

4. **Multiple Environments**
   - Dev: `http://dev-alb-xxx.elb.amazonaws.com/api/v1`
   - Staging: `http://staging-alb-xxx.elb.amazonaws.com/api/v1`
   - Prod: `https://api.yourdomain.com/api/v1`



