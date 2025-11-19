import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Diverse mentor data for seeding
const mentorProfiles = [
    {
        name: 'Sarah Chen',
        email: 'sarah.chen@mentors.cf',
        bio: 'Product leader with 15+ years building and scaling B2B SaaS companies. As VP of Product at two unicorn startups, I\'ve helped teams navigate from early stage to $50M ARR. I\'m passionate about helping early-stage founders avoid common pitfalls and accelerate their journey to product-market fit.',
        expertise: ['Product Management', 'Go-to-Market', 'B2B SaaS', 'Product-Market Fit'],
        industries: ['SaaS', 'Enterprise Software', 'B2B'],
        availability: [{ day: 1, start: '10:00', end: '12:00' }, { day: 3, start: '10:00', end: '12:00' }],
    },
    {
        name: 'Michael Rodriguez',
        email: 'michael.rodriguez@mentors.cf',
        bio: 'Serial entrepreneur with 3 successful exits totaling $200M+. Founded companies in FinTech and E-commerce, raising over $75M in venture capital. Now an active angel investor with 50+ portfolio companies. My sessions focus on practical, actionable advice from someone who\'s been in the trenches and knows what investors really want to see.',
        expertise: ['Fundraising', 'Business Development', 'Startup Strategy', 'Angel Investing'],
        industries: ['FinTech', 'E-commerce', 'Marketplace'],
        availability: [{ day: 2, start: '14:00', end: '16:00' }, { day: 4, start: '14:00', end: '16:00' }],
    },
    {
        name: 'Dr. Emily Watson',
        email: 'emily.watson@mentors.cf',
        bio: 'CTO and technical co-founder with PhD in Computer Science from MIT. Built and scaled engineering organizations from 5 to 100+ engineers at two successful AI startups. I help technical founders make smart architecture decisions, build high-performing teams, and scale their infrastructure cost-effectively. Former engineering lead at Google Brain.',
        expertise: ['AI/ML', 'Cloud Infrastructure', 'Engineering Leadership', 'Technical Architecture'],
        industries: ['AI', 'DeepTech', 'Enterprise Software'],
        availability: [{ day: 1, start: '09:00', end: '11:00' }, { day: 3, start: '09:00', end: '11:00' }],
    },
    {
        name: 'James Park',
        email: 'james.park@mentors.cf',
        bio: 'Growth marketing executive who scaled 3 companies from $0 to $100M+ ARR. Former VP of Marketing at a unicorn SaaS company where I built the growth team from scratch. I\'ve personally managed $50M+ in ad spend and know what works (and what doesn\'t). I help founders build sustainable, data-driven growth engines.',
        expertise: ['Digital Marketing', 'Growth Hacking', 'Customer Acquisition', 'SEO/SEM'],
        industries: ['Consumer Tech', 'SaaS', 'E-commerce'],
        availability: [{ day: 2, start: '10:00', end: '12:00' }, { day: 5, start: '10:00', end: '12:00' }],
    },
    {
        name: 'Priya Patel',
        email: 'priya.patel@mentors.cf',
        bio: 'Enterprise sales leader with 20+ years closing deals with Fortune 500 companies. Former CRO at a publicly-traded SaaS company, where I built the sales org from 10 to 200+ reps and established partnerships with Microsoft, Salesforce, and IBM. If you\'re selling to enterprises, I can help you navigate complex sales cycles and close bigger deals faster.',
        expertise: ['Enterprise Sales', 'Sales Strategy', 'Team Building', 'B2B Partnerships'],
        industries: ['Enterprise Software', 'B2B', 'SaaS'],
        availability: [{ day: 3, start: '13:00', end: '15:00' }, { day: 4, start: '13:00', end: '15:00' }],
    },
    {
        name: 'David Kim',
        email: 'david.kim@mentors.cf',
        bio: 'Product design leader with 12+ years at companies like Airbnb, Uber, and Instagram. I\'ve led design teams that shipped products used by millions daily. I believe great design is the difference between a good product and a beloved one. I help founders create intuitive, beautiful products that users actually want to use.',
        expertise: ['UX/UI Design', 'User Research', 'Design Systems', 'Mobile Design'],
        industries: ['Consumer Tech', 'Mobile Apps', 'SaaS'],
        availability: [{ day: 1, start: '14:00', end: '16:00' }, { day: 4, start: '14:00', end: '16:00' }],
    },
    {
        name: 'Rachel Thompson',
        email: 'rachel.thompson@mentors.cf',
        bio: 'Healthcare entrepreneur with 2 successful FDA-approved medical device companies. 15+ years bringing healthcare innovations to market. Former practicing physician who understands both the clinical and business sides of healthcare. I help HealthTech founders navigate the complex regulatory landscape and build relationships with healthcare providers and payers.',
        expertise: ['Healthcare Compliance', 'FDA Approval', 'Clinical Trials', 'HealthTech'],
        industries: ['HealthTech', 'Medical Devices', 'Biotech'],
        availability: [{ day: 2, start: '09:00', end: '11:00' }, { day: 3, start: '09:00', end: '11:00' }],
    },
    {
        name: 'Carlos Mendoza',
        email: 'carlos.mendoza@mentors.cf',
        bio: 'Blockchain pioneer and Web3 entrepreneur. Early Bitcoin adopter (2011) and founder of a DeFi protocol with $500M+ TVL. Former blockchain architect at Coinbase. I help Web3 founders design sustainable token economies, navigate regulatory challenges, and build engaged communities. If you\'re building in crypto, I\'ve probably already made the mistakes you\'re about to make.',
        expertise: ['Blockchain', 'Cryptocurrency', 'Smart Contracts', 'Tokenomics', 'Web3'],
        industries: ['Blockchain', 'FinTech', 'DeFi'],
        availability: [{ day: 1, start: '15:00', end: '17:00' }, { day: 5, start: '15:00', end: '17:00' }],
    },
    {
        name: 'Lisa Chang',
        email: 'lisa.chang@mentors.cf',
        bio: 'Data science leader with PhD in Statistics from Stanford and 10+ years building data teams at high-growth startups. Former Head of Data at a $10B company where I built the data organization from 3 to 50+ people. I help founders leverage data effectively without overbuilding, make better decisions faster, and hire their first data team.',
        expertise: ['Data Science', 'Analytics', 'Machine Learning', 'Statistical Modeling'],
        industries: ['AI', 'SaaS', 'E-commerce'],
        availability: [{ day: 2, start: '11:00', end: '13:00' }, { day: 4, start: '11:00', end: '13:00' }],
    },
    {
        name: 'Ahmed Hassan',
        email: 'ahmed.hassan@mentors.cf',
        bio: 'Cybersecurity expert and ethical hacker with 15+ years protecting financial institutions and tech companies. Former CISO at major banks, led teams through multiple SOC2 and ISO 27001 audits. Certified Ethical Hacker (CEH) and CISSP. I help startups build security from day one and make pragmatic security decisions that don\'t slow down development.',
        expertise: ['Cybersecurity', 'Security Architecture', 'Compliance', 'Incident Response'],
        industries: ['FinTech', 'Enterprise Software', 'Security'],
        availability: [{ day: 3, start: '10:00', end: '12:00' }, { day: 5, start: '10:00', end: '12:00' }],
    },
    {
        name: 'Jennifer Martinez',
        email: 'jennifer.martinez@mentors.cf',
        bio: 'People operations leader who built HR functions at 3 unicorn startups, scaling from 10 to 1000+ employees. I\'ve hired 500+ people across engineering, sales, and operations. Former VP People at a company that went from $10M to $500M ARR. I help founders hire their first team, establish culture and values, and scale their organizations sustainably.',
        expertise: ['HR Strategy', 'Recruiting', 'Culture Building', 'Organizational Design'],
        industries: ['Tech', 'SaaS', 'Startup'],
        availability: [{ day: 1, start: '11:00', end: '13:00' }, { day: 4, start: '11:00', end: '13:00' }],
    },
    {
        name: 'Robert Johnson',
        email: 'robert.johnson@mentors.cf',
        bio: 'Startup attorney and partner at top Silicon Valley law firm. 18 years advising tech companies on venture financing, M&A, IP strategy, and corporate governance. I\'ve helped companies raise over $2B in venture capital and closed $5B+ in M&A transactions. I help founders navigate legal complexities, negotiate better terms with investors, and avoid expensive legal mistakes.',
        expertise: ['Startup Law', 'Venture Financing', 'IP Protection', 'Corporate Governance'],
        industries: ['Legal', 'Tech', 'Startup'],
        availability: [{ day: 2, start: '13:00', end: '15:00' }, { day: 5, start: '13:00', end: '15:00' }],
    },
    {
        name: 'Sophia Nguyen',
        email: 'sophia.nguyen@mentors.cf',
        bio: 'E-commerce entrepreneur who built and sold 2 DTC brands for 8-figure exits. Scaled brands from $0 to $20M revenue with profitable unit economics. I know what it takes to succeed in e-commerce: product-market fit, customer acquisition that actually works, inventory management, and building a brand people love. I help founders navigate the operational complexity of physical products.',
        expertise: ['E-commerce', 'Marketplace', 'Supply Chain', 'Customer Retention', 'DTC'],
        industries: ['E-commerce', 'Retail', 'Marketplace'],
        availability: [{ day: 1, start: '13:00', end: '15:00' }, { day: 3, start: '13:00', end: '15:00' }],
    },
    {
        name: 'Marcus Williams',
        email: 'marcus.williams@mentors.cf',
        bio: 'Developer tools and API infrastructure expert. Built developer platforms at Stripe and Twilio used by millions of developers. Author of popular open-source libraries with 100K+ stars. I understand what developers need and how to build tools they\'ll actually adopt. I help B2D (Business-to-Developer) founders build products developers love.',
        expertise: ['API Design', 'Developer Tools', 'Platform Engineering', 'DevOps'],
        industries: ['DevTools', 'Infrastructure', 'SaaS'],
        availability: [{ day: 2, start: '15:00', end: '17:00' }, { day: 4, start: '15:00', end: '17:00' }],
    },
    {
        name: 'Anna Kowalski',
        email: 'anna.kowalski@mentors.cf',
        bio: 'EdTech founder and former educator with 20+ years in education. Built a K-12 learning platform serving 1M+ students across 5,000 schools. Former teacher who understands the classroom reality, not just theory. I help EdTech founders build products that actually work in schools, navigate sales to districts, and create measurable learning outcomes.',
        expertise: ['EdTech', 'Curriculum Design', 'Learning Science', 'Education Policy'],
        industries: ['EdTech', 'Education', 'SaaS'],
        availability: [{ day: 3, start: '14:00', end: '16:00' }, { day: 5, start: '14:00', end: '16:00' }],
    },
    {
        name: 'Daniel Cohen',
        email: 'daniel.cohen@mentors.cf',
        bio: 'FinTech veteran with 15 years in payments and financial services. Former Head of Product at Square and early employee at a payment unicorn. Launched payment products processing $10B+ annually. I help FinTech founders navigate complex regulations, build relationships with banks, and design compliant payment flows.',
        expertise: ['FinTech', 'Payment Systems', 'Financial Regulation', 'Banking'],
        industries: ['FinTech', 'Payments', 'Banking'],
        availability: [{ day: 1, start: '16:00', end: '18:00' }, { day: 4, start: '16:00', end: '18:00' }],
    },
    {
        name: 'Maya Singh',
        email: 'maya.singh@mentors.cf',
        bio: 'Climate tech entrepreneur and impact investor. Founded a carbon offset marketplace that facilitated $100M+ in carbon credits. Former sustainability consultant at McKinsey. I help climate tech founders navigate carbon markets, secure climate-focused funding, measure impact effectively, and tell compelling stories to impact investors and corporate buyers.',
        expertise: ['Climate Tech', 'Sustainability', 'Clean Energy', 'ESG', 'Impact Investing'],
        industries: ['Climate Tech', 'Clean Energy', 'Impact'],
        availability: [{ day: 2, start: '10:00', end: '12:00' }, { day: 3, start: '10:00', end: '12:00' }],
    },
    {
        name: 'Tom Anderson',
        email: 'tom.anderson@mentors.cf',
        bio: 'Gaming industry veteran with 18 years developing AAA and mobile games. Led development of 5 titles with 50M+ downloads generating $500M+ revenue. Former Creative Director at EA and mobile game studio founder. I help gaming founders design engaging mechanics, optimize monetization without hurting player experience, and build games people play for years.',
        expertise: ['Game Design', 'Game Development', 'Monetization', 'Live Operations'],
        industries: ['Gaming', 'Entertainment', 'Mobile'],
        availability: [{ day: 1, start: '12:00', end: '14:00' }, { day: 5, start: '12:00', end: '14:00' }],
    },
    {
        name: 'Fatima Al-Rashid',
        email: 'fatima.alrashid@mentors.cf',
        bio: 'IoT and hardware expert with 12+ years building connected devices. Founded an industrial IoT company acquired by a Fortune 500 manufacturer. Former hardware engineer at Tesla. I help hardware founders navigate the challenges of physical products: unit economics, manufacturing, inventory, and building v1 without burning all your cash.',
        expertise: ['IoT', 'Hardware', 'Embedded Systems', 'Manufacturing'],
        industries: ['IoT', 'Hardware', 'Industrial'],
        availability: [{ day: 2, start: '14:00', end: '16:00' }, { day: 5, start: '11:00', end: '13:00' }],
    },
    {
        name: 'Kevin O\'Brien',
        email: 'kevin.obrien@mentors.cf',
        bio: 'Social media and community expert who grew online communities from 0 to 5M+ engaged members. Former Head of Community at Reddit and community lead at a social media unicorn. Built communities that generated 100M+ organic impressions monthly. I help founders build engaged communities, create viral content strategies, and turn users into evangelists.',
        expertise: ['Social Media', 'Community Building', 'Content Strategy', 'Influencer Marketing'],
        industries: ['Social Media', 'Consumer Tech', 'Creator Economy'],
        availability: [{ day: 3, start: '11:00', end: '13:00' }, { day: 4, start: '10:00', end: '12:00' }],
    },
];

const menteeProfiles = [
    {
        name: 'Alex Johnson',
        email: 'alex.johnson@founders.cf',
        bio: 'Founder and CEO of TaskFlow, a B2B SaaS platform helping project teams collaborate more effectively. We\'re in the early stage with 50 beta customers and strong product engagement (40% DAU/MAU). I\'m focused on achieving clear product-market fit and building our first scalable go-to-market motion. Previously spent 5 years as a PM at a unicorn SaaS company before leaving to start TaskFlow. Looking for mentorship on pivoting from PLG to sales-led growth and scaling our ARR from $50K to $1M.',
        industries: ['SaaS', 'B2B', 'Project Management'],
        stage: 'early',
    },
    {
        name: 'Jordan Lee',
        email: 'jordan.lee@founders.cf',
        bio: 'Technical co-founder and CTO of DataPulse, an AI-powered analytics platform that helps e-commerce companies predict customer behavior. We\'re pre-seed with a working MVP and 10 pilot customers showing 3x ROI. Currently raising our first round ($750K-$1M) while scaling our ML infrastructure to handle more data volume. Former ML engineer at Google. Seeking guidance on fundraising strategy, technical architecture decisions for scaling, and hiring our first data science team.',
        industries: ['AI', 'Analytics', 'B2B'],
        stage: 'pre-seed',
    },
];

async function main() {
    console.log('🌱 Starting large-scale seed...');

    // Hash password function
    const hashPassword = async (password: string): Promise<string> => {
        return bcrypt.hash(password, 10);
    };

    // Clear existing test data
    console.log('🧹 Cleaning up existing data...');
    await prisma.favoriteMentor.deleteMany({});
    await prisma.feedback.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.availability.deleteMany({});
    await prisma.notificationPreference.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.user.deleteMany({
        where: {
            OR: [
                { email: { endsWith: '@mentors.cf' } },
                { email: { endsWith: '@founders.cf' } },
                { email: 'admin@capitalfactory.com' },
            ],
        },
    });

    console.log(`👨‍🏫 Creating ${mentorProfiles.length} diverse mentors...`);
    const mentorPassword = await hashPassword('mentor123');
    const mentors = [];

    for (const profile of mentorProfiles) {
        const mentor = await prisma.user.create({
            data: {
                email: profile.email,
                passwordHash: mentorPassword,
                role: 'mentor',
                name: profile.name,
                bio: profile.bio,
                expertiseAreas: profile.expertise,
                industryFocus: profile.industries,
                startupStage: null,
                airtableSyncStatus: 'synced',
                isActive: true,
            },
        });
        mentors.push({ ...mentor, availability: profile.availability });
    }

    console.log(`✅ Created ${mentors.length} mentors`);

    // Create Mentees
    console.log(`👨‍💼 Creating ${menteeProfiles.length} mentees...`);
    const menteePassword = await hashPassword('mentee123');
    const mentees = [];

    for (const profile of menteeProfiles) {
        const mentee = await prisma.user.create({
            data: {
                email: profile.email,
                passwordHash: menteePassword,
                role: 'mentee',
                name: profile.name,
                bio: profile.bio,
                expertiseAreas: [],
                industryFocus: profile.industries,
                startupStage: profile.stage,
                airtableSyncStatus: 'synced',
                isActive: true,
            },
        });
        mentees.push(mentee);
    }

    console.log(`✅ Created ${mentees.length} mentees`);

    // Create Admin
    console.log('👨‍💻 Creating admin...');
    const adminPassword = await hashPassword('admin123');
    const admin = await prisma.user.create({
        data: {
            email: 'admin@capitalfactory.com',
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

    // Create Availability Slots
    console.log('📅 Creating availability slots...');
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    for (const mentor of mentors) {
        for (const slot of mentor.availability) {
            await prisma.availability.create({
                data: {
                    mentorId: mentor.id,
                    dayOfWeek: slot.day,
                    startTime: slot.start,
                    endTime: slot.end,
                    timezone: 'America/Chicago',
                    isRecurring: true,
                    validFrom: now,
                    validUntil: nextMonth,
                },
            });
        }
    }

    console.log('✅ Created availability slots for all mentors');

    // Create Notification Preferences
    console.log('🔔 Creating notification preferences...');
    const allUserIds = [...mentors.map(m => m.id), ...mentees.map(m => m.id), admin.id];
    await prisma.notificationPreference.createMany({
        data: allUserIds.map((userId) => ({
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

    // Create Mentor Matches with Reasoning
    console.log('🎯 Creating mentor matches with reasoning...');

    // Helper function to generate match reasoning
    const generateReasoning = (mentor: any, mentee: any, score: number): string => {
        const mentorName = mentor.name;
        const mentorExpertise = mentor.expertiseAreas.slice(0, 2).join(' and ');
        const menteeIndustry = mentee.industryFocus[0];
        const menteeStage = mentee.startupStage;

        return `${mentorName}'s extensive experience in ${mentorExpertise} aligns well with your startup's focus on ${menteeIndustry}. With a proven track record in guiding ${menteeStage} stage companies, ${mentorName.split(' ')[0]} offers invaluable insights for navigating the challenges you currently face. By partnering with ${mentorName.split(' ')[0]}, you can expect to gain actionable strategies and accelerate your path to success.`;
    };

    // Calculate simple match scores based on industry overlap
    const calculateMatchScore = (mentor: any, mentee: any): number => {
        const industryOverlap = mentor.industryFocus.filter((ind: string) =>
            mentee.industryFocus.includes(ind)
        ).length;
        const baseScore = 40;
        const overlapBonus = industryOverlap * 15;
        const randomVariance = Math.random() * 20;
        return Math.min(95, baseScore + overlapBonus + randomVariance);
    };

    // Create matches for each mentee with top mentors
    for (const mentee of mentees) {
        const mentorScores = mentors.map(mentor => ({
            mentor,
            score: calculateMatchScore(mentor, mentee),
        }));

        // Sort by score and take top 10
        mentorScores.sort((a, b) => b.score - a.score);
        const topMentors = mentorScores.slice(0, 10);

        for (const { mentor, score } of topMentors) {
            await prisma.match.create({
                data: {
                    menteeId: mentee.id,
                    mentorId: mentor.id,
                    matchScore: score,
                    reasoning: generateReasoning(mentor, mentee, score),
                },
            });
        }
    }

    console.log('✅ Created mentor matches with reasoning');

    // Create Sample Sessions
    console.log('📅 Creating sample sessions...');

    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);



    // Helper to create a date at a specific time
    const createDateTime = (date: Date, hours: number, minutes: number = 0): Date => {
        const newDate = new Date(date);
        newDate.setHours(hours, minutes, 0, 0);
        return newDate;
    };

    // Helper to generate session content based on mentor expertise
    const generateSessionContent = (mentor: any, mentee: any, topic: string) => {
        const mentorExpertise = mentor.expertiseAreas[0];
        const mentorName = mentor.name.split(' ')[0];
        const menteeName = mentee.name.split(' ')[0];

        const summaries: { [key: string]: string } = {
            'Product': `${mentorName} and ${menteeName} discussed product development strategies, focusing on roadmap prioritization and feature selection. Key insights included leveraging user feedback loops and building an MVP that validates core hypotheses. ${mentorName} shared experiences from scaling products at two unicorn startups.`,
            'Fundraising': `The session covered fundraising fundamentals including pitch deck structure, investor targeting, and term sheet negotiations. ${mentorName} provided specific feedback on ${menteeName}'s pitch and shared insights from successfully raising $75M+ across multiple ventures.`,
            'AI/ML': `Technical deep-dive into ML infrastructure and scaling strategies. ${mentorName} reviewed the current architecture and provided recommendations for cost-effective scaling. Discussion included ML ops best practices, model deployment, and building high-performing data teams.`,
            'Go-to-Market': `Comprehensive GTM strategy session covering positioning, messaging, and channel selection. ${mentorName} outlined a framework for B2B SaaS launches and helped ${menteeName} identify the most promising initial market segments.`,
            'Enterprise Sales': `${mentorName} shared proven strategies for enterprise sales cycles, including stakeholder mapping and value-based selling. Discussed how to navigate complex organizations and build champions within Fortune 500 accounts.`,
            'Digital Marketing': `Session focused on growth marketing tactics including performance marketing, conversion optimization, and analytics. ${mentorName} provided a framework for building sustainable, data-driven growth engines with specific channel recommendations.`,
        };

        const defaultSummary = `Productive mentoring session where ${mentorName} shared insights from their ${mentorExpertise} expertise. Discussion covered practical strategies, common pitfalls to avoid, and actionable next steps for ${menteeName}'s startup journey.`;

        const summary = Object.entries(summaries).find(([key]) => mentorExpertise.includes(key))?.[1] || defaultSummary;

        const mentorNotes = `Great session with ${menteeName}! They came well-prepared with specific questions about ${topic.toLowerCase()}. \n\nKey discussion points:\n- Reviewed their current approach and identified 2-3 quick wins\n- Shared frameworks and mental models from my experience\n- Provided specific recommendations tailored to their ${mentee.startupStage} stage\n\nNext steps: ${menteeName} will implement the roadmap we discussed and follow up in 2-3 weeks with progress updates. Looking forward to seeing how they execute on these strategies.`;

        const menteeNotes = `Extremely valuable session with ${mentorName}. Their experience in ${mentorExpertise} provided exactly the guidance I needed.\n\nKey takeaways:\n- Clear action plan for the next 30 days\n- Framework for decision-making that I can apply immediately\n- Specific tactics that ${mentorName} used when facing similar challenges\n- New perspective on how to approach ${topic.toLowerCase()}\n\nFeeling much more confident about our path forward. Will definitely request another session once I've made progress on these initiatives.`;

        return { summary, mentorNotes, menteeNotes };
    };

    // For each mentee, create sessions with their top matches
    for (const mentee of mentees) {
        // Get top 5 matches for this mentee
        const topMatches = await prisma.match.findMany({
            where: { menteeId: mentee.id },
            orderBy: { matchScore: 'desc' },
            take: 5,
            include: { mentor: true },
        });

        if (topMatches.length >= 1) {
            // Pending session with top match
            await prisma.session.create({
                data: {
                    mentorId: topMatches[0].mentorId,
                    menteeId: mentee.id,
                    scheduledAt: createDateTime(nextWeek, 10, 0),
                    durationMinutes: 60,
                    status: 'pending',
                    topic: 'Initial Strategy Discussion',
                    notes: 'Looking forward to discussing growth strategies and product-market fit.',
                    matchScore: topMatches[0].matchScore,
                },
            });
        }

        if (topMatches.length >= 2) {
            // Confirmed session with 2nd match
            await prisma.session.create({
                data: {
                    mentorId: topMatches[1].mentorId,
                    menteeId: mentee.id,
                    scheduledAt: createDateTime(tomorrow, 14, 30),
                    durationMinutes: 60,
                    status: 'confirmed',
                    topic: 'Fundraising Strategy',
                    notes: 'Deep dive into fundraising tactics and investor relations.',
                    matchScore: topMatches[1].matchScore,
                    googleMeetLink: 'https://meet.google.com/abc-defg-hij',
                },
            });
        }

        if (topMatches.length >= 3) {
            // Completed session with 3rd match
            const sessionTopic = 'Product Development Best Practices';
            const sessionContent = generateSessionContent(topMatches[2].mentor, mentee, sessionTopic);

            const completedSession = await prisma.session.create({
                data: {
                    mentorId: topMatches[2].mentorId,
                    menteeId: mentee.id,
                    scheduledAt: createDateTime(oneWeekAgo, 11, 0),
                    durationMinutes: 60,
                    status: 'completed',
                    topic: sessionTopic,
                    notes: 'Great session on product roadmap and prioritization.',
                    summary: sessionContent.summary,
                    mentorNotes: sessionContent.mentorNotes,
                    menteeNotes: sessionContent.menteeNotes,
                    matchScore: topMatches[2].matchScore,
                },
            });

            // Add feedback for completed session
            await prisma.feedback.create({
                data: {
                    sessionId: completedSession.id,
                    mentorId: topMatches[2].mentorId,
                    menteeId: mentee.id,
                    rating: 5,
                    writtenFeedback: `Excellent session with ${topMatches[2].mentor.name}! Got practical advice that I can implement immediately.`,
                    topicsCovered: ['Product Development', 'Roadmap Planning', 'Prioritization'],
                    helpfulnessRating: 5,
                    wouldRecommend: true,
                    isAnonymous: false,
                },
            });
        }

        if (topMatches.length >= 4) {
            // Another completed session with feedback
            const sessionTopic2 = 'Market Analysis and Competition';
            const sessionContent2 = generateSessionContent(topMatches[3].mentor, mentee, sessionTopic2);

            const completedSession2 = await prisma.session.create({
                data: {
                    mentorId: topMatches[3].mentorId,
                    menteeId: mentee.id,
                    scheduledAt: createDateTime(twoWeeksAgo, 15, 0),
                    durationMinutes: 60,
                    status: 'completed',
                    topic: sessionTopic2,
                    notes: 'Discussed competitive landscape and differentiation strategies.',
                    summary: sessionContent2.summary,
                    mentorNotes: sessionContent2.mentorNotes,
                    menteeNotes: sessionContent2.menteeNotes,
                    matchScore: topMatches[3].matchScore,
                },
            });

            await prisma.feedback.create({
                data: {
                    sessionId: completedSession2.id,
                    mentorId: topMatches[3].mentorId,
                    menteeId: mentee.id,
                    rating: 4,
                    writtenFeedback: 'Very helpful insights on market positioning and competitive analysis.',
                    topicsCovered: ['Market Analysis', 'Competition', 'Differentiation'],
                    helpfulnessRating: 4,
                    wouldRecommend: true,
                    isAnonymous: false,
                },
            });
        }
    }

    const sessionCount = await prisma.session.count();
    const feedbackCount = await prisma.feedback.count();
    console.log(`✅ Created ${sessionCount} sessions with ${feedbackCount} feedback entries`);

    // Summary

    console.log('\n✨ Large-scale seed completed successfully!\n');
    console.log('📋 Summary:\n');
    console.log(`👨‍🏫 Mentors: ${mentors.length} diverse mentors created`);
    console.log(`👨‍💼 Mentees: ${mentees.length} mentees created`);
    console.log('👨‍💻 Admin: 1 admin created\n');
    console.log('🔑 Login Credentials:\n');
    console.log('Mentors: [any mentor email] / mentor123');
    console.log('Mentees: [any mentee email] / mentee123');
    console.log('Admin: admin@capitalfactory.com / admin123\n');
    console.log('📊 Mentor Expertise Areas:');
    const expertiseSet = new Set(mentors.flatMap(m => m.expertiseAreas));
    expertiseSet.forEach(exp => console.log(`  - ${exp}`));
    console.log('\n🏭 Industries Covered:');
    const industriesSet = new Set(mentors.flatMap(m => m.industryFocus));
    industriesSet.forEach(ind => console.log(`  - ${ind}`));
}

main()
    .catch((e) => {
        console.error('❌ Error during seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
