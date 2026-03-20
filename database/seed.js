/* ============================================
   DATABASE SEED SCRIPT
   Creates sample users for testing all dashboards
   ============================================ */

const bcrypt = require('bcryptjs');
const db = require('./db');

// Sample users data
const sampleUsers = [
  {
    name: 'John Student',
    email: 'student@college.edu',
    password: 'student123',
    role: 'student',
    collegeCode: 'COLLEGE001',
    studentData: {
      registerNumber: 'REG2024001',
      department: 'CSE',
      skills: 'JavaScript, Python, React, Node.js',
      cgpa: 8.5,
      approved: 1
    }
  },
  {
    name: 'Jane Staff',
    email: 'staff@college.edu',
    password: 'staff123',
    role: 'staff',
    collegeCode: 'COLLEGE001',
    staffData: {
      department: 'CSE',
      collegeCode: 'COLLEGE001'
    }
  },
  {
    name: 'Tech Corp Admin',
    email: 'company@techcorp.com',
    password: 'company123',
    role: 'company',
    companyData: {
      name: 'Tech Corp Solutions',
      description: 'Leading software development company'
    }
  },
  {
    name: 'Sarah Student',
    email: 'sarah@college.edu',
    password: 'student123',
    role: 'student',
    collegeCode: 'COLLEGE001',
    studentData: {
      registerNumber: 'REG2024002',
      department: 'ECE',
      skills: 'C++, Embedded Systems, IoT',
      cgpa: 8.2,
      approved: 0
    }
  },
  {
    name: 'Coaching Centre',
    email: 'coaching@skills.com',
    password: 'company123',
    role: 'company',
    companyData: {
      name: 'Skills Development Centre',
      description: 'Professional training and certification programs'
    }
  }
];

// Seed function
function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  let processed = 0;
  const total = sampleUsers.length;

  sampleUsers.forEach((userData, index) => {
    const { name, email, password, role, collegeCode, studentData, staffData, companyData } = userData;
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Check if user already exists
    db.get('SELECT id FROM users WHERE email = ?', [email], (err, existing) => {
      if (err) {
        console.error(`❌ Error checking user ${email}:`, err.message);
        processed++;
        if (processed === total) {
          console.log('\n✅ Seeding completed!\n');
          console.log('📋 TEST CREDENTIALS:\n');
          console.log('👨‍🎓 STUDENT DASHBOARD:');
          console.log('   Email: student@college.edu');
          console.log('   Password: student123\n');
          console.log('👨‍💼 STAFF DASHBOARD:');
          console.log('   Email: staff@college.edu');
          console.log('   Password: staff123\n');
          console.log('🏢 COMPANY DASHBOARD:');
          console.log('   Email: company@techcorp.com');
          console.log('   Password: company123\n');
          process.exit(0);
        }
        return;
      }

      if (existing) {
        // Update collegeCode if not set
        if ((role === 'student' || role === 'staff') && collegeCode) {
          db.run('UPDATE users SET collegeCode = ? WHERE id = ?', [collegeCode, existing.id], (err) => {
            if (err) console.error(`⚠️  Error updating collegeCode for ${email}:`, err.message);
            else console.log(`✅ Updated collegeCode for existing user: ${email}`);
          });
        }
        // Create role-specific records if not exist
        if (role === 'student') {
          db.get('SELECT id FROM students WHERE userId = ?', [existing.id], (err, student) => {
            if (!student) {
              db.run('INSERT INTO students (userId, approved) VALUES (?, ?)', [existing.id, studentData?.approved || 0], (err) => {
                if (err) console.error(`⚠️  Error creating student record for ${email}:`, err.message);
                else console.log(`✅ Created student record for existing user: ${email}`);
              });
            }
          });
        } else if (role === 'staff') {
          db.get('SELECT id FROM staff WHERE userId = ?', [existing.id], (err, staff) => {
            if (!staff) {
              db.run('INSERT INTO staff (userId) VALUES (?)', [existing.id], (err) => {
                if (err) console.error(`⚠️  Error creating staff record for ${email}:`, err.message);
                else console.log(`✅ Created staff record for existing user: ${email}`);
              });
            }
          });
        } else if (role === 'company') {
          db.get('SELECT id FROM companies WHERE userId = ?', [existing.id], (err, company) => {
            if (!company && companyData) {
              db.run('INSERT INTO companies (userId, name, description) VALUES (?, ?, ?)', [existing.id, companyData.name, companyData.description], (err) => {
                if (err) console.error(`⚠️  Error creating company record for ${email}:`, err.message);
                else console.log(`✅ Created company record for existing user: ${email}`);
              });
            }
          });
        }
        console.log(`⏭️  User ${email} already exists, skipping creation...`);
        processed++;
        if (processed === total) {
          console.log('\n✅ Seeding completed!\n');
          console.log('📋 TEST CREDENTIALS:\n');
          console.log('👨‍🎓 STUDENT DASHBOARD:');
          console.log('   Email: student@college.edu');
          console.log('   Password: student123\n');
          console.log('👨‍💼 STAFF DASHBOARD:');
          console.log('   Email: staff@college.edu');
          console.log('   Password: staff123\n');
          console.log('🏢 COMPANY DASHBOARD:');
          console.log('   Email: company@techcorp.com');
          console.log('   Password: company123\n');
          process.exit(0);
        }
        return;
      }

      // Insert user
      let sql = 'INSERT INTO users (name, email, password, role';
      let params = [name, email, hashedPassword, role];
      if (role === 'student' || role === 'staff') {
        sql += ', collegeCode) VALUES (?, ?, ?, ?, ?)';
        params.push(collegeCode);
      } else {
        sql += ') VALUES (?, ?, ?, ?)';
      }
      db.run(sql, params, function insertUser(err) {
          if (err) {
            console.error(`❌ Error creating user ${email}:`, err.message);
            processed++;
            if (processed === total) {
              console.log('\n✅ Seeding completed!\n');
              process.exit(0);
            }
            return;
          }

          const userId = this.lastID;
          console.log(`✅ Created ${role} user: ${email} (ID: ${userId})`);

          // Create role-specific records
          if (role === 'student' && studentData) {
            db.run(
              'INSERT INTO students (userId, registerNumber, department, skills, cgpa, approved) VALUES (?, ?, ?, ?, ?, ?)',
              [userId, studentData.registerNumber, studentData.department, studentData.skills, studentData.cgpa, studentData.approved],
              (err) => {
                if (err) console.error(`   ⚠️  Error creating student record:`, err.message);
                else console.log(`   ✅ Student profile created`);
              }
            );
          } else if (role === 'staff' && staffData) {
            db.run(
              'INSERT INTO staff (userId, department) VALUES (?, ?)',
              [userId, staffData.department],
              (err) => {
                if (err) console.error(`   ⚠️  Error creating staff record:`, err.message);
                else console.log(`   ✅ Staff profile created`);
              }
            );
          } else if (role === 'company' && companyData) {
            db.run(
              'INSERT INTO companies (userId, name, description) VALUES (?, ?, ?)',
              [userId, companyData.name, companyData.description],
              function insertCompany(err) {
                if (err) {
                  console.error(`   ⚠️  Error creating company record:`, err.message);
                } else {
                  console.log(`   ✅ Company profile created (Company ID: ${this.lastID})`);
                  
                  // Create sample jobs and courses for companies
                  if (companyData.name === 'Tech Corp Solutions') {
                    // Create sample jobs
                    db.run(
                      'INSERT INTO jobs (companyId, title, description, department, requiredSkills) VALUES (?, ?, ?, ?, ?)',
                      [this.lastID, 'Software Engineer', 'Looking for a skilled software engineer with experience in full-stack development.', 'CSE', 'JavaScript, React, Node.js, SQL'],
                      () => {}
                    );
                    db.run(
                      'INSERT INTO jobs (companyId, title, description, department, requiredSkills) VALUES (?, ?, ?, ?, ?)',
                      [this.lastID, 'Frontend Developer', 'Join our team to build amazing user interfaces.', 'CSE', 'React, TypeScript, CSS'],
                      () => {}
                    );
                    
                    // Create sample courses
                    db.run(
                      'INSERT INTO courses (companyId, title, description, department, requiredSkills) VALUES (?, ?, ?, ?, ?)',
                      [this.lastID, 'Full Stack Development Bootcamp', 'Comprehensive 12-week bootcamp covering modern web development.', 'CSE', 'Basic programming knowledge'],
                      () => {}
                    );

                    // Create sample internships
                    db.run(
                      'INSERT INTO internships (companyId, title, description, department, duration, stipend, requiredSkills, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                      [this.lastID, 'Software Development Intern', 'Gain hands-on experience in software development with our expert team.', 'CSE', '6 months', 15000, 'JavaScript, React, Node.js', 'Mumbai, India'],
                      () => {}
                    );
                    db.run(
                      'INSERT INTO internships (companyId, title, description, department, duration, stipend, requiredSkills, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                      [this.lastID, 'Data Science Intern', 'Work on real data projects and learn advanced analytics techniques.', 'CSE', '3 months', 12000, 'Python, SQL, Statistics', 'Remote'],
                      () => {}
                    );
                  } else if (companyData.name === 'Skills Development Centre') {
                    db.run(
                      'INSERT INTO courses (companyId, title, description, department, requiredSkills) VALUES (?, ?, ?, ?, ?)',
                      [this.lastID, 'Data Science Certification', 'Learn data analysis, machine learning, and visualization.', 'CSE', 'Python, Mathematics'],
                      () => {}
                    );
                  }
                }
              }
            );
          }

          // Note: Academic courses are not inserted here as they are not company-provided courses
          // Sample company courses are inserted above for companies

          processed++;
          if (processed === total) {
            setTimeout(() => {
              console.log('\n✅ Seeding completed!\n');
              console.log('📋 TEST CREDENTIALS:\n');
              console.log('👨‍🎓 STUDENT DASHBOARD:');
              console.log('   Email: student@college.edu');
              console.log('   Password: student123\n');
              console.log('👨‍💼 STAFF DASHBOARD:');
              console.log('   Email: staff@college.edu');
              console.log('   Password: staff123\n');
              console.log('🏢 COMPANY DASHBOARD:');
              console.log('   Email: company@techcorp.com');
              console.log('   Password: company123\n');
              console.log('📝 ADDITIONAL TEST ACCOUNTS:');
              console.log('   Student (Pending): sarah@college.edu / student123');
              console.log('   Company: coaching@skills.com / company123\n');
              process.exit(0);
            }, 500);
          }
        }
      );
    });
  });
}

// Run seed
seedDatabase();
