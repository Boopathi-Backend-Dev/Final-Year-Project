const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticate, authorize } = require('../middleware/auth');
const studentController = require('../controllers/studentController');

const router = express.Router();

// Simple disk storage for resumes
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, path.join(__dirname, '../public/uploads')),
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

router.use(authenticate, authorize(['student']));

router.get('/profile', studentController.getProfile);
// Accept both POST and PUT for profile updates to match frontend uploads
router.post('/profile', upload.any(), studentController.upsertProfile);
router.put('/profile', upload.any(), studentController.upsertProfile);
router.get('/companies', studentController.getCompanies);
router.get('/jobs', studentController.getJobs);
router.get('/courses', studentController.getCourses);
router.get('/internships', studentController.getInternships);
router.get('/recommendations', studentController.getRecommendations);
router.get('/saved-searches', studentController.getSavedSearches);
router.post('/saved-searches', studentController.createSavedSearch);
router.delete('/saved-searches/:id', studentController.deleteSavedSearch);
router.get('/wishlist', studentController.getWishlist);
router.post('/wishlist', studentController.addToWishlist);
router.delete('/wishlist/:courseId', studentController.removeFromWishlist);
router.get('/notifications', studentController.getNotifications);
router.put('/notifications/read-all', studentController.markAllNotificationsRead);
router.put('/notifications/:id/read', studentController.markNotificationRead);
router.delete('/notifications/:id', studentController.deleteNotification);
router.get('/applied-internships', studentController.getAppliedInternships);
router.post('/apply', studentController.apply);
router.get('/applications', studentController.myApplications);
router.delete('/applications/:id', studentController.deleteApplication);
router.get('/attendance', studentController.getAttendance);
router.get('/queries', studentController.listQueries);
router.post('/queries', studentController.createQuery);

// Extra courses CRUD routes
router.get('/extra-courses', studentController.getExtraCourses);
router.post('/extra-courses', studentController.addExtraCourse);
router.put('/extra-courses/:id', studentController.updateExtraCourse);
router.delete('/extra-courses/:id', studentController.deleteExtraCourse);

// AI Chat routes
router.post('/ai-chat', studentController.sendAIMessage);
router.get('/ai-chat/history', studentController.getChatHistory);
router.delete('/ai-chat/history', studentController.clearChatHistory);

module.exports = router;
