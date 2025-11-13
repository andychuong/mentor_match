const { execSync } = require('child_process');

console.log('🚀 Starting migration and seeding...');

try {
  console.log('📦 Running migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  
  console.log('🌱 Seeding database...');
  // Use npx tsx to run the seed script (will download if needed)
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
  
  console.log('✅ Migration and seeding completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Error during migration/seeding:', error.message);
  process.exit(1);
}

