const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'portal.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Checking database schema...\n');

// Get all tables
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
        console.error('Error fetching tables:', err);
        db.close();
        return;
    }

    console.log('Tables in database:');
    tables.forEach(table => console.log(`  - ${table.name}`));
    console.log('');

    // Check if cart table exists
    const cartTable = tables.find(t => t.name === 'cart');
    if (cartTable) {
        console.log('Cart table exists!');

        // Get cart table schema
        db.all("PRAGMA table_info(cart)", (err, columns) => {
            if (err) {
                console.error('Error fetching cart schema:', err);
            } else {
                console.log('\nCart table columns:');
                columns.forEach(col => {
                    console.log(`  - ${col.name} (${col.type})`);
                });
            }

            // Check courses table schema
            db.all("PRAGMA table_info(courses)", (err, columns) => {
                if (err) {
                    console.error('Error fetching courses schema:', err);
                } else {
                    console.log('\nCourses table columns:');
                    columns.forEach(col => {
                        console.log(`  - ${col.name} (${col.type})`);
                    });
                }
                db.close();
            });
        });
    } else {
        console.log('Cart table does NOT exist!');
        db.close();
    }
});
