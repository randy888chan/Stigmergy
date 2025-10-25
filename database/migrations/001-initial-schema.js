// database/migrations/001-initial-schema.js
export async function up(driver) {
const session = driver.session();
try {
console.log('Applying migration: 001-initial-schema');
// Create constraints for core nodes to ensure data integrity
await session.run('CREATE CONSTRAINT IF NOT EXISTS FOR (n:Mission) REQUIRE n.id IS UNIQUE');
await session.run('CREATE CONSTRAINT IF NOT EXISTS FOR (n:Task) REQUIRE n.id IS UNIQUE');
console.log('Initial schema constraints applied successfully.');
} finally {
await session.close();
}
}
