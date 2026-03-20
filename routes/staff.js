const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const staffController = require('../controllers/staffController');

const router = express.Router();
router.use(authenticate, authorize(['staff']));

router.get('/students', staffController.listStudents);
router.get('/students/:id', staffController.getStudent);
router.get('/students/:id/profile', staffController.getStudentProfile);
router.get('/students/:id/courses', staffController.getStudentCourses);
router.get('/students/:id/cart', staffController.getStudentCart);
router.get('/students/:id/attendance', staffController.getStudentAttendance);
router.put('/students/:id', staffController.updateStudent);
router.delete('/students/:id', staffController.deleteStudent);
router.put('/students/:id/approve', staffController.approveStudent);
router.get('/companies', staffController.getCompanies);
router.get('/opportunities', staffController.getOpportunities);
router.get('/courses', staffController.getCourses);
router.get('/analytics', staffController.getAnalytics);
router.delete('/analytics/search-keyword/:keyword/:searchType', staffController.deleteSearchKeyword);
router.get('/wishlist-trends', staffController.getWishlistTrends);
router.get('/approvals', staffController.getApprovals);
router.put('/approvals/:type/:id', staffController.updateApprovalStatus);
router.post('/assign', staffController.assignStudentToOpportunity);
router.get('/stats', staffController.getStats);
router.get('/applications', staffController.getApplications);
router.get('/queries', staffController.listQueries);
router.post('/queries', staffController.createQuery);

module.exports = router;
