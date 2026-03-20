const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Database file path (lightweight, file-based)
const dbPath = path.join(__dirname, 'portal.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize tables with simple schema suitable for the portal
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('student','staff','company')) NOT NULL,
      collegeCode TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add collegeCode column if it doesn't exist
  db.run(`ALTER TABLE users ADD COLUMN collegeCode TEXT;`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding collegeCode column:', err);
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER UNIQUE NOT NULL,
      registerNumber TEXT,
      department TEXT,
      yearOfStudy INTEGER,
      phone TEXT,
      address TEXT,
      dateOfBirth DATE,
      gender TEXT,
      skills TEXT,
      cgpa REAL,
      resumePath TEXT,
      photoPath TEXT,
      approved INTEGER DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Add new columns if they don't exist
  const newStudentColumns = [
    'ALTER TABLE students ADD COLUMN yearOfStudy INTEGER;',
    'ALTER TABLE students ADD COLUMN phone TEXT;',
    'ALTER TABLE students ADD COLUMN address TEXT;',
    'ALTER TABLE students ADD COLUMN dateOfBirth DATE;',
    'ALTER TABLE students ADD COLUMN gender TEXT;',
    'ALTER TABLE students ADD COLUMN photoPath TEXT;',
    'ALTER TABLE students ADD COLUMN eligibility TEXT;'
  ];
  newStudentColumns.forEach(sql => {
    db.run(sql, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding column:', err);
      }
    });
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER UNIQUE NOT NULL,
      department TEXT,
      phone TEXT,
      address TEXT,
      designation TEXT,
      experience INTEGER,
      qualifications TEXT,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Add new columns if they don't exist
  const newStaffColumns = [
    'ALTER TABLE staff ADD COLUMN phone TEXT;',
    'ALTER TABLE staff ADD COLUMN address TEXT;',
    'ALTER TABLE staff ADD COLUMN designation TEXT;',
    'ALTER TABLE staff ADD COLUMN experience INTEGER;',
    'ALTER TABLE staff ADD COLUMN qualifications TEXT;'
  ];
  newStaffColumns.forEach(sql => {
    db.run(sql, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding column:', err);
      }
    });
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      phone TEXT,
      website TEXT,
      address TEXT,
      industry TEXT,
      companySize TEXT,
      email TEXT,
      foundedYear INTEGER,
      companyType TEXT,
      city TEXT,
      state TEXT,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Add new columns if they don't exist
  const newCompanyColumns = [
    'ALTER TABLE companies ADD COLUMN phone TEXT;',
    'ALTER TABLE companies ADD COLUMN website TEXT;',
    'ALTER TABLE companies ADD COLUMN address TEXT;',
    'ALTER TABLE companies ADD COLUMN industry TEXT;',
    'ALTER TABLE companies ADD COLUMN companySize TEXT;',
    'ALTER TABLE companies ADD COLUMN email TEXT;',
    'ALTER TABLE companies ADD COLUMN foundedYear INTEGER;',
    'ALTER TABLE companies ADD COLUMN companyType TEXT;',
    'ALTER TABLE companies ADD COLUMN city TEXT;',
    'ALTER TABLE companies ADD COLUMN state TEXT;'
  ];
  newCompanyColumns.forEach(sql => {
    db.run(sql, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding column:', err);
      }
    });
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      companyId INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      department TEXT,
      requiredSkills TEXT,
      workflowStatus TEXT DEFAULT 'published',
      reviewedBy INTEGER,
      reviewedAt DATETIME,
      reviewNotes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  const newJobColumns = [
    'ALTER TABLE jobs ADD COLUMN workflowStatus TEXT DEFAULT \'published\';',
    'ALTER TABLE jobs ADD COLUMN reviewedBy INTEGER;',
    'ALTER TABLE jobs ADD COLUMN reviewedAt DATETIME;',
    'ALTER TABLE jobs ADD COLUMN reviewNotes TEXT;'
  ];
  newJobColumns.forEach(sql => {
    db.run(sql, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding column to jobs:', err);
      }
    });
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      companyId INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      department TEXT,
      requiredSkills TEXT,
      fees REAL,
      duration TEXT,
      mode TEXT,
      courseLink TEXT,
      category TEXT,
      credits INTEGER DEFAULT 0,
      platform TEXT,
      status TEXT DEFAULT 'published',
      workflowStatus TEXT DEFAULT 'published',
      reviewedBy INTEGER,
      reviewedAt DATETIME,
      reviewNotes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Add new columns to courses table if they don't exist
  const newCourseColumns = [
    'ALTER TABLE courses ADD COLUMN category TEXT;',
    'ALTER TABLE courses ADD COLUMN credits INTEGER DEFAULT 0;',
    'ALTER TABLE courses ADD COLUMN platform TEXT;',
    'ALTER TABLE courses ADD COLUMN status TEXT DEFAULT \'published\';',
    'ALTER TABLE courses ADD COLUMN fees REAL;',
    'ALTER TABLE courses ADD COLUMN duration TEXT;',
    'ALTER TABLE courses ADD COLUMN mode TEXT;',
    'ALTER TABLE courses ADD COLUMN courseLink TEXT;',
    'ALTER TABLE courses ADD COLUMN workflowStatus TEXT DEFAULT \'published\';',
    'ALTER TABLE courses ADD COLUMN reviewedBy INTEGER;',
    'ALTER TABLE courses ADD COLUMN reviewedAt DATETIME;',
    'ALTER TABLE courses ADD COLUMN reviewNotes TEXT;'
  ];
  newCourseColumns.forEach(sql => {
    db.run(sql, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding column to courses:', err);
      }
    });
  });


  db.run(`
    CREATE TABLE IF NOT EXISTS internships (
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
      workflowStatus TEXT DEFAULT 'published',
      reviewedBy INTEGER,
      reviewedAt DATETIME,
      reviewNotes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  const newInternshipColumns = [
    'ALTER TABLE internships ADD COLUMN workflowStatus TEXT DEFAULT \'published\';',
    'ALTER TABLE internships ADD COLUMN reviewedBy INTEGER;',
    'ALTER TABLE internships ADD COLUMN reviewedAt DATETIME;',
    'ALTER TABLE internships ADD COLUMN reviewNotes TEXT;'
  ];
  newInternshipColumns.forEach(sql => {
    db.run(sql, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding column to internships:', err);
      }
    });
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId INTEGER NOT NULL,
      targetType TEXT CHECK(targetType IN ('job','course','internship')) NOT NULL,
      targetId INTEGER NOT NULL,
      status TEXT DEFAULT 'applied',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
    )
  `);
  db.run(`ALTER TABLE applications ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP;`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding column to applications:', err);
    }
  });

  // Course enrollments table for tracking student enrollments in courses
  db.run(`
    CREATE TABLE IF NOT EXISTS course_enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId INTEGER NOT NULL,
      courseId INTEGER NOT NULL,
      status TEXT DEFAULT 'enrolled',
      progress INTEGER DEFAULT 0,
      enrolledAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
    )
  `);

  // Student extra courses table for tracking additional courses taken by students
  db.run(`
    CREATE TABLE IF NOT EXISTS student_extra_courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId INTEGER NOT NULL,
      courseName TEXT NOT NULL,
      platform TEXT,
      category TEXT,
      credits INTEGER DEFAULT 0,
      completionDate DATE,
      certificateUrl TEXT,
      grade TEXT,
      status TEXT DEFAULT 'in_progress',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
    )
  `);

  // Cart table for students to add courses before enrolling
  db.run(`
    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId INTEGER NOT NULL,
      courseId INTEGER NOT NULL,
      addedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(studentId, courseId)
    )
  `);

  // Attendance table for tracking student internship attendance
  db.run(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId INTEGER NOT NULL,
      internshipId INTEGER NOT NULL,
      attendanceDate DATE NOT NULL,
      present INTEGER DEFAULT 0,
      presentedByCompany TEXT,
      staffName TEXT,
      staffArea TEXT,
      monitorStaff TEXT,
      notes TEXT,
      markedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (internshipId) REFERENCES internships(id) ON DELETE CASCADE,
      UNIQUE(studentId, internshipId, attendanceDate)
    )
  `);

  const newAttendanceColumns = [
    'ALTER TABLE attendance ADD COLUMN staffName TEXT;',
    'ALTER TABLE attendance ADD COLUMN staffArea TEXT;',
    'ALTER TABLE attendance ADD COLUMN monitorStaff TEXT;'
  ];
  newAttendanceColumns.forEach(sql => {
    db.run(sql, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding column to attendance:', err);
      }
    });
  });

  // Saved searches for smart search presets
  db.run(`
    CREATE TABLE IF NOT EXISTS saved_searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId INTEGER NOT NULL,
      name TEXT NOT NULL,
      searchType TEXT DEFAULT 'all',
      searchParams TEXT,
      lastNotifiedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
    )
  `);

  // Course wishlist for students
  db.run(`
    CREATE TABLE IF NOT EXISTS course_wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId INTEGER NOT NULL,
      courseId INTEGER NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(studentId, courseId)
    )
  `);

  // User notifications (in-app alerts)
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      data TEXT,
      notificationKey TEXT UNIQUE,
      isRead INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Student chat history for AI assistant
  db.run(`
    CREATE TABLE IF NOT EXISTS student_chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId INTEGER NOT NULL,
      userMessage TEXT NOT NULL,
      aiResponse TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
    )
  `);

  // Company queries from students and staff
  db.run(`
    CREATE TABLE IF NOT EXISTS company_queries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      companyId INTEGER NOT NULL,
      senderUserId INTEGER NOT NULL,
      senderRole TEXT CHECK(senderRole IN ('student','staff')) NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      reply TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (senderUserId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Search analytics events
  db.run(`
    CREATE TABLE IF NOT EXISTS search_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      role TEXT NOT NULL,
      searchType TEXT NOT NULL,
      keyword TEXT,
      filters TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Query performance indexes
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_courses_department_status ON courses(department, status, workflowStatus, createdAt);',
    'CREATE INDEX IF NOT EXISTS idx_courses_category_platform ON courses(category, platform);',
    'CREATE INDEX IF NOT EXISTS idx_jobs_department_workflow ON jobs(department, workflowStatus, createdAt);',
    'CREATE INDEX IF NOT EXISTS idx_internships_department_workflow ON internships(department, workflowStatus, createdAt);',
    'CREATE INDEX IF NOT EXISTS idx_wishlist_student ON course_wishlist(studentId, createdAt);',
    'CREATE INDEX IF NOT EXISTS idx_wishlist_course ON course_wishlist(courseId);',
    'CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(userId, isRead, createdAt);',
    'CREATE INDEX IF NOT EXISTS idx_search_events_keyword ON search_events(searchType, keyword, createdAt);',
    'CREATE INDEX IF NOT EXISTS idx_saved_searches_student ON saved_searches(studentId, createdAt);',
    'CREATE INDEX IF NOT EXISTS idx_company_queries_company_status ON company_queries(companyId, status, createdAt);',
    'CREATE INDEX IF NOT EXISTS idx_company_queries_sender ON company_queries(senderUserId, senderRole, createdAt);'
  ];
  indexes.forEach(sql => {
    db.run(sql, (err) => {
      if (err) {
        console.error('Error creating index:', err);
      }
    });
  });
});

module.exports = db;
