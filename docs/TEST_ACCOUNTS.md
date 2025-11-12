# Test Accounts Reference

This document contains all test account credentials for the Capital Factory Office Hours Matching Tool.

## 🔐 Account Credentials

### 👨‍🏫 Mentors (3 accounts)

#### Mentor 1: Sarah Chen
- **Email:** `mentor1@test.com`
- **Password:** `mentor123`
- **Role:** Mentor
- **Name:** Sarah Chen
- **Bio:** Experienced product manager with 15+ years in SaaS. Specialized in go-to-market strategies, product-market fit, and scaling B2B products. Former VP of Product at multiple successful startups.
- **Expertise Areas:**
  - Product Management
  - Go-to-Market
  - B2B SaaS
  - Product-Market Fit
- **Industry Focus:**
  - SaaS
  - Enterprise Software
  - B2B
- **Availability:**
  - Monday: 10:00 AM - 12:00 PM (CT)
  - Wednesday: 10:00 AM - 12:00 PM (CT)
  - Friday: 10:00 AM - 12:00 PM (CT)

#### Mentor 2: Michael Rodriguez
- **Email:** `mentor2@test.com`
- **Password:** `mentor123`
- **Role:** Mentor
- **Name:** Michael Rodriguez
- **Bio:** Serial entrepreneur and investor. Founded 3 companies, 2 successful exits. Expert in fundraising, business development, and early-stage startup strategy. Active angel investor in 50+ startups.
- **Expertise Areas:**
  - Fundraising
  - Business Development
  - Startup Strategy
  - Angel Investing
- **Industry Focus:**
  - FinTech
  - E-commerce
  - Marketplace
- **Availability:**
  - Tuesday: 2:00 PM - 4:00 PM (CT)
  - Thursday: 2:00 PM - 4:00 PM (CT)

#### Mentor 3: Dr. Emily Watson
- **Email:** `mentor3@test.com`
- **Password:** `mentor123`
- **Role:** Mentor
- **Name:** Dr. Emily Watson
- **Bio:** Technical co-founder and CTO with deep expertise in AI/ML, cloud infrastructure, and engineering leadership. Built and scaled engineering teams from 0 to 100+. Expert in technical architecture and hiring.
- **Expertise Areas:**
  - AI/ML
  - Cloud Infrastructure
  - Engineering Leadership
  - Technical Architecture
- **Industry Focus:**
  - AI
  - DeepTech
  - Enterprise Software
- **Availability:**
  - Monday: 9:00 AM - 11:00 AM (CT)
  - Wednesday: 9:00 AM - 11:00 AM (CT)

---

### 👨‍💼 Mentees (2 accounts)

#### Mentee 1: Alex Johnson
- **Email:** `mentee1@test.com`
- **Password:** `mentee123`
- **Role:** Mentee
- **Name:** Alex Johnson
- **Bio:** Founder of a B2B SaaS startup focused on project management tools. Currently in early stage, looking for guidance on product-market fit and go-to-market strategy.
- **Industry Focus:**
  - SaaS
  - B2B
  - Project Management
- **Startup Stage:** Early

#### Mentee 2: Jordan Lee
- **Email:** `mentee2@test.com`
- **Password:** `mentee123`
- **Role:** Mentee
- **Name:** Jordan Lee
- **Bio:** Co-founder of an AI-powered analytics platform. Pre-seed stage, seeking advice on fundraising and technical architecture for scaling ML infrastructure.
- **Industry Focus:**
  - AI
  - Analytics
  - B2B
- **Startup Stage:** Pre-seed

---

### 👨‍💻 Admin (1 account)

#### Admin User
- **Email:** `admin@test.com`
- **Password:** `admin123`
- **Role:** Admin
- **Name:** Admin User
- **Bio:** Platform administrator for Capital Factory Office Hours Matching Tool.

---

## 🎯 Demo Scenarios

### Scenario 1: Product Management Match
**Use Case:** Mentee looking for product management guidance
- **Login as:** `mentee1@test.com` (Alex Johnson - B2B SaaS, Early Stage)
- **Best Match:** `mentor1@test.com` (Sarah Chen - Product Management, B2B SaaS)
- **Why:** Both focus on B2B SaaS, mentee is early stage and needs product-market fit guidance

### Scenario 2: Fundraising Match
**Use Case:** Mentee looking for fundraising advice
- **Login as:** `mentee2@test.com` (Jordan Lee - AI, Pre-seed)
- **Best Match:** `mentor2@test.com` (Michael Rodriguez - Fundraising, Startup Strategy)
- **Why:** Mentee is pre-seed and needs fundraising guidance

### Scenario 3: Technical Architecture Match
**Use Case:** Mentee looking for technical expertise
- **Login as:** `mentee2@test.com` (Jordan Lee - AI, Pre-seed)
- **Best Match:** `mentor3@test.com` (Dr. Emily Watson - AI/ML, Technical Architecture)
- **Why:** Both focus on AI, mentee needs technical architecture for ML infrastructure

---

## 📝 Quick Login Reference

| Role | Email | Password |
|------|-------|----------|
| Mentor 1 | mentor1@test.com | mentor123 |
| Mentor 2 | mentor2@test.com | mentor123 |
| Mentor 3 | mentor3@test.com | mentor123 |
| Mentee 1 | mentee1@test.com | mentee123 |
| Mentee 2 | mentee2@test.com | mentee123 |
| Admin | admin@test.com | admin123 |

---

## 🔄 Regenerating Test Data

To regenerate all test data, run:

```bash
cd backend
npm run db:seed
```

This will:
- Clean up existing test accounts (by email)
- Create fresh test accounts
- Set up availability slots for mentors
- Create notification preferences for all users
- **Create demo sessions** (pending, confirmed, completed, cancelled)
- **Create feedback** for completed sessions
- **Create favorite mentor relationships**
- **Create notifications** (confirmations, reminders, requests)

**Note:** The seed script only deletes accounts with the test email addresses listed above. It will not affect other accounts in the database.

## 📊 Demo Data Created

### Sessions (8 total)
- **2 Pending Sessions:** Waiting for mentor confirmation
  - Alex → Sarah (Product-Market Fit Strategy, next week)
  - Jordan → Michael (Fundraising Strategy, next week)
- **3 Confirmed Sessions:** Upcoming sessions
  - Alex → Sarah (Go-to-Market Strategy, tomorrow 10:30am) - with Google Meet link
  - Jordan → Dr. Emily (Scaling ML Infrastructure, tomorrow 9am) - with Google Meet link
  - Alex → Michael (Business Development Partnerships, next week 2:30pm)
- **3 Completed Sessions:** With feedback
  - Alex → Sarah (Product Roadmap Planning, 1 week ago) - 5 stars
  - Jordan → Dr. Emily (AI/ML Architecture Review, 3 days ago) - 5 stars
  - Alex → Michael (Early Stage Fundraising, 2 weeks ago) - 4 stars
- **1 Cancelled Session:**
  - Alex → Dr. Emily (Technical Architecture Discussion, 1 week ago)

### Feedback (3 entries)
All completed sessions have detailed feedback with ratings (4-5 stars), written comments, topics covered, and helpfulness ratings.

### Favorite Mentors (3 relationships)
- Alex favorited: Sarah Chen & Michael Rodriguez
- Jordan favorited: Dr. Emily Watson

### Notifications
- Mix of read/unread notifications
- Session confirmations
- Session reminders
- Session requests
- Distributed across mentees and mentors

---

## 📅 Availability Summary

All mentors have recurring availability slots set up for the next 30 days:

- **Mentor 1 (Sarah Chen):** Mon, Wed, Fri 10am-12pm CT
- **Mentor 2 (Michael Rodriguez):** Tue, Thu 2pm-4pm CT
- **Mentor 3 (Dr. Emily Watson):** Mon, Wed 9am-11am CT

---

**Last Updated:** [Date when seed was run]  
**Seed Script:** `backend/prisma/seed.ts`

