const express = require('express');
const db = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');
const companyController = require('../controllers/companyController');

const router = express.Router();

// Attach companyId to req.user for convenience
router.use(authenticate, authorize(['company']), (req, res, next) => {
  db.get('SELECT id FROM companies WHERE userId = ?', [req.user.id], (err, row) => {
    if (err || !row) return res.status(400).json({ message: 'Company not found' });
    req.user.companyId = row.id;
    next();
  });
});

router.post('/jobs', companyController.createJob);
router.get('/jobs', companyController.getJobs);
router.post('/courses', companyController.createCourse);
router.get('/courses', companyController.getCourses);
router.post('/internships', companyController.createInternship);
router.get('/internships', companyController.getInternships);
router.put('/workflow/:type/:id/submit', companyController.submitForReview);
router.get('/applications', companyController.viewApplicants);
router.put('/applications/:applicationId', companyController.updateApplication);
router.get('/student-profile/:studentId', companyController.getStudentProfile);
router.get('/internships/:internshipId/attendance', companyController.getInternshipAttendance);
router.post('/attendance', companyController.markAttendance);
router.get('/profile', companyController.getProfile);
router.post('/profile', companyController.updateProfile);
router.get('/queries', companyController.getQueries);
router.put('/queries/:id', companyController.updateQuery);

module.exports = router;
