/* ============================================
   DATABASE CONNECTION TEST
   Verifies SQLite database connection and shows data
   ============================================ */

const db = require('./db');

console.log('🔌 Testing database connection...\n');

// Test connection by querying all tables
db.serialize(() => {
  // Check users
  db.all('SELECT * FROM users', [], (err, users) => {
    if (err) {
      console.error('❌ Error querying users:', err.message);
    } else {
      console.log(`✅ Users table: ${users.length} records`);
      if (users.length > 0) {
        console.log('   Sample users:');
        users.slice(0, 3).forEach(user => {
          console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
        });
      }
    }
  });

  // Check students
  db.all('SELECT COUNT(*) as count FROM students', [], (err, row) => {
    if (err) {
      console.error('❌ Error querying students:', err.message);
    } else {
      console.log(`✅ Students table: ${row[0].count} records`);
    }
  });

  // Check staff
  db.all('SELECT COUNT(*) as count FROM staff', [], (err, row) => {
    if (err) {
      console.error('❌ Error querying staff:', err.message);
    } else {
      console.log(`✅ Staff table: ${row[0].count} records`);
    }
  });

  // Check companies
  db.all('SELECT COUNT(*) as count FROM companies', [], (err, row) => {
    if (err) {
      console.error('❌ Error querying companies:', err.message);
    } else {
      console.log(`✅ Companies table: ${row[0].count} records`);
    }
  });

  // Check jobs
  db.all('SELECT COUNT(*) as count FROM jobs', [], (err, row) => {
    if (err) {
      console.error('❌ Error querying jobs:', err.message);
    } else {
      console.log(`✅ Jobs table: ${row[0].count} records`);
    }
  });

  // Check courses
  db.all('SELECT COUNT(*) as count FROM courses', [], (err, row) => {
    if (err) {
      console.error('❌ Error querying courses:', err.message);
    } else {
      console.log(`✅ Courses table: ${row[0].count} records`);
    }
  });

  // Check applications
  db.all('SELECT COUNT(*) as count FROM applications', [], (err, row) => {
    if (err) {
      console.error('❌ Error querying applications:', err.message);
    } else {
      console.log(`✅ Applications table: ${row[0].count} records`);
    }
  });

  // Show detailed data
  setTimeout(() => {
    console.log('\n📊 DETAILED DATA:\n');
    
    // Show all users with details
    db.all(`
      SELECT 
        u.id, u.name, u.email, u.role,
        s.registerNumber as studentReg, s.department as studentDept, s.cgpa, s.approved,
        st.department as staffDept,
        c.name as companyName
      FROM users u
      LEFT JOIN students s ON s.userId = u.id
      LEFT JOIN staff st ON st.userId = u.id
      LEFT JOIN companies c ON c.userId = u.id
      ORDER BY u.id
    `, [], (err, rows) => {
      if (err) {
        console.error('❌ Error:', err.message);
      } else {
        console.log('👥 ALL USERS:');
        rows.forEach(row => {
          console.log(`\n   ID: ${row.id}`);
          console.log(`   Name: ${row.name}`);
          console.log(`   Email: ${row.email}`);
          console.log(`   Role: ${row.role}`);
          if (row.role === 'student') {
            console.log(`   Register: ${row.studentReg || 'N/A'}`);
            console.log(`   Department: ${row.studentDept || 'N/A'}`);
            console.log(`   CGPA: ${row.cgpa || 'N/A'}`);
            console.log(`   Approved: ${row.approved ? 'Yes' : 'No'}`);
          } else if (row.role === 'staff') {
            console.log(`   Department: ${row.staffDept || 'N/A'}`);
          } else if (row.role === 'company') {
            console.log(`   Company: ${row.companyName || 'N/A'}`);
          }
        });
      }

      // Show jobs and courses
      db.all('SELECT * FROM jobs', [], (err, jobs) => {
        if (!err && jobs.length > 0) {
          console.log('\n💼 JOBS:');
          jobs.forEach(job => {
            console.log(`   [${job.id}] ${job.title} - ${job.department || 'All Depts'}`);
          });
        }

        db.all('SELECT * FROM courses', [], (err, courses) => {
          if (!err && courses.length > 0) {
            console.log('\n📚 COURSES:');
            courses.forEach(course => {
              console.log(`   [${course.id}] ${course.title} - ${course.department || 'All Depts'}`);
            });
          }

          console.log('\n✅ Database connection test completed!\n');
          db.close();
        });
      });
    });
  }, 500);
});
