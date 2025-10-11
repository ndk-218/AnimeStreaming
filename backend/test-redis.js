const Redis = require('ioredis');

console.log('🔴 Testing Redis connection...\n');

const redis = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully!');
  console.log('📍 Host: localhost:6379\n');
  
  redis.set('test', 'Hello Redis!', (err) => {
    if (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }
    
    redis.get('test', (err, result) => {
      console.log('📦 Test result:', result);
      console.log('\n🎉 Redis is working!\n');
      redis.disconnect();
      process.exit(0);
    });
  });
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
  process.exit(1);
});