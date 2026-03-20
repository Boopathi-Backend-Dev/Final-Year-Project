const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'portal.sqlite');

try {
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('Deleted existing database file:', dbPath);
  } else {
    console.log('No existing database file found at:', dbPath);
  }
} catch (err) {
  console.error('Error deleting database file:', err);
  process.exit(1);
}

console.log('Recreating database schema by requiring ./db.js ...');
try {
  require('./db');
  // Allow a moment for migrations/DDL to run
  setTimeout(() => {
    console.log('Database reset complete.');
    process.exit(0);
  }, 1000);
} catch (err) {
  console.error('Error initializing database:', err);
  process.exit(1);
}
