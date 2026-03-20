const jwt = require('jsonwebtoken');
const db = require('../database/db');
const SECRET = process.env.SECRET || 'dev-secret';

// Validate JWT and attach user payload
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, SECRET);
    req.user = payload;

    // Fetch role-specific IDs
    if (payload.role === 'student') {
      db.get('SELECT id as studentId FROM students WHERE userId = ?', [payload.id], (err, row) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (row) req.user.studentId = row.studentId;
        return next();
      });
    } else if (payload.role === 'staff') {
      db.get('SELECT id as staffId FROM staff WHERE userId = ?', [payload.id], (err, row) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (row) req.user.staffId = row.staffId;
        return next();
      });
    } else if (payload.role === 'company') {
      db.get('SELECT id as companyId FROM companies WHERE userId = ?', [payload.id], (err, row) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (row) {
          req.user.companyId = row.companyId;
          return next();
        } else {
          // Create default company record if not exists
          db.run('INSERT INTO companies (userId, name) VALUES (?, ?)', [payload.id, payload.name], function(err) {
            if (err) return res.status(500).json({ message: 'Failed to create company record' });
            req.user.companyId = this.lastID;
            return next();
          });
        }
      });
    } else {
      return next();
    }
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Ensure the authenticated user has one of the required roles
function authorize(roles = []) {
  return (req, res, next) => {
    if (!req.user || (roles.length && !roles.includes(req.user.role))) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

module.exports = { authenticate, authorize, SECRET };
