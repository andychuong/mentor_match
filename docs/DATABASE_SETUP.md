# Database Setup Guide - Getting Your DATABASE_URL

## 🗄️ Where to Get DATABASE_URL

You need to create a **PostgreSQL database** on AWS RDS (Relational Database Service). Here's how:

---

## Step 1: Create RDS PostgreSQL Instance

### In AWS Console:

1. **Go to RDS Console**
   - Search for "RDS" in AWS Console
   - Click **"Databases"** in the left sidebar
   - Click **"Create database"**

2. **Choose Configuration:**
   - **Engine:** PostgreSQL
   - **Version:** Latest (e.g., PostgreSQL 15.x or 16.x)
   - **Template:** 
     - For **testing/demos:** Choose **"Free tier"** (750 hours/month free for 12 months)
     - For **production:** Choose **"Production"** or **"Dev/Test"**

3. **Settings:**
   - **DB instance identifier:** `office-hours-db` (or your preferred name)
   - **Master username:** `postgres` (or your choice - remember this!)
   - **Master password:** Create a strong password (save this securely!)
     - ⚠️ **Important:** You'll need this password for the DATABASE_URL

4. **Instance Configuration:**
   - **DB instance class:** 
     - Free tier: `db.t3.micro` or `db.t2.micro`
     - Production: `db.t3.small` or larger

5. **Storage:**
   - **Storage type:** General Purpose SSD (gp3)
   - **Allocated storage:** 20 GB (free tier) or more

6. **Connectivity:**
   - **VPC:** Select the same VPC as your ECS/EC2 backend
   - **Subnet group:** Default or create new
   - **Public access:** 
     - ✅ **Yes** (if backend is outside VPC or for testing)
     - ❌ **No** (more secure, requires backend in same VPC)
   - **VPC security group:** Create new or use existing
     - **Important:** Allow inbound PostgreSQL (port 5432) from:
       - Your backend security group (recommended)
       - OR your IP address (for testing)

7. **Database authentication:** Password authentication

8. **Additional configuration (optional):**
   - **Initial database name:** `officehours` (or leave as `postgres`)
   - **Backup retention:** 7 days (or your preference)

9. **Click "Create database"**

10. **Wait 5-10 minutes** for the database to be created

---

## Step 2: Get Your Database Endpoint

Once the database status shows **"Available"**:

1. **Go to your database** in RDS Console
2. Click on your database name (e.g., `office-hours-db`)
3. Scroll to **"Connectivity & security"** section
4. Find **"Endpoint"** - it looks like:
   ```
   office-hours-db.xxxxx.us-east-1.rds.amazonaws.com
   ```
5. **Copy this endpoint** - you'll need it!

**Also note:**
- **Port:** Usually `5432` (shown in the same section)
- **Username:** The master username you set (e.g., `postgres`)
- **Password:** The master password you created
- **Database name:** Usually `postgres` (or the initial database name you set)

---

## Step 3: Construct Your DATABASE_URL

The DATABASE_URL format is:
```
postgresql://[username]:[password]@[endpoint]:[port]/[database]
```

### Example:
```
postgresql://postgres:MySecurePassword123@office-hours-db.xxxxx.us-east-1.rds.amazonaws.com:5432/postgres
```

### Breaking it down:
- `postgresql://` - Protocol
- `postgres` - Username (your master username)
- `MySecurePassword123` - Password (your master password)
- `office-hours-db.xxxxx.us-east-1.rds.amazonaws.com` - Endpoint (from RDS)
- `5432` - Port (usually 5432)
- `postgres` - Database name (default is `postgres`)

---

## Step 4: Test Your Connection

### Option 1: Using psql (Command Line)

If you have PostgreSQL client installed:

```bash
psql -h office-hours-db.xxxxx.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d postgres \
     -p 5432
```

Enter your password when prompted.

### Option 2: Using Prisma (Recommended)

In your backend directory:

```bash
cd backend

# Set DATABASE_URL temporarily
export DATABASE_URL="postgresql://postgres:password@endpoint:5432/postgres"

# Test connection
npx prisma db pull

# Or run migrations
npx prisma migrate deploy
```

### Option 3: Using AWS RDS Query Editor

1. Go to your RDS database
2. Click **"Query Editor"** (if available)
3. Enter your credentials
4. Run a test query: `SELECT version();`

---

## Step 5: Run Database Migrations

Once connected, set up your database schema:

```bash
cd backend

# Set DATABASE_URL in environment or .env file
export DATABASE_URL="postgresql://postgres:password@endpoint:5432/postgres"

# Run Prisma migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

---

## 🔒 Security Best Practices

### 1. Use Security Groups Properly

**Recommended:** Only allow connections from your backend security group:

1. Go to your RDS database → **"Connectivity & security"**
2. Click on the **Security group** link
3. **Edit inbound rules**
4. Add rule:
   - **Type:** PostgreSQL
   - **Port:** 5432
   - **Source:** Select your backend security group (not "Anywhere")

### 2. Use Parameter Store or Secrets Manager

Instead of hardcoding DATABASE_URL, store it in AWS Systems Manager Parameter Store:

```bash
# Store in Parameter Store
aws ssm put-parameter \
  --name "/office-hours/database-url" \
  --value "postgresql://postgres:password@endpoint:5432/postgres" \
  --type "SecureString"
```

Then reference it in your ECS Task Definition:
- **Key:** `DATABASE_URL`
- **ValueFrom:** `arn:aws:ssm:us-east-1:ACCOUNT_ID:parameter/office-hours/database-url`

### 3. Use Different Databases for Different Environments

- **Development:** `office-hours-dev.xxxxx.rds.amazonaws.com`
- **Staging:** `office-hours-staging.xxxxx.rds.amazonaws.com`
- **Production:** `office-hours-prod.xxxxx.rds.amazonaws.com`

---

## 📋 Quick Reference: What You Need

When creating your RDS instance, make sure to save:

- ✅ **Endpoint:** `office-hours-db.xxxxx.us-east-1.rds.amazonaws.com`
- ✅ **Port:** `5432` (default)
- ✅ **Username:** `postgres` (or your choice)
- ✅ **Password:** `YourSecurePassword` (save this!)
- ✅ **Database name:** `postgres` (or your choice)

Then construct:
```
DATABASE_URL=postgresql://[username]:[password]@[endpoint]:[port]/[database]
```

---

## 🐛 Troubleshooting

### Issue: "Connection timeout"

**Solutions:**
1. Check RDS security group allows connections from your IP/backend
2. Verify database is in "Available" state (not "Creating" or "Modifying")
3. Check if "Public access" is enabled (if connecting from outside VPC)

### Issue: "Password authentication failed"

**Solutions:**
1. Verify username and password are correct
2. Check for special characters in password (may need URL encoding)
3. Try resetting the master password in RDS Console

### Issue: "Database does not exist"

**Solutions:**
1. Use the default database name: `postgres`
2. Or create a new database: `CREATE DATABASE officehours;`
3. Update DATABASE_URL to use the correct database name

### Issue: "Connection refused"

**Solutions:**
1. Verify port is correct (usually 5432)
2. Check security group allows inbound on port 5432
3. Ensure database is in the same VPC (if using private access)

---

## 💰 Cost Considerations

### Free Tier (First 12 Months)
- **db.t2.micro** or **db.t3.micro**: 750 hours/month free
- **20 GB storage**: Free
- **20 GB backup storage**: Free

### After Free Tier
- **db.t3.micro**: ~$15-20/month
- **db.t3.small**: ~$30-40/month
- **Storage**: ~$0.115/GB/month
- **Backups**: ~$0.095/GB/month

**Tip:** For demos/testing, use the free tier and stop the instance when not in use to save hours.

---

## 📝 Example: Complete Setup

Here's a complete example:

1. **Create RDS instance:**
   - Name: `office-hours-db`
   - Username: `postgres`
   - Password: `MySecurePass123!`
   - Database: `postgres`

2. **Get endpoint:**
   ```
   office-hours-db.abc123xyz.us-east-1.rds.amazonaws.com
   ```

3. **Construct DATABASE_URL:**
   ```
   DATABASE_URL=postgresql://postgres:MySecurePass123!@office-hours-db.abc123xyz.us-east-1.rds.amazonaws.com:5432/postgres
   ```

4. **Set in ECS Task Definition:**
   - **Key:** `DATABASE_URL`
   - **Value:** `postgresql://postgres:MySecurePass123!@office-hours-db.abc123xyz.us-east-1.rds.amazonaws.com:5432/postgres`

5. **Test connection:**
   ```bash
   npx prisma migrate deploy
   ```

---

## 🔗 Additional Resources

- [AWS RDS PostgreSQL Getting Started](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_GettingStarted.CreatingConnecting.PostgreSQL.html)
- [Prisma Database Connection](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [RDS Security Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.html)



