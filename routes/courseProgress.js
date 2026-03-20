const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const progressController = require('../controllers/courseProgressController');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// COURSE MODULES ROUTES
// ============================================

// Get modules for a course (accessible by all)
router.get('/courses/:courseId/modules', progressController.getCourseModules);

// Add module to course (company/staff only)
router.post('/courses/:courseId/modules', 
  authorize(['company', 'staff']), 
  progressController.addCourseModule
);

// ============================================
// ATTENDANCE ROUTES
// ============================================

// Mark attendance (staff/company only)
router.post('/attendance', 
  authorize(['staff', 'company']), 
  progressController.markAttendance
);

// Get student attendance
router.get('/attendance/:studentId/:courseId', progressController.getStudentAttendance);

// ============================================
// MODULE PROGRESS ROUTES
// ============================================

// Update module progress (student)
router.post('/progress/module', 
  authorize(['student']), 
  progressController.updateModuleProgress
);

// Get module progress
router.get('/progress/modules/:studentId/:courseId', progressController.getModuleProgress);

// ============================================
// PRACTICE/ASSIGNMENT ROUTES
// ============================================

// Get practices for a course
router.get('/courses/:courseId/practices', progressController.getCoursePractices);

// Add practice (company/staff only)
router.post('/practices', 
  authorize(['company', 'staff']), 
  progressController.addPractice
);

// Submit practice (student)
router.post('/practices/submit', 
  authorize(['student']), 
  progressController.submitPractice
);

// Grade practice (company/staff only)
router.put('/practices/grade/:submissionId', 
  authorize(['company', 'staff']), 
  progressController.gradePractice
);

// Get student practice submissions
router.get('/practices/:studentId/:courseId', progressController.getStudentPractices);

// ============================================
// OVERALL PROGRESS ROUTES
// ============================================

// Get overall course progress for a student
router.get('/progress/:studentId/:courseId', progressController.getCourseProgress);

// Get all students progress in a course (company/staff only)
router.get('/progress/course/:courseId', 
  authorize(['company', 'staff']), 
  progressController.getAllStudentsProgress
);

// ============================================
// STUDY SESSIONS ROUTES
// ============================================

// Log study session (student)
router.post('/sessions', 
  authorize(['student']), 
  progressController.logStudySession
);

// Get study sessions
router.get('/sessions/:studentId/:courseId', progressController.getStudySessions);

module.exports = router;
