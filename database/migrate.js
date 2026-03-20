const db = require('./db');

// Run migrations
db.serialize(() => {
  // Add fees to courses
  db.run(`ALTER TABLE courses ADD COLUMN fees REAL`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding fees column:', err.message);
    } else {
      console.log('Added fees column to courses');
    }
  });

  // Add logoPath to companies
  db.run(`ALTER TABLE companies ADD COLUMN logoPath TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding logoPath column:', err.message);
    } else {
      console.log('Added logoPath column to companies');
    }
  });

  // Add videoPath to companies
  db.run(`ALTER TABLE companies ADD COLUMN videoPath TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding videoPath column:', err.message);
    } else {
      console.log('Added videoPath column to companies');
    }
  });

  // Add images to companies
  db.run(`ALTER TABLE companies ADD COLUMN images TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding images column:', err.message);
    } else {
      console.log('Added images column to companies');
    }
  });

  // Add URL-based columns to companies
  db.run(`ALTER TABLE companies ADD COLUMN logoUrl TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding logoUrl column:', err.message);
    } else {
      console.log('Added logoUrl column to companies');
    }
  });

  db.run(`ALTER TABLE companies ADD COLUMN videoUrl TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding videoUrl column:', err.message);
    } else {
      console.log('Added videoUrl column to companies');
    }
  });

  db.run(`ALTER TABLE companies ADD COLUMN websiteUrl TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding websiteUrl column:', err.message);
    } else {
      console.log('Added websiteUrl column to companies');
    }
  });

  db.run(`ALTER TABLE companies ADD COLUMN imageUrls TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding imageUrls column:', err.message);
    } else {
      console.log('Added imageUrls column to companies');
    }
  });

  // Add new course columns
  db.run(`ALTER TABLE courses ADD COLUMN duration TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding duration column:', err.message);
    } else {
      console.log('Added duration column to courses');
    }
  });

  db.run(`ALTER TABLE courses ADD COLUMN mode TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding mode column:', err.message);
    } else {
      console.log('Added mode column to courses');
    }
  });

  db.run(`ALTER TABLE courses ADD COLUMN courseLink TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding courseLink column:', err.message);
    } else {
      console.log('Added courseLink column to courses');
    }
  });

  // Add basic company profile columns
  db.run(`ALTER TABLE companies ADD COLUMN industry TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding industry column:', err.message);
    } else {
      console.log('Added industry column to companies');
    }
  });

  db.run(`ALTER TABLE companies ADD COLUMN email TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding email column:', err.message);
    } else {
      console.log('Added email column to companies');
    }
  });

  db.run(`ALTER TABLE companies ADD COLUMN phone TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding phone column:', err.message);
    } else {
      console.log('Added phone column to companies');
    }
  });

  db.run(`ALTER TABLE companies ADD COLUMN website TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding website column:', err.message);
    } else {
      console.log('Added website column to companies');
    }
  });

  db.run(`ALTER TABLE companies ADD COLUMN foundedYear INTEGER`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding foundedYear column:', err.message);
    } else {
      console.log('Added foundedYear column to companies');
    }
  });

  db.run(`ALTER TABLE companies ADD COLUMN companySize TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding companySize column:', err.message);
    } else {
      console.log('Added companySize column to companies');
    }
  });

  db.run(`ALTER TABLE companies ADD COLUMN companyType TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding companyType column:', err.message);
    } else {
      console.log('Added companyType column to companies');
    }
  });

  db.run(`ALTER TABLE companies ADD COLUMN address TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding address column:', err.message);
    } else {
      console.log('Added address column to companies');
    }
  });

  db.run(`ALTER TABLE companies ADD COLUMN city TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding city column:', err.message);
    } else {
      console.log('Added city column to companies');
    }
  });

  db.run(`ALTER TABLE companies ADD COLUMN state TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding state column:', err.message);
    } else {
      console.log('Added state column to companies');
    }
  });

  // Create courses table
  db.run(`CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    credits INTEGER DEFAULT 0,
    platform TEXT,
    courseUrl TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating courses table:', err.message);
    } else {
      console.log('Created courses table');
    }
  });

  // Create course_enrollments table
  db.run(`CREATE TABLE IF NOT EXISTS course_enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL,
    courseId INTEGER NOT NULL,
    status TEXT DEFAULT 'enrolled',
    progress INTEGER DEFAULT 0,
    grade TEXT,
    enrolledAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    completedAt DATETIME,
    FOREIGN KEY (studentId) REFERENCES students (id),
    FOREIGN KEY (courseId) REFERENCES courses (id)
  )`, (err) => {
    if (err) {
      console.error('Error creating course_enrollments table:', err.message);
    } else {
      console.log('Created course_enrollments table');
    }
  });

  // Create internships table
  db.run(`CREATE TABLE IF NOT EXISTS internships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    companyId INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    department TEXT,
    duration TEXT,
    stipend REAL,
    requiredSkills TEXT,
    location TEXT,
    applicationDeadline DATE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (companyId) REFERENCES companies (id)
  )`, (err) => {
    if (err) {
      console.error('Error creating internships table:', err.message);
    } else {
      console.log('Created internships table');
    }
  });

  // Add academic tracking columns to students
  db.run(`ALTER TABLE students ADD COLUMN totalCreditsRequired INTEGER DEFAULT 160`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding totalCreditsRequired column:', err.message);
    } else {
      console.log('Added totalCreditsRequired column to students');
    }
  });

  db.run(`ALTER TABLE students ADD COLUMN creditsEarned INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding creditsEarned column:', err.message);
    } else {
      console.log('Added creditsEarned column to students');
    }
  });

  db.run(`ALTER TABLE students ADD COLUMN academicStanding TEXT DEFAULT 'Good'`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding academicStanding column:', err.message);
    } else {
      console.log('Added academicStanding column to students');
    }
  });

  // Update existing students with default academic values
  db.run(`UPDATE students SET totalCreditsRequired = 160 WHERE totalCreditsRequired IS NULL`, (err) => {
    if (err) {
      console.error('Error updating totalCreditsRequired:', err.message);
    } else {
      console.log('Updated totalCreditsRequired for existing students');
    }
  });

  db.run(`UPDATE students SET creditsEarned = 0 WHERE creditsEarned IS NULL`, (err) => {
    if (err) {
      console.error('Error updating creditsEarned:', err.message);
    } else {
      console.log('Updated creditsEarned for existing students');
    }
  });

  db.run(`UPDATE students SET academicStanding = 'Good' WHERE academicStanding IS NULL`, (err) => {
    if (err) {
      console.error('Error updating academicStanding:', err.message);
    } else {
      console.log('Updated academicStanding for existing students');
    }
  });

  // Create student chat history table for AI assistant
  db.run(`CREATE TABLE IF NOT EXISTS student_chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL,
    userMessage TEXT NOT NULL,
    aiResponse TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES students (id) ON DELETE CASCADE
  )`, (err) => {
    if (err) {
      console.error('Error creating student_chat_history table:', err.message);
    } else {
      console.log('Created student_chat_history table for AI assistant');
    }
  });

  console.log('Migrations completed');
  process.exit(0);
});