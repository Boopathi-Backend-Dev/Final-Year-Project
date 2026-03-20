const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { SECRET } = require('../middleware/auth');

// Register users by role
exports.register = (req, res) => {
  const { name, email, password, role, collegeCode, companyName } = req.body;

  // Validate required fields
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Missing required fields: name, email, password, role' });
  }

  // Validate role
  const allowedRoles = ['student', 'staff', 'company'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role. Must be one of: student, staff, company' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Validate password strength (minimum 6 characters)
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  // Validate college code for students and staff
  if ((role === 'student' || role === 'staff') && !collegeCode) {
    return res.status(400).json({ message: 'College code is required for students and staff' });
  }

  // Validate company name for companies
  if (role === 'company' && !companyName) {
    return res.status(400).json({ message: 'Company name is required for company registration' });
  }

  const hashed = bcrypt.hashSync(password, 10);
  db.run(
    'INSERT INTO users (name, email, password, role, collegeCode) VALUES (?,?,?,?,?)',
    [name, email, hashed, role, collegeCode],
    function registerUser(err) {
      if (err) {
        return res.status(400).json({ message: 'User exists or invalid', error: err.message });
      }

      // Create role-specific row
      const userId = this.lastID;
      if (role === 'student') {
        db.run('INSERT INTO students (userId, approved) VALUES (?, ?)',
          [userId, 0], function(err) {
          if (err) {
            console.error('Failed to create student record:', err);
            return res.status(500).json({ message: 'Failed to create student record' });
          }
          return res.status(201).json({ message: 'Registered', userId });
        });
      } else if (role === 'staff') {
        db.run('INSERT INTO staff (userId) VALUES (?)', [userId], function(err) {
          if (err) {
            console.error('Failed to create staff record:', err);
            return res.status(500).json({ message: 'Failed to create staff record' });
          }
          return res.status(201).json({ message: 'Registered', userId });
        });
      } else if (role === 'company') {
        db.run('INSERT INTO companies (userId, name) VALUES (?, ?)', [userId, companyName], function(err) {
          if (err) {
            console.error('Failed to create company record:', err);
            return res.status(500).json({ message: 'Failed to create company record' });
          }
          return res.status(201).json({ message: 'Registered', userId });
        });
      } else {
        return res.status(201).json({ message: 'Registered', userId });
      }
    }
  );
};

// Login and issue JWT
exports.login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, SECRET, { expiresIn: '2h' });
    res.json({ token, role: user.role, name: user.name });
  });
};
