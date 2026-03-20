// Course Progress Tracking Schema
const db = require('./db');

// Create tables for course progress tracking
db.serialize(() => {
  // Course content modules/topics
  db.run(`
    CREATE TABLE IF NOT EXISTS course_modules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      courseId INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      orderIndex INTEGER DEFAULT 0,
      duration INTEGER,
      contentType TEXT,
      contentUrl TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Error creating course_modules:', err);
    else console.log('✓ course_modules table ready');
  });

  // Student attendance tracking
  db.run(`
    CREATE TABLE IF NOT EXISTS student_attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId INTEGER NOT NULL,
      courseId INTEGER NOT NULL,
      moduleId INTEGER,
      attendanceDate DATE NOT NULL,
      status TEXT CHECK(status IN ('present', 'absent', 'late')) DEFAULT 'present',
      duration INTEGER,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (moduleId) REFERENCES course_modules(id) ON DELETE SET NULL,
      UNIQUE(studentId, courseId, attendanceDate)
    )
  `, (err) => {
    if (err) console.error('Error creating student_attendance:', err);
    else console.log('✓ student_attendance table ready');
  });

  // Student module progress
  db.run(`
    CREATE TABLE IF NOT EXISTS student_module_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId INTEGER NOT NULL,
      courseId INTEGER NOT NULL,
      moduleId INTEGER NOT NULL,
      status TEXT CHECK(status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
      progressPercentage INTEGER DEFAULT 0,
      timeSpent INTEGER DEFAULT 0,
      lastAccessedAt DATETIME,
      completedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (moduleId) REFERENCES course_modules(id) ON DELETE CASCADE,
      UNIQUE(studentId, moduleId)
    )
  `, (err) => {
    if (err) console.error('Error creating student_module_progress:', err);
    else console.log('✓ student_module_progress table ready');
  });

  // Practice exercises/assignments
  db.run(`
    CREATE TABLE IF NOT EXISTS course_practices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      courseId INTEGER NOT NULL,
      moduleId INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      practiceType TEXT CHECK(practiceType IN ('quiz', 'assignment', 'project', 'exercise', 'lab')) DEFAULT 'exercise',
      difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
      maxScore INTEGER DEFAULT 100,
      timeLimit INTEGER,
      dueDate DATETIME,
      isActive INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (moduleId) REFERENCES course_modules(id) ON DELETE SET NULL
    )
  `, (err) => {
    if (err) console.error('Error creating course_practices:', err);
    else console.log('✓ course_practices table ready');
  });

  // Student practice submissions
  db.run(`
    CREATE TABLE IF NOT EXISTS student_practice_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId INTEGER NOT NULL,
      practiceId INTEGER NOT NULL,
      submissionText TEXT,
      submissionUrl TEXT,
      score INTEGER,
      feedback TEXT,
      status TEXT CHECK(status IN ('pending', 'submitted', 'graded', 'late')) DEFAULT 'pending',
      attempts INTEGER DEFAULT 0,
      timeSpent INTEGER DEFAULT 0,
      submittedAt DATETIME,
      gradedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (practiceId) REFERENCES course_practices(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Error creating student_practice_submissions:', err);
    else console.log('✓ student_practice_submissions table ready');
  });

  // Overall course progress summary
  db.run(`
    CREATE TABLE IF NOT EXISTS student_course_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId INTEGER NOT NULL,
      courseId INTEGER NOT NULL,
      overallProgress INTEGER DEFAULT 0,
      modulesCompleted INTEGER DEFAULT 0,
      totalModules INTEGER DEFAULT 0,
      practicesCompleted INTEGER DEFAULT 0,
      totalPractices INTEGER DEFAULT 0,
      attendancePercentage REAL DEFAULT 0,
      averageScore REAL DEFAULT 0,
      totalTimeSpent INTEGER DEFAULT 0,
      lastActivityAt DATETIME,
      startedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      completedAt DATETIME,
      certificateIssued INTEGER DEFAULT 0,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(studentId, courseId)
    )
  `, (err) => {
    if (err) console.error('Error creating student_course_progress:', err);
    else console.log('✓ student_course_progress table ready');
  });

  // Study sessions tracking
  db.run(`
    CREATE TABLE IF NOT EXISTS student_study_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId INTEGER NOT NULL,
      courseId INTEGER NOT NULL,
      moduleId INTEGER,
      sessionDate DATE NOT NULL,
      startTime DATETIME NOT NULL,
      endTime DATETIME,
      duration INTEGER,
      activityType TEXT,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (moduleId) REFERENCES course_modules(id) ON DELETE SET NULL
    )
  `, (err) => {
    if (err) console.error('Error creating student_study_sessions:', err);
    else console.log('✓ student_study_sessions table ready');
  });
});

console.log('Course progress tracking schema initialized');

module.exports = db;
