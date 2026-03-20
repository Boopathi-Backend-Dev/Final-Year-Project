const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);

// Check if Google auth is enabled
router.get('/google-enabled', (req, res) => {
  res.json({ enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) });
});

// Google OAuth routes
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
      // Generate JWT token for the authenticated user
      const jwt = require('jsonwebtoken');
      const { SECRET } = require('../middleware/auth');
      const token = jwt.sign({ id: req.user.id, role: req.user.role, name: req.user.name }, SECRET, { expiresIn: '2h' });

      // Redirect to appropriate dashboard with token
      const dashboardMap = {
        student: '/student/dashboard.html',
        staff: '/staff/dashboard.html',
        company: '/company/dashboard.html'
      };
      const dashboard = dashboardMap[req.user.role] || '/';
      res.redirect(`${dashboard}?token=${token}`);
    }
  );
}

module.exports = router;
