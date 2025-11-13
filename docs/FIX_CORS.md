# Fix CORS Error

## 🐛 Problem

CORS error: `The 'Access-Control-Allow-Origin' header has a value 'https://main.d9615h0u1yd6d.amplifyapp.com/' that is not equal to the supplied origin.`

The backend `FRONTEND_URL` environment variable has a trailing slash, but the actual origin doesn't.

## ✅ Solution: Update ECS Task Definition

### Step 1: Update FRONTEND_URL Environment Variable

1. **Go to ECS Console**
   - Navigate to [ECS Console](https://us-east-2.console.aws.amazon.com/ecs/v2/clusters)
   - Select cluster: `office-hours-cluster`
   - Go to **Task Definitions** tab
   - Find: `office-hours-backend`
   - Click on the latest revision

2. **Create New Revision**
   - Click **"Create new revision"**
   - Scroll to **"Environment variables"** section
   - Find `FRONTEND_URL`
   - Update value to: `https://main.d9615h0u1yd6d.amplifyapp.com` (NO trailing slash)
   - Click **"Create"**

3. **Update Service**
   - Go back to **Services** tab
   - Select: `office-hours-backend-service`
   - Click **"Update"**
   - Under **"Task definition"**, select the new revision you just created
   - Click **"Update"**
   - Wait for service to update (2-3 minutes)

### Step 2: Verify

After the service updates, test again:
- Go to: `https://main.d9615h0u1yd6d.amplifyapp.com/login`
- Login should work without CORS errors

---

## 🔧 Alternative: Update CORS to Handle Multiple Origins

If you want to support multiple frontend URLs, update the backend CORS configuration:

```typescript
// backend/src/index.ts
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'https://main.d9615h0u1yd6d.amplifyapp.com',
        'http://localhost:3000', // for local development
      ];
      
      // Remove trailing slashes for comparison
      const normalizedOrigin = origin?.replace(/\/$/, '');
      const normalizedAllowed = allowedOrigins.map(o => o.replace(/\/$/, ''));
      
      if (!origin || normalizedAllowed.includes(normalizedOrigin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
```

Then rebuild and redeploy the backend.

---

## 📋 Quick Fix Checklist

- [ ] Update ECS Task Definition: `FRONTEND_URL=https://main.d9615h0u1yd6d.amplifyapp.com` (no trailing slash)
- [ ] Create new task definition revision
- [ ] Update ECS service to use new revision
- [ ] Wait for service to update (2-3 minutes)
- [ ] Test frontend login

---

**Last Updated:** November 13, 2025

