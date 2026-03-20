const db = require('../database/db');

// ============================================
// COURSE MODULES MANAGEMENT
// ============================================

// Get all modules for a course
exports.getCourseModules = (req, res) => {
  const { courseId } = req.params;
  
  db.all(
    `SELECT * FROM course_modules 
     WHERE courseId = ? AND isActive = 1 
     ORDER BY orderIndex ASC`,
    [courseId],
    (err, modules) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch modules', error: err.message });
      res.json(modules || []);
    }
  );
};

// Add module to course (Company/Staff only)
exports.addCourseModule = (req, res) => {
  const { courseId } = req.params;
  const { title, description, orderIndex, duration, contentType, contentUrl } = req.body;
  
  if (!title) {
    return res.status(400).json({ message: 'Module title is required' });
  }
  
  db.run(
    `INSERT INTO course_modules (courseId, title, description, orderIndex, duration, contentType, contentUrl)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [courseId, title, description, orderIndex || 0, duration, contentType, contentUrl],
    function(err) {
      if (err) return res.status(500).json({ message: 'Failed to add module', error: err.message });
      res.status(201).json({ message: 'Module added successfully', moduleId: this.lastID });
    }
  );
};

// ============================================
// STUDENT ATTENDANCE TRACKING
// ============================================

// Mark attendance for a student
exports.markAttendance = (req, res) => {
  const { studentId, courseId, moduleId, attendanceDate, status, duration, notes } = req.body;
  
  if (!studentId || !courseId || !attendanceDate) {
    return res.status(400).json({ message: 'Student ID, Course ID, and date are required' });
  }
  
  db.run(
    `INSERT OR REPLACE INTO student_attendance 
     (studentId, courseId, moduleId, attendanceDate, status, duration, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [studentId, courseId, moduleId, attendanceDate, status || 'present', duration, notes],
    function(err) {
      if (err) return res.status(500).json({ message: 'Failed to mark attendance', error: err.message });
      
      // Update overall progress
      updateCourseProgress(studentId, courseId);
      
      res.json({ message: 'Attendance marked successfully' });
    }
  );
};

// Get attendance for a student in a course
exports.getStudentAttendance = (req, res) => {
  const { studentId, courseId } = req.params;
  
  db.all(
    `SELECT sa.*, cm.title as moduleName
     FROM student_attendance sa
     LEFT JOIN course_modules cm ON sa.moduleId = cm.id
     WHERE sa.studentId = ? AND sa.courseId = ?
     ORDER BY sa.attendanceDate DESC`,
    [studentId, courseId],
    (err, attendance) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch attendance', error: err.message });
      
      // Calculate attendance percentage
      const totalDays = attendance.length;
      const presentDays = attendance.filter(a => a.status === 'present').length;
      const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;
      
      res.json({
        attendance: attendance || [],
        summary: {
          totalDays,
          presentDays,
          absentDays: attendance.filter(a => a.status === 'absent').length,
          lateDays: attendance.filter(a => a.status === 'late').length,
          attendancePercentage
        }
      });
    }
  );
};

// ============================================
// MODULE PROGRESS TRACKING
// ============================================

// Update module progress for a student
exports.updateModuleProgress = (req, res) => {
  const { studentId, courseId, moduleId, status, progressPercentage, timeSpent } = req.body;
  
  if (!studentId || !courseId || !moduleId) {
    return res.status(400).json({ message: 'Student ID, Course ID, and Module ID are required' });
  }
  
  const completedAt = status === 'completed' ? new Date().toISOString() : null;
  
  db.run(
    `INSERT INTO student_module_progress 
     (studentId, courseId, moduleId, status, progressPercentage, timeSpent, lastAccessedAt, completedAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(studentId, moduleId) DO UPDATE SET
       status = excluded.status,
       progressPercentage = excluded.progressPercentage,
       timeSpent = timeSpent + excluded.timeSpent,
       lastAccessedAt = CURRENT_TIMESTAMP,
       completedAt = COALESCE(excluded.completedAt, completedAt),
       updatedAt = CURRENT_TIMESTAMP`,
    [studentId, courseId, moduleId, status || 'in_progress', progressPercentage || 0, timeSpent || 0, completedAt],
    function(err) {
      if (err) return res.status(500).json({ message: 'Failed to update progress', error: err.message });
      
      // Update overall course progress
      updateCourseProgress(studentId, courseId);
      
      res.json({ message: 'Module progress updated successfully' });
    }
  );
};

// Get module progress for a student
exports.getModuleProgress = (req, res) => {
  const { studentId, courseId } = req.params;
  
  db.all(
    `SELECT smp.*, cm.title as moduleTitle, cm.duration as moduleDuration
     FROM student_module_progress smp
     JOIN course_modules cm ON smp.moduleId = cm.id
     WHERE smp.studentId = ? AND smp.courseId = ?
     ORDER BY cm.orderIndex ASC`,
    [studentId, courseId],
    (err, progress) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch progress', error: err.message });
      res.json(progress || []);
    }
  );
};

// ============================================
// PRACTICE/ASSIGNMENT MANAGEMENT
// ============================================

// Get practices for a course
exports.getCoursePractices = (req, res) => {
  const { courseId } = req.params;
  
  db.all(
    `SELECT cp.*, cm.title as moduleName
     FROM course_practices cp
     LEFT JOIN course_modules cm ON cp.moduleId = cm.id
     WHERE cp.courseId = ? AND cp.isActive = 1
     ORDER BY cp.createdAt DESC`,
    [courseId],
    (err, practices) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch practices', error: err.message });
      res.json(practices || []);
    }
  );
};

// Add practice/assignment
exports.addPractice = (req, res) => {
  const { courseId, moduleId, title, description, practiceType, difficulty, maxScore, timeLimit, dueDate } = req.body;
  
  if (!courseId || !title) {
    return res.status(400).json({ message: 'Course ID and title are required' });
  }
  
  db.run(
    `INSERT INTO course_practices 
     (courseId, moduleId, title, description, practiceType, difficulty, maxScore, timeLimit, dueDate)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [courseId, moduleId, title, description, practiceType || 'exercise', difficulty || 'medium', maxScore || 100, timeLimit, dueDate],
    function(err) {
      if (err) return res.status(500).json({ message: 'Failed to add practice', error: err.message });
      res.status(201).json({ message: 'Practice added successfully', practiceId: this.lastID });
    }
  );
};

// Submit practice/assignment
exports.submitPractice = (req, res) => {
  const { studentId, practiceId, submissionText, submissionUrl, timeSpent } = req.body;
  
  if (!studentId || !practiceId) {
    return res.status(400).json({ message: 'Student ID and Practice ID are required' });
  }
  
  // Check if already submitted
  db.get(
    'SELECT id, attempts FROM student_practice_submissions WHERE studentId = ? AND practiceId = ?',
    [studentId, practiceId],
    (err, existing) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err.message });
      
      if (existing) {
        // Update existing submission
        db.run(
          `UPDATE student_practice_submissions 
           SET submissionText = ?, submissionUrl = ?, status = 'submitted', 
               attempts = attempts + 1, timeSpent = timeSpent + ?, 
               submittedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [submissionText, submissionUrl, timeSpent || 0, existing.id],
          function(err) {
            if (err) return res.status(500).json({ message: 'Failed to update submission', error: err.message });
            res.json({ message: 'Practice resubmitted successfully' });
          }
        );
      } else {
        // Create new submission
        db.run(
          `INSERT INTO student_practice_submissions 
           (studentId, practiceId, submissionText, submissionUrl, status, attempts, timeSpent, submittedAt)
           VALUES (?, ?, ?, ?, 'submitted', 1, ?, CURRENT_TIMESTAMP)`,
          [studentId, practiceId, submissionText, submissionUrl, timeSpent || 0],
          function(err) {
            if (err) return res.status(500).json({ message: 'Failed to submit practice', error: err.message });
            res.status(201).json({ message: 'Practice submitted successfully', submissionId: this.lastID });
          }
        );
      }
    }
  );
};

// Grade practice submission
exports.gradePractice = (req, res) => {
  const { submissionId } = req.params;
  const { score, feedback } = req.body;
  
  if (score === undefined) {
    return res.status(400).json({ message: 'Score is required' });
  }
  
  db.run(
    `UPDATE student_practice_submissions 
     SET score = ?, feedback = ?, status = 'graded', gradedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [score, feedback, submissionId],
    function(err) {
      if (err) return res.status(500).json({ message: 'Failed to grade submission', error: err.message });
      
      // Get student and course info to update overall progress
      db.get(
        `SELECT sps.studentId, cp.courseId 
         FROM student_practice_submissions sps
         JOIN course_practices cp ON sps.practiceId = cp.id
         WHERE sps.id = ?`,
        [submissionId],
        (err, info) => {
          if (!err && info) {
            updateCourseProgress(info.studentId, info.courseId);
          }
        }
      );
      
      res.json({ message: 'Practice graded successfully' });
    }
  );
};

// Get student practice submissions
exports.getStudentPractices = (req, res) => {
  const { studentId, courseId } = req.params;
  
  db.all(
    `SELECT sps.*, cp.title as practiceTitle, cp.practiceType, cp.maxScore, cp.dueDate
     FROM student_practice_submissions sps
     JOIN course_practices cp ON sps.practiceId = cp.id
     WHERE sps.studentId = ? AND cp.courseId = ?
     ORDER BY sps.submittedAt DESC`,
    [studentId, courseId],
    (err, submissions) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch submissions', error: err.message });
      
      // Calculate summary
      const totalSubmissions = submissions.length;
      const gradedSubmissions = submissions.filter(s => s.status === 'graded');
      const averageScore = gradedSubmissions.length > 0 
        ? (gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubmissions.length).toFixed(2)
        : 0;
      
      res.json({
        submissions: submissions || [],
        summary: {
          totalSubmissions,
          gradedSubmissions: gradedSubmissions.length,
          pendingSubmissions: submissions.filter(s => s.status === 'submitted').length,
          averageScore
        }
      });
    }
  );
};

// ============================================
// OVERALL COURSE PROGRESS
// ============================================

// Get overall course progress for a student
exports.getCourseProgress = (req, res) => {
  const { studentId, courseId } = req.params;
  
  db.get(
    `SELECT * FROM student_course_progress 
     WHERE studentId = ? AND courseId = ?`,
    [studentId, courseId],
    (err, progress) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch progress', error: err.message });
      
      if (!progress) {
        // Initialize progress if not exists
        initializeCourseProgress(studentId, courseId, (initErr) => {
          if (initErr) return res.status(500).json({ message: 'Failed to initialize progress' });
          
          db.get(
            'SELECT * FROM student_course_progress WHERE studentId = ? AND courseId = ?',
            [studentId, courseId],
            (err2, newProgress) => {
              if (err2) return res.status(500).json({ message: 'Failed to fetch progress' });
              res.json(newProgress || {});
            }
          );
        });
      } else {
        res.json(progress);
      }
    }
  );
};

// Get progress for all students in a course (for instructors)
exports.getAllStudentsProgress = (req, res) => {
  const { courseId } = req.params;
  
  db.all(
    `SELECT scp.*, s.registerNumber, u.name as studentName, s.department
     FROM student_course_progress scp
     JOIN students s ON scp.studentId = s.id
     JOIN users u ON s.userId = u.id
     WHERE scp.courseId = ?
     ORDER BY scp.overallProgress DESC`,
    [courseId],
    (err, progressList) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch progress', error: err.message });
      res.json(progressList || []);
    }
  );
};

// ============================================
// STUDY SESSIONS TRACKING
// ============================================

// Log study session
exports.logStudySession = (req, res) => {
  const { studentId, courseId, moduleId, sessionDate, startTime, endTime, duration, activityType, notes } = req.body;
  
  if (!studentId || !courseId || !sessionDate || !startTime) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  
  db.run(
    `INSERT INTO student_study_sessions 
     (studentId, courseId, moduleId, sessionDate, startTime, endTime, duration, activityType, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [studentId, courseId, moduleId, sessionDate, startTime, endTime, duration, activityType, notes],
    function(err) {
      if (err) return res.status(500).json({ message: 'Failed to log session', error: err.message });
      
      // Update overall progress
      updateCourseProgress(studentId, courseId);
      
      res.status(201).json({ message: 'Study session logged successfully', sessionId: this.lastID });
    }
  );
};

// Get study sessions for a student
exports.getStudySessions = (req, res) => {
  const { studentId, courseId } = req.params;
  
  db.all(
    `SELECT sss.*, cm.title as moduleName
     FROM student_study_sessions sss
     LEFT JOIN course_modules cm ON sss.moduleId = cm.id
     WHERE sss.studentId = ? AND sss.courseId = ?
     ORDER BY sss.sessionDate DESC, sss.startTime DESC`,
    [studentId, courseId],
    (err, sessions) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch sessions', error: err.message });
      
      // Calculate total study time
      const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      const totalHours = (totalMinutes / 60).toFixed(2);
      
      res.json({
        sessions: sessions || [],
        summary: {
          totalSessions: sessions.length,
          totalMinutes,
          totalHours
        }
      });
    }
  );
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Initialize course progress for a student
function initializeCourseProgress(studentId, courseId, callback) {
  // Count total modules and practices
  db.get(
    'SELECT COUNT(*) as totalModules FROM course_modules WHERE courseId = ? AND isActive = 1',
    [courseId],
    (err, moduleCount) => {
      if (err) return callback(err);
      
      db.get(
        'SELECT COUNT(*) as totalPractices FROM course_practices WHERE courseId = ? AND isActive = 1',
        [courseId],
        (err2, practiceCount) => {
          if (err2) return callback(err2);
          
          db.run(
            `INSERT INTO student_course_progress 
             (studentId, courseId, totalModules, totalPractices)
             VALUES (?, ?, ?, ?)`,
            [studentId, courseId, moduleCount.totalModules, practiceCount.totalPractices],
            callback
          );
        }
      );
    }
  );
}

// Update overall course progress
function updateCourseProgress(studentId, courseId) {
  // Get completed modules count
  db.get(
    `SELECT COUNT(*) as completed FROM student_module_progress 
     WHERE studentId = ? AND courseId = ? AND status = 'completed'`,
    [studentId, courseId],
    (err, moduleProgress) => {
      if (err) return;
      
      // Get completed practices count
      db.get(
        `SELECT COUNT(*) as completed, AVG(score) as avgScore 
         FROM student_practice_submissions sps
         JOIN course_practices cp ON sps.practiceId = cp.id
         WHERE sps.studentId = ? AND cp.courseId = ? AND sps.status = 'graded'`,
        [studentId, courseId],
        (err2, practiceProgress) => {
          if (err2) return;
          
          // Get attendance percentage
          db.get(
            `SELECT 
               COUNT(*) as totalDays,
               SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as presentDays
             FROM student_attendance
             WHERE studentId = ? AND courseId = ?`,
            [studentId, courseId],
            (err3, attendance) => {
              if (err3) return;
              
              const attendancePercentage = attendance.totalDays > 0 
                ? ((attendance.presentDays / attendance.totalDays) * 100).toFixed(2)
                : 0;
              
              // Get total time spent
              db.get(
                `SELECT SUM(timeSpent) as totalTime FROM student_module_progress 
                 WHERE studentId = ? AND courseId = ?`,
                [studentId, courseId],
                (err4, timeData) => {
                  if (err4) return;
                  
                  // Calculate overall progress
                  db.get(
                    'SELECT totalModules, totalPractices FROM student_course_progress WHERE studentId = ? AND courseId = ?',
                    [studentId, courseId],
                    (err5, totals) => {
                      if (err5 || !totals) return;
                      
                      const moduleProgress = totals.totalModules > 0 
                        ? (moduleProgress.completed / totals.totalModules) * 50 
                        : 0;
                      const practiceProgressPercent = totals.totalPractices > 0 
                        ? (practiceProgress.completed / totals.totalPractices) * 50 
                        : 0;
                      const overallProgress = Math.round(moduleProgress + practiceProgressPercent);
                      
                      // Update progress
                      db.run(
                        `UPDATE student_course_progress 
                         SET overallProgress = ?,
                             modulesCompleted = ?,
                             practicesCompleted = ?,
                             attendancePercentage = ?,
                             averageScore = ?,
                             totalTimeSpent = ?,
                             lastActivityAt = CURRENT_TIMESTAMP,
                             updatedAt = CURRENT_TIMESTAMP
                         WHERE studentId = ? AND courseId = ?`,
                        [
                          overallProgress,
                          moduleProgress.completed,
                          practiceProgress.completed,
                          attendancePercentage,
                          practiceProgress.avgScore || 0,
                          timeData.totalTime || 0,
                          studentId,
                          courseId
                        ]
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}

module.exports = exports;
