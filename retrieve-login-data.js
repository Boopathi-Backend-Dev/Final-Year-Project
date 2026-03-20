const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'database', 'portal.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('📊 Retrieving all login data from database...\n');

// Query all users with their login information
db.all(`
  SELECT 
    id,
    name,
    email,
    password,
    role,
    collegeCode,
    createdAt
  FROM users
  ORDER BY id ASC
`, [], (err, rows) => {
  if (err) {
    console.error('❌ Error retrieving data:', err.message);
    db.close();
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log('⚠️  No login data found in database');
    db.close();
    process.exit(0);
  }

  console.log(`✅ Found ${rows.length} user(s)\n`);
  console.log('═══════════════════════════════════════════════════════════════');
  
  rows.forEach((user, index) => {
    console.log(`\nUser #${index + 1}:`);
    console.log(`  ID:          ${user.id}`);
    console.log(`  Name:        ${user.name}`);
    console.log(`  Email:       ${user.email}`);
    console.log(`  Role:        ${user.role}`);
    console.log(`  College Code: ${user.collegeCode || 'N/A'}`);
    console.log(`  Created At:  ${user.createdAt}`);
    console.log(`  Password:    ${user.password}`);
  });

  console.log('\n═══════════════════════════════════════════════════════════════\n');
  
  // Also save to JSON file for easy reference
  const fs = require('fs');
  const outputFile = path.join(__dirname, 'login-data.json');
  fs.writeFileSync(outputFile, JSON.stringify(rows, null, 2));
  console.log(`💾 Data saved to: login-data.json`);

  db.close();
  process.exit(0);
});
