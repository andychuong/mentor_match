import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Hash password function
  const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, 10);
  };

  // Clear existing test data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning up existing test data...');
  await prisma.favoriteMentor.deleteMany({});
  await prisma.feedback.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.availability.deleteMany({});
  await prisma.notificationPreference.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          'mentor1@test.com',
          'mentor2@test.com',
          'mentor3@test.com',
          'mentee1@test.com',
          'mentee2@test.com',
          'admin@test.com',
        ],
      },
    },
  });

  // Create 3 Mentors
  console.log('👨‍🏫 Creating mentors...');

  const mentor1Password = await hashPassword('mentor123');
  const mentor1 = await prisma.user.create({
    data: {
      email: 'mentor1@test.com',
      passwordHash: mentor1Password,
      role: 'mentor',
      name: 'Sarah Chen',
      bio: 'Experienced product manager with 15+ years in SaaS. Specialized in go-to-market strategies, product-market fit, and scaling B2B products. Former VP of Product at multiple successful startups.',
      expertiseAreas: ['Product Management', 'Go-to-Market', 'B2B SaaS', 'Product-Market Fit'],
      industryFocus: ['SaaS', 'Enterprise Software', 'B2B'],
      startupStage: null, // Mentors don't have startup stage
      airtableSyncStatus: 'synced',
      isActive: true,
    },
  });

  const mentor2Password = await hashPassword('mentor123');
  const mentor2 = await prisma.user.create({
    data: {
      email: 'mentor2@test.com',
      passwordHash: mentor2Password,
      role: 'mentor',
      name: 'Michael Rodriguez',
      bio: 'Serial entrepreneur and investor. Founded 3 companies, 2 successful exits. Expert in fundraising, business development, and early-stage startup strategy. Active angel investor in 50+ startups.',
      expertiseAreas: ['Fundraising', 'Business Development', 'Startup Strategy', 'Angel Investing'],
      industryFocus: ['FinTech', 'E-commerce', 'Marketplace'],
      startupStage: null,
      airtableSyncStatus: 'synced',
      isActive: true,
    },
  });

  const mentor3Password = await hashPassword('mentor123');
  const mentor3 = await prisma.user.create({
    data: {
      email: 'mentor3@test.com',
      passwordHash: mentor3Password,
      role: 'mentor',
      name: 'Dr. Emily Watson',
      bio: 'Technical co-founder and CTO with deep expertise in AI/ML, cloud infrastructure, and engineering leadership. Built and scaled engineering teams from 0 to 100+. Expert in technical architecture and hiring.',
      expertiseAreas: ['AI/ML', 'Cloud Infrastructure', 'Engineering Leadership', 'Technical Architecture'],
      industryFocus: ['AI', 'DeepTech', 'Enterprise Software'],
      startupStage: null,
      airtableSyncStatus: 'synced',
      isActive: true,
    },
  });

  console.log('✅ Created 3 mentors');

  // Create 2 Mentees
  console.log('👨‍💼 Creating mentees...');

  const mentee1Password = await hashPassword('mentee123');
  const mentee1 = await prisma.user.create({
    data: {
      email: 'mentee1@test.com',
      passwordHash: mentee1Password,
      role: 'mentee',
      name: 'Alex Johnson',
      bio: 'Founder of a B2B SaaS startup focused on project management tools. Currently in early stage, looking for guidance on product-market fit and go-to-market strategy.',
      expertiseAreas: [],
      industryFocus: ['SaaS', 'B2B', 'Project Management'],
      startupStage: 'early',
      airtableSyncStatus: 'synced',
      isActive: true,
    },
  });

  const mentee2Password = await hashPassword('mentee123');
  const mentee2 = await prisma.user.create({
    data: {
      email: 'mentee2@test.com',
      passwordHash: mentee2Password,
      role: 'mentee',
      name: 'Jordan Lee',
      bio: 'Co-founder of an AI-powered analytics platform. Pre-seed stage, seeking advice on fundraising and technical architecture for scaling ML infrastructure.',
      expertiseAreas: [],
      industryFocus: ['AI', 'Analytics', 'B2B'],
      startupStage: 'pre-seed',
      airtableSyncStatus: 'synced',
      isActive: true,
    },
  });

  console.log('✅ Created 2 mentees');

  // Create 1 Admin
  console.log('👨‍💻 Creating admin...');

  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      passwordHash: adminPassword,
      role: 'admin',
      name: 'Admin User',
      bio: 'Platform administrator for Capital Factory Office Hours Matching Tool.',
      expertiseAreas: [],
      industryFocus: [],
      startupStage: null,
      airtableSyncStatus: 'synced',
      isActive: true,
    },
  });

  console.log('✅ Created 1 admin');

  // Create Availability Slots for Mentors
  console.log('📅 Creating availability slots...');

  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Mentor 1: Available Monday, Wednesday, Friday 10am-12pm
  await prisma.availability.createMany({
    data: [
      {
        mentorId: mentor1.id,
        dayOfWeek: 1, // Monday
        startTime: '10:00',
        endTime: '12:00',
        timezone: 'America/Chicago',
        isRecurring: true,
        validFrom: now,
        validUntil: nextMonth,
      },
      {
        mentorId: mentor1.id,
        dayOfWeek: 3, // Wednesday
        startTime: '10:00',
        endTime: '12:00',
        timezone: 'America/Chicago',
        isRecurring: true,
        validFrom: now,
        validUntil: nextMonth,
      },
      {
        mentorId: mentor1.id,
        dayOfWeek: 5, // Friday
        startTime: '10:00',
        endTime: '12:00',
        timezone: 'America/Chicago',
        isRecurring: true,
        validFrom: now,
        validUntil: nextMonth,
      },
    ],
  });

  // Mentor 2: Available Tuesday, Thursday 2pm-4pm
  await prisma.availability.createMany({
    data: [
      {
        mentorId: mentor2.id,
        dayOfWeek: 2, // Tuesday
        startTime: '14:00',
        endTime: '16:00',
        timezone: 'America/Chicago',
        isRecurring: true,
        validFrom: now,
        validUntil: nextMonth,
      },
      {
        mentorId: mentor2.id,
        dayOfWeek: 4, // Thursday
        startTime: '14:00',
        endTime: '16:00',
        timezone: 'America/Chicago',
        isRecurring: true,
        validFrom: now,
        validUntil: nextMonth,
      },
    ],
  });

  // Mentor 3: Available Monday, Wednesday 9am-11am
  await prisma.availability.createMany({
    data: [
      {
        mentorId: mentor3.id,
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '11:00',
        timezone: 'America/Chicago',
        isRecurring: true,
        validFrom: now,
        validUntil: nextMonth,
      },
      {
        mentorId: mentor3.id,
        dayOfWeek: 3, // Wednesday
        startTime: '09:00',
        endTime: '11:00',
        timezone: 'America/Chicago',
        isRecurring: true,
        validFrom: now,
        validUntil: nextMonth,
      },
    ],
  });

  console.log('✅ Created availability slots');

  // Create Notification Preferences for all users
  console.log('🔔 Creating notification preferences...');

  const userIds = [mentor1.id, mentor2.id, mentor3.id, mentee1.id, mentee2.id, admin.id];
  await prisma.notificationPreference.createMany({
    data: userIds.map((userId) => ({
      userId,
      emailEnabled: true,
      emailSessionConfirmation: true,
      emailSessionReminder: true,
      emailSessionCancellation: true,
      emailSessionRequest: true,
      emailFeedbackConfirmation: true,
      smsEnabled: false,
      smsSessionReminder: false,
    })),
  });

  console.log('✅ Created notification preferences');

  // Create Sessions for Demo
  console.log('📅 Creating sessions...');

  // Reuse now and nextWeek from availability section, calculate additional dates
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  // Helper to create a date at a specific time
  const createDateTime = (date: Date, hours: number, minutes: number = 0): Date => {
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  };

  // 1. PENDING SESSIONS (waiting for mentor confirmation)
  const pendingSession1 = await prisma.session.create({
    data: {
      mentorId: mentor1.id,
      menteeId: mentee1.id,
      scheduledAt: createDateTime(nextWeek, 10, 0), // Next Monday 10am
      durationMinutes: 60,
      status: 'pending',
      topic: 'Product-Market Fit Strategy',
      notes: 'Looking for guidance on validating product-market fit for our B2B SaaS project management tool.',
      matchScore: 85.5,
    },
  });

  const pendingSession2 = await prisma.session.create({
    data: {
      mentorId: mentor2.id,
      menteeId: mentee2.id,
      scheduledAt: createDateTime(nextWeek, 14, 0), // Next Tuesday 2pm
      durationMinutes: 60,
      status: 'pending',
      topic: 'Fundraising Strategy for Pre-seed Round',
      notes: 'Need advice on preparing for our pre-seed fundraising round and identifying the right investors.',
      matchScore: 78.2,
    },
  });

  // 2. CONFIRMED SESSIONS (upcoming)
  const confirmedSession1 = await prisma.session.create({
    data: {
      mentorId: mentor1.id,
      menteeId: mentee1.id,
      scheduledAt: createDateTime(tomorrow, 10, 30), // Tomorrow 10:30am
      durationMinutes: 60,
      status: 'confirmed',
      topic: 'Go-to-Market Strategy',
      notes: 'Deep dive into GTM strategy for B2B SaaS launch.',
      matchScore: 88.0,
      googleMeetLink: 'https://meet.google.com/abc-defg-hij',
    },
  });

  const confirmedSession2 = await prisma.session.create({
    data: {
      mentorId: mentor3.id,
      menteeId: mentee2.id,
      scheduledAt: createDateTime(tomorrow, 9, 0), // Tomorrow 9am
      durationMinutes: 60,
      status: 'confirmed',
      topic: 'Scaling ML Infrastructure',
      notes: 'Discussion on technical architecture for scaling our ML analytics platform.',
      matchScore: 92.5,
      googleMeetLink: 'https://meet.google.com/xyz-uvwx-rst',
    },
  });

  const confirmedSession3 = await prisma.session.create({
    data: {
      mentorId: mentor2.id,
      menteeId: mentee1.id,
      scheduledAt: createDateTime(nextWeek, 14, 30), // Next Tuesday 2:30pm
      durationMinutes: 60,
      status: 'confirmed',
      topic: 'Business Development Partnerships',
      notes: 'Exploring potential partnerships and business development opportunities.',
      matchScore: 75.8,
    },
  });

  // 3. COMPLETED SESSIONS (with feedback)
  const completedSession1 = await prisma.session.create({
    data: {
      mentorId: mentor1.id,
      menteeId: mentee1.id,
      scheduledAt: createDateTime(oneWeekAgo, 10, 0), // One week ago
      durationMinutes: 60,
      status: 'completed',
      topic: 'Product Roadmap Planning',
      notes: 'Great session on prioritizing features for MVP.',
      matchScore: 87.3,
    },
  });

  const completedSession2 = await prisma.session.create({
    data: {
      mentorId: mentor3.id,
      menteeId: mentee2.id,
      scheduledAt: createDateTime(threeDaysAgo, 9, 30), // Three days ago
      durationMinutes: 60,
      status: 'completed',
      topic: 'AI/ML Architecture Review',
      notes: 'Reviewed our ML pipeline architecture and got great suggestions.',
      matchScore: 91.0,
    },
  });

  const completedSession3 = await prisma.session.create({
    data: {
      mentorId: mentor2.id,
      menteeId: mentee1.id,
      scheduledAt: createDateTime(twoWeeksAgo, 14, 0), // Two weeks ago
      durationMinutes: 60,
      status: 'completed',
      topic: 'Early Stage Fundraising',
      notes: 'Discussed fundraising strategy and investor outreach.',
      matchScore: 80.5,
    },
  });

  // 4. CANCELLED SESSION
  const cancelledSession = await prisma.session.create({
    data: {
      mentorId: mentor3.id,
      menteeId: mentee1.id,
      scheduledAt: createDateTime(oneWeekAgo, 9, 0), // One week ago
      durationMinutes: 60,
      status: 'cancelled',
      topic: 'Technical Architecture Discussion',
      notes: 'Cancelled due to scheduling conflict.',
      matchScore: 76.2,
    },
  });

  console.log('✅ Created 8 sessions (2 pending, 3 confirmed, 3 completed, 1 cancelled)');

  // Create Feedback for Completed Sessions
  console.log('💬 Creating feedback...');

  await prisma.feedback.create({
    data: {
      sessionId: completedSession1.id,
      mentorId: mentor1.id,
      menteeId: mentee1.id,
      rating: 5,
      writtenFeedback: 'Sarah provided excellent guidance on product roadmap planning. Her experience in B2B SaaS was invaluable. Highly recommend!',
      topicsCovered: ['Product Roadmap', 'MVP Prioritization', 'Feature Planning'],
      helpfulnessRating: 5,
      wouldRecommend: true,
      isAnonymous: false,
    },
  });

  await prisma.feedback.create({
    data: {
      sessionId: completedSession2.id,
      mentorId: mentor3.id,
      menteeId: mentee2.id,
      rating: 5,
      writtenFeedback: 'Dr. Watson gave fantastic technical advice on our ML infrastructure. Her expertise in scaling ML systems helped us identify key bottlenecks.',
      topicsCovered: ['ML Pipeline', 'Infrastructure Scaling', 'Performance Optimization'],
      helpfulnessRating: 5,
      wouldRecommend: true,
      isAnonymous: false,
    },
  });

  await prisma.feedback.create({
    data: {
      sessionId: completedSession3.id,
      mentorId: mentor2.id,
      menteeId: mentee1.id,
      rating: 4,
      writtenFeedback: 'Michael shared great insights on fundraising. His experience as an investor gave us a unique perspective on what investors look for.',
      topicsCovered: ['Fundraising', 'Investor Outreach', 'Pitch Deck'],
      helpfulnessRating: 4,
      wouldRecommend: true,
      isAnonymous: false,
    },
  });

  console.log('✅ Created feedback for 3 completed sessions');

  // Create Favorite Mentors
  console.log('⭐ Creating favorite mentors...');

  await prisma.favoriteMentor.create({
    data: {
      menteeId: mentee1.id,
      mentorId: mentor1.id,
    },
  });

  await prisma.favoriteMentor.create({
    data: {
      menteeId: mentee1.id,
      mentorId: mentor2.id,
    },
  });

  await prisma.favoriteMentor.create({
    data: {
      menteeId: mentee2.id,
      mentorId: mentor3.id,
    },
  });

  console.log('✅ Created favorite mentor relationships');

  // Create Notifications for Demo
  console.log('🔔 Creating notifications...');

  // Notifications for mentee1
  await prisma.notification.createMany({
    data: [
      {
        userId: mentee1.id,
        type: 'session_confirmation',
        title: 'Session Confirmed',
        message: `Your session with ${mentor1.name} on ${confirmedSession1.scheduledAt.toLocaleDateString()} has been confirmed.`,
        isRead: false,
        metadata: JSON.stringify({ sessionId: confirmedSession1.id }),
      },
      {
        userId: mentee1.id,
        type: 'session_reminder',
        title: 'Upcoming Session Reminder',
        message: `You have a session with ${mentor1.name} tomorrow at ${confirmedSession1.scheduledAt.toLocaleTimeString()}.`,
        isRead: false,
        metadata: JSON.stringify({ sessionId: confirmedSession1.id }),
      },
      {
        userId: mentee1.id,
        type: 'session_request',
        title: 'Session Request Pending',
        message: `Your session request with ${mentor1.name} is pending confirmation.`,
        isRead: true,
        metadata: JSON.stringify({ sessionId: pendingSession1.id }),
      },
    ],
  });

  // Notifications for mentor1
  await prisma.notification.createMany({
    data: [
      {
        userId: mentor1.id,
        type: 'session_request',
        title: 'New Session Request',
        message: `${mentee1.name} has requested a session with you.`,
        isRead: false,
        metadata: JSON.stringify({ sessionId: pendingSession1.id }),
      },
      {
        userId: mentor1.id,
        type: 'session_confirmation',
        title: 'Session Confirmed',
        message: `Your session with ${mentee1.name} on ${confirmedSession1.scheduledAt.toLocaleDateString()} has been confirmed.`,
        isRead: true,
        metadata: JSON.stringify({ sessionId: confirmedSession1.id }),
      },
    ],
  });

  // Notifications for mentee2
  await prisma.notification.createMany({
    data: [
      {
        userId: mentee2.id,
        type: 'session_confirmation',
        title: 'Session Confirmed',
        message: `Your session with ${mentor3.name} on ${confirmedSession2.scheduledAt.toLocaleDateString()} has been confirmed.`,
        isRead: false,
        metadata: JSON.stringify({ sessionId: confirmedSession2.id }),
      },
    ],
  });

  console.log('✅ Created notifications');

  // Summary
  console.log('\n✨ Seed completed successfully!\n');
  console.log('📋 Test Accounts Created:\n');
  console.log('👨‍🏫 Mentors:');
  console.log('  1. mentor1@test.com / mentor123 - Sarah Chen (Product Management)');
  console.log('  2. mentor2@test.com / mentor123 - Michael Rodriguez (Fundraising)');
  console.log('  3. mentor3@test.com / mentor123 - Dr. Emily Watson (AI/ML)\n');
  console.log('👨‍💼 Mentees:');
  console.log('  1. mentee1@test.com / mentee123 - Alex Johnson (Early Stage SaaS)');
  console.log('  2. mentee2@test.com / mentee123 - Jordan Lee (Pre-seed AI)\n');
  console.log('👨‍💻 Admin:');
  console.log('  1. admin@test.com / admin123 - Admin User\n');
  console.log('📅 Availability slots created for all mentors');
  console.log('🔔 Notification preferences created for all users');
  console.log('\n📊 Demo Data Created:\n');
  console.log('📅 Sessions:');
  console.log('  - 2 Pending sessions (waiting for mentor confirmation)');
  console.log('  - 3 Confirmed sessions (upcoming)');
  console.log('  - 3 Completed sessions (with feedback)');
  console.log('  - 1 Cancelled session');
  console.log('\n💬 Feedback:');
  console.log('  - 3 feedback entries for completed sessions');
  console.log('  - Ratings: 5, 5, 4 stars');
  console.log('\n⭐ Favorite Mentors:');
  console.log('  - Alex (mentee1) favorited Sarah & Michael');
  console.log('  - Jordan (mentee2) favorited Dr. Emily');
  console.log('\n🔔 Notifications:');
  console.log('  - Session confirmations');
  console.log('  - Session reminders');
  console.log('  - Session requests');
  console.log('  - Mix of read/unread notifications\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

