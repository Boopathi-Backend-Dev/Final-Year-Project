const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();
require('./database/db'); // ensure tables exist

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const staffRoutes = require('./routes/staff');
const companyRoutes = require('./routes/company');
const courseProgressRoutes = require('./routes/courseProgress');

const app = express();
const PORT = process.env.PORT || 4001;

// Passport configuration (only if Google credentials are provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL || 'http://localhost:' + PORT}/api/auth/google/callback`
  }, (accessToken, refreshToken, profile, done) => {
    // Find or create user
    const db = require('./database/db');
    const email = profile.emails[0].value;
    const name = profile.displayName;

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err) return done(err);
      if (user) {
        return done(null, user);
      } else {
        // Create new user with default role 'student'
        db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          [name, email, 'google_oauth', 'student'], function(err) {
          if (err) return done(err);
          const newUser = { id: this.lastID, name, email, role: 'student' };
          // Create student record
          db.run('INSERT INTO students (userId, approved) VALUES (?, ?)',
            [this.lastID, 0]);
          return done(null, newUser);
        });
      }
    });
  }));
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const db = require('./database/db');
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
    done(err, user);
  });
});

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Passport middleware
app.use(require('express-session')({ secret: process.env.SESSION_SECRET || 'secret', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Serve views directory for dashboard pages
app.use('/student', express.static(path.join(__dirname, 'views/student')));
app.use('/staff', express.static(path.join(__dirname, 'views/staff')));
app.use('/company', express.static(path.join(__dirname, 'views/company')));
app.use('/auth', express.static(path.join(__dirname, 'views/auth')));

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/progress', courseProgressRoutes);

app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'views/auth/login.html')));
app.get('/register', (_, res) => res.sendFile(path.join(__dirname, 'views/auth/register.html')));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📱 Access the application at: http://localhost:${PORT}`);
  console.log(`📊 Student Dashboard: http://localhost:${PORT}/student/dashboard.html`);
  console.log(`👨‍💼 Staff Dashboard: http://localhost:${PORT}/staff/dashboard.html`);
  console.log(`🏢 Company Dashboard: http://localhost:${PORT}/company/dashboard.html`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please use a different port or stop the other process.`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});
