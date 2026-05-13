const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: 6379,
});

const products = [
  { id: '1', name: 'iPhone 15 Pro',     price: 29000000, image: '📱', description: 'Chip A17 Pro, màn hình ProMotion 120Hz' },
  { id: '2', name: 'Samsung Galaxy S24', price: 19000000, image: '📱', description: 'Snapdragon 8 Gen 3, AI on-device' },
  { id: '3', name: 'MacBook Pro M3',    price: 45000000, image: '💻', description: 'Apple M3 Pro, Liquid Retina XDR' },
  { id: '4', name: 'AirPods Pro 2',     price: 5500000,  image: '🎧', description: 'Chống ồn ANC thế hệ 2, Spatial Audio' },
  { id: '5', name: 'iPad Pro M2',       price: 25000000, image: '🖥️', description: 'Màn hình Liquid Retina, chip M2' },
];

const stocks = { '1': 50, '2': 30, '3': 20, '4': 100, '5': 40 };

async function seed() {
  console.log('🌱 Seeding Redis Data Grid...\n');

  await redis.set('products', JSON.stringify(products));

  for (const p of products) {
    await redis.set(`product:${p.id}`, JSON.stringify(p));
    await redis.set(`stock:${p.id}`, stocks[p.id]);
    console.log(`  ✅ ${p.name.padEnd(20)} stock: ${stocks[p.id]}`);
  }

  console.log('\n✨ Data Grid seeded — all data in memory, no DB!');
  await redis.quit();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
