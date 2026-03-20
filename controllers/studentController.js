const db = require('../database/db');
const { generateEnhancedAIResponse } = require('./aiResponseSystem');
const { generateGeminiResponse, generateGroqResponse } = require('../utils/aiClient');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function parsePagination(query = {}) {
  const page = Math.max(parseInt(query.page, 10) || DEFAULT_PAGE, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  return { page, limit, offset: (page - 1) * limit };
}

function shouldReturnMeta(query = {}) {
  return query.withMeta === '1' || query.withMeta === 'true';
}

function logSearchEvent(req, searchType, keyword, filters = {}) {
  if (!keyword || !keyword.trim()) return;
  db.run(
    `INSERT INTO search_events (userId, role, searchType, keyword, filters)
     VALUES (?, 'student', ?, ?, ?)`,
    [req.user.id, searchType, keyword.trim().toLowerCase(), JSON.stringify(filters)]
  );
}

function findStudentByUserId(userId, cb) {
  db.get('SELECT * FROM students WHERE userId = ?', [userId], cb);
}

function buildSearchScoreSql(alias, query) {
  if (!query || !query.trim()) {
    return { scoreSql: '0', scoreParams: [] };
  }

  const term = `%${query.trim().toLowerCase()}%`;
  return {
    scoreSql: `
      (
        CASE WHEN LOWER(${alias}.title) LIKE ? THEN 4 ELSE 0 END +
        CASE WHEN LOWER(COALESCE(${alias}.requiredSkills, '')) LIKE ? THEN 3 ELSE 0 END +
        CASE WHEN LOWER(COALESCE(${alias}.description, '')) LIKE ? THEN 2 ELSE 0 END +
        CASE WHEN LOWER(COALESCE(companies.name, '')) LIKE ? THEN 1 ELSE 0 END
      )
    `,
    scoreParams: [term, term, term, term]
  };
}

function computeSkillOverlap(studentSkills, opportunitySkills) {
  const s1 = (studentSkills || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const s2 = (opportunitySkills || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (s1.length === 0 || s2.length === 0) return 0;
  const set2 = new Set(s2);
  return s1.reduce((count, skill) => count + (set2.has(skill) ? 1 : 0), 0);
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
  });
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function runCb(err) {
      if (err) return reject(err);
      return resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function parseJsonSafely(value, fallback = {}) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (_) {
    return fallback;
  }
}

function buildSavedSearchOpportunityQuery(type, filters = {}, sinceDate = null) {
  const defs = {
    jobs: {
      table: 'jobs',
      alias: 'jobs',
      label: 'job'
    },
    courses: {
      table: 'courses',
      alias: 'courses',
      label: 'course'
    },
    internships: {
      table: 'internships',
      alias: 'internships',
      label: 'internship'
    }
  };

  const def = defs[type];
  if (!def) return null;

  const params = [];
  const whereParts = [`COALESCE(${def.alias}.workflowStatus, 'published') = 'published'`];

  if (sinceDate) {
    whereParts.push(`${def.alias}.createdAt > ?`);
    params.push(sinceDate);
  }

  if (filters.department) {
    whereParts.push(`${def.alias}.department = ?`);
    params.push(filters.department);
  }

  if (def.alias === 'courses') {
    if (filters.category) {
      whereParts.push('courses.category = ?');
      params.push(filters.category);
    }
    if (filters.platform) {
      whereParts.push('courses.platform = ?');
      params.push(filters.platform);
    }
    if (filters.feesMin !== undefined && filters.feesMin !== '') {
      whereParts.push('COALESCE(courses.fees, 0) >= ?');
      params.push(Number(filters.feesMin));
    }
    if (filters.feesMax !== undefined && filters.feesMax !== '') {
      whereParts.push('COALESCE(courses.fees, 0) <= ?');
      params.push(Number(filters.feesMax));
    }
  }

  if (filters.search && filters.search.trim()) {
    const term = `%${filters.search.trim().toLowerCase()}%`;
    whereParts.push(`(
      LOWER(${def.alias}.title) LIKE ?
      OR LOWER(COALESCE(${def.alias}.description, '')) LIKE ?
      OR LOWER(COALESCE(${def.alias}.requiredSkills, '')) LIKE ?
      OR LOWER(COALESCE(companies.name, '')) LIKE ?
    )`);
    params.push(term, term, term, term);
  }

  return {
    sql: `
      SELECT ${def.alias}.id, ${def.alias}.title, ${def.alias}.createdAt, companies.name as companyName, '${def.label}' as opportunityType
      FROM ${def.table} ${def.alias}
      JOIN companies ON companies.id = ${def.alias}.companyId
      WHERE ${whereParts.join(' AND ')}
      ORDER BY ${def.alias}.createdAt DESC
      LIMIT 20
    `,
    params
  };
}

// Get student profile
exports.getProfile = (req, res) => {
  const userId = req.user.id;
  db.get(
    `SELECT users.name, users.email, students.* 
     FROM users 
     JOIN students ON students.userId = users.id 
     WHERE users.id = ?`,
    [userId],
    (err, row) => {
      if (err || !row) {
        return res.status(404).json({ message: 'Profile not found' });
      }
      res.json(row);
    }
  );
};

// Update student profile info (supports POST/PUT)
exports.upsertProfile = (req, res) => {
  const userId = req.user.id;
  const { registerNumber, department, yearOfStudy, phone, address, dateOfBirth, gender, skills, cgpa } = req.body;
  const resumeFile = req.files ? req.files.find(f => f.fieldname === 'resume') : null;
  const photoFile = req.files ? req.files.find(f => f.fieldname === 'photo') : null;
  const resumePath = resumeFile ? `/uploads/${resumeFile.filename}` : undefined;
  const photoPath = photoFile ? `/uploads/${photoFile.filename}` : undefined;

  db.get('SELECT id FROM students WHERE userId = ?', [userId], (err, student) => {
    if (err || !student) {
      return res.status(400).json({ message: 'Student record missing' });
    }
    const sql = `
      UPDATE students
      SET registerNumber = ?, department = ?, yearOfStudy = ?, phone = ?, address = ?, dateOfBirth = ?, gender = ?, skills = ?, cgpa = ?, resumePath = COALESCE(?, resumePath), photoPath = COALESCE(?, photoPath)
      WHERE userId = ?
    `;
    db.run(sql, [registerNumber, department, yearOfStudy, phone, address, dateOfBirth, gender, skills, cgpa, resumePath, photoPath, userId], function updateCb(updateErr) {
      if (updateErr) {
        return res.status(500).json({ message: 'Update failed', error: updateErr.message });
      }
      return res.json({ message: 'Profile updated', resumePath, photoPath });
    });
  });
};

// Get jobs
exports.getJobs = (req, res) => {
  const { department, search, sort = 'latest', status = 'published' } = req.query;
  const withMeta = shouldReturnMeta(req.query);
  const { page, limit, offset } = parsePagination(req.query);
  const params = [];
  const filters = [];

  if (status && status !== 'all') {
    filters.push(`COALESCE(jobs.workflowStatus, 'published') = ?`);
    params.push(status);
  } else if (!status) {
    filters.push(`COALESCE(jobs.workflowStatus, 'published') = 'published'`);
  }

  if (department) {
    filters.push('jobs.department = ?');
    params.push(department);
  }

  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    filters.push(`(
      LOWER(jobs.title) LIKE ?
      OR LOWER(COALESCE(jobs.description, '')) LIKE ?
      OR LOWER(COALESCE(jobs.requiredSkills, '')) LIKE ?
      OR LOWER(COALESCE(companies.name, '')) LIKE ?
    )`);
    params.push(term, term, term, term);
    logSearchEvent(req, 'jobs', search, { department, sort, status });
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const { scoreSql, scoreParams } = buildSearchScoreSql('jobs', search);
  const sortable = {
    latest: 'jobs.createdAt DESC',
    az: 'jobs.title COLLATE NOCASE ASC',
    relevance: `${scoreSql} DESC, jobs.createdAt DESC`
  };
  const orderBy = sortable[sort] || sortable.latest;

  const dataSql = `
    SELECT jobs.*, companies.name as companyName, ${scoreSql} as relevanceScore
    FROM jobs
    JOIN companies ON companies.id = jobs.companyId
    ${whereClause}
    ORDER BY ${orderBy}
    ${withMeta ? 'LIMIT ? OFFSET ?' : ''}
  `;
  const dataParams = params.concat(scoreParams).concat(
    sort === 'relevance' ? scoreParams : []
  ).concat(withMeta ? [limit, offset] : []);

  const countSql = `
    SELECT COUNT(*) as total
    FROM jobs
    JOIN companies ON companies.id = jobs.companyId
    ${whereClause}
  `;

  db.get(countSql, params, (countErr, countRow) => {
    if (countErr) return res.status(500).json({ message: 'Failed to fetch jobs count' });

    db.all(dataSql, dataParams, (err, rows) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch jobs' });

      if (!withMeta) {
        if ((rows || []).length === 0 && (!status || status === 'published')) {
          // Fallback: if nothing is published yet, return all jobs
          return db.all(
            `SELECT jobs.*, companies.name as companyName, 0 as relevanceScore
             FROM jobs
             JOIN companies ON companies.id = jobs.companyId
             ${department ? 'WHERE jobs.department = ?' : ''}
             ORDER BY jobs.createdAt DESC`,
            department ? [department] : [],
            (fallbackErr, fallbackRows) => {
              if (fallbackErr) return res.status(500).json({ message: 'Failed to fetch jobs' });
              return res.json(fallbackRows || []);
            }
          );
        }
        return res.json(rows || []);
      }

      const total = countRow?.total || 0;
      const totalPages = Math.ceil(total / limit) || 1;
      const items = rows || [];
      if (items.length === 0 && (!status || status === 'published')) {
        return db.all(
          `SELECT jobs.*, companies.name as companyName, 0 as relevanceScore
           FROM jobs
           JOIN companies ON companies.id = jobs.companyId
           ${department ? 'WHERE jobs.department = ?' : ''}
           ORDER BY jobs.createdAt DESC`,
          department ? [department] : [],
          (fallbackErr, fallbackRows) => {
            if (fallbackErr) return res.status(500).json({ message: 'Failed to fetch jobs' });
            return res.json({
              items: fallbackRows || [],
              pagination: {
                page,
                limit,
                total: (fallbackRows || []).length,
                totalPages: 1,
                hasMore: false
              }
            });
          }
        );
      }

      return res.json({
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages
        }
      });
    });
  });
};

// Get courses
exports.getCourses = (req, res) => {
  const {
    department,
    category,
    platform,
    feesMin,
    feesMax,
    status = 'published',
    search,
    sort = 'latest'
  } = req.query;
  const withMeta = shouldReturnMeta(req.query);
  const { page, limit, offset } = parsePagination(req.query);
  let filter = `WHERE 1=1`;
  const params = [];

  if (status && status !== 'all') {
    filter += ` AND COALESCE(courses.workflowStatus, 'published') = ?`;
    params.push(status);
  } else if (!status) {
    filter += ` AND COALESCE(courses.workflowStatus, 'published') = 'published'`;
  }

  if (department) {
    filter += ` AND courses.department = ?`;
    params.push(department);
  }

  if (category) {
    filter += ` AND courses.category = ?`;
    params.push(category);
  }

  if (platform) {
    filter += ` AND courses.platform = ?`;
    params.push(platform);
  }

  if (feesMin !== undefined && feesMin !== '') {
    filter += ` AND COALESCE(courses.fees, 0) >= ?`;
    params.push(Number(feesMin));
  }

  if (feesMax !== undefined && feesMax !== '') {
    filter += ` AND COALESCE(courses.fees, 0) <= ?`;
    params.push(Number(feesMax));
  }

  if (search && search.trim()) {
    const searchTerm = `%${search.trim().toLowerCase()}%`;
    filter += `
      AND (
        LOWER(courses.title) LIKE ?
        OR LOWER(COALESCE(courses.description, '')) LIKE ?
        OR LOWER(COALESCE(courses.requiredSkills, '')) LIKE ?
        OR LOWER(COALESCE(courses.category, '')) LIKE ?
        OR LOWER(COALESCE(courses.platform, '')) LIKE ?
        OR LOWER(COALESCE(companies.name, '')) LIKE ?
      )
    `;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    logSearchEvent(req, 'courses', search, { department, category, platform, feesMin, feesMax, sort, status });
  }

  const { scoreSql, scoreParams } = buildSearchScoreSql('courses', search);
  const sortable = {
    latest: 'courses.createdAt DESC',
    az: 'courses.title COLLATE NOCASE ASC',
    fees_low: 'COALESCE(courses.fees, 0) ASC, courses.createdAt DESC',
    fees_high: 'COALESCE(courses.fees, 0) DESC, courses.createdAt DESC',
    relevance: `${scoreSql} DESC, courses.createdAt DESC`
  };
  const orderBy = sortable[sort] || sortable.latest;

  const dataSql = `SELECT courses.*, companies.name as companyName, ${scoreSql} as relevanceScore
     FROM courses
     JOIN companies ON companies.id = courses.companyId
     ${filter}
     ORDER BY ${orderBy}
     ${withMeta ? 'LIMIT ? OFFSET ?' : ''}`;

  const dataParams = params.concat(scoreParams).concat(
    sort === 'relevance' ? scoreParams : []
  ).concat(withMeta ? [limit, offset] : []);

  const countSql = `SELECT COUNT(*) as total
     FROM courses
     JOIN companies ON companies.id = courses.companyId
     ${filter}`;

  db.get(countSql, params, (countErr, countRow) => {
    if (countErr) return res.status(500).json({ message: 'Failed to fetch courses count' });

    db.all(dataSql, dataParams, (err, rows) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch courses' });
      if (!withMeta) {
        return res.json(rows || []);
      }

      const total = countRow?.total || 0;
      const totalPages = Math.ceil(total / limit) || 1;
      return res.json({
        items: rows || [],
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages
        }
      });
    });
  });
};

// Get internships
exports.getInternships = (req, res) => {
  const { department, status = 'published', search, sort = 'latest' } = req.query;
  const withMeta = shouldReturnMeta(req.query);
  const { page, limit, offset } = parsePagination(req.query);
  let filter = 'WHERE 1=1';
  const params = [];

  if (status && status !== 'all') {
    filter += ` AND COALESCE(internships.workflowStatus, 'published') = ?`;
    params.push(status);
  } else if (!status) {
    filter += ` AND COALESCE(internships.workflowStatus, 'published') = 'published'`;
  }

  if (department) {
    filter += ` AND internships.department = ?`;
    params.push(department);
  }

  if (search && search.trim()) {
    const searchTerm = `%${search.trim().toLowerCase()}%`;
    filter += `
      AND (
        LOWER(internships.title) LIKE ?
        OR LOWER(COALESCE(internships.description, '')) LIKE ?
        OR LOWER(COALESCE(internships.requiredSkills, '')) LIKE ?
        OR LOWER(COALESCE(companies.name, '')) LIKE ?
      )
    `;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    logSearchEvent(req, 'internships', search, { department, sort, status });
  }

  const { scoreSql, scoreParams } = buildSearchScoreSql('internships', search);
  const sortable = {
    latest: 'internships.createdAt DESC',
    az: 'internships.title COLLATE NOCASE ASC',
    relevance: `${scoreSql} DESC, internships.createdAt DESC`
  };
  const orderBy = sortable[sort] || sortable.latest;

  const dataSql = `SELECT internships.*, companies.name as companyName, ${scoreSql} as relevanceScore
     FROM internships
     JOIN companies ON companies.id = internships.companyId
     ${filter}
     ORDER BY ${orderBy}
     ${withMeta ? 'LIMIT ? OFFSET ?' : ''}`;

  const dataParams = params.concat(scoreParams).concat(
    sort === 'relevance' ? scoreParams : []
  ).concat(withMeta ? [limit, offset] : []);

  const countSql = `SELECT COUNT(*) as total
     FROM internships
     JOIN companies ON companies.id = internships.companyId
     ${filter}`;

  db.get(countSql, params, (countErr, countRow) => {
    if (countErr) return res.status(500).json({ message: 'Failed to fetch internships count' });

    db.all(dataSql, dataParams, (err, rows) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch internships' });
      if (!withMeta) {
        return res.json(rows || []);
      }

      const total = countRow?.total || 0;
      const totalPages = Math.ceil(total / limit) || 1;
      return res.json({
        items: rows || [],
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages
        }
      });
    });
  });
};

// Apply for job or course
exports.apply = (req, res) => {
  const { targetType, targetId } = req.body;
  const studentIdQuery = 'SELECT id, registerNumber, department FROM students WHERE userId = ?';
  db.get(studentIdQuery, [req.user.id], (err, student) => {
    if (err || !student) {
      return res.status(400).json({ message: 'Student not found' });
    }
    // Check if profile is complete
    if (!student.registerNumber || !student.department) {
      return res.status(400).json({ message: 'Please complete your profile (Register Number and Department) before applying' });
    }

    const targetTable = targetType === 'job' ? 'jobs' : targetType === 'course' ? 'courses' : targetType === 'internship' ? 'internships' : null;
    if (!targetTable) {
      return res.status(400).json({ message: 'Invalid targetType' });
    }

    db.get(
      `SELECT id FROM ${targetTable}
       WHERE id = ? AND COALESCE(workflowStatus, 'published') = 'published'`,
      [targetId],
      (targetErr, target) => {
        if (targetErr) {
          return res.status(500).json({ message: 'Failed to validate opportunity', error: targetErr.message });
        }
        if (!target) {
          return res.status(400).json({ message: 'Opportunity is not available for applications' });
        }

          db.run(
            'INSERT INTO applications (studentId, targetType, targetId, status) VALUES (?,?,?,?)',
            [student.id, targetType, targetId, 'applied'],
            function insertCb(insErr) {
              if (insErr) {
                return res.status(400).json({ message: 'Already applied or invalid', error: insErr.message });
              }
              const applicationId = this.lastID;
              const infoSql = `
                SELECT ${targetTable}.title as title, companies.name as companyName
                FROM ${targetTable}
                JOIN companies ON companies.id = ${targetTable}.companyId
                WHERE ${targetTable}.id = ?
              `;
              db.get(infoSql, [targetId], (infoErr, info) => {
                if (infoErr) {
                  console.error('Failed to load opportunity for notification:', infoErr.message);
                }
                const oppTitle = info?.title || targetType;
                const companyName = info?.companyName || 'Company';
                const message = `Your application for ${oppTitle} at ${companyName} has been submitted.`;

                db.run(
                  `INSERT OR IGNORE INTO notifications (userId, type, title, message, data, notificationKey)
                   VALUES (?, 'application_submitted', ?, ?, ?, ?)`,
                  [
                    req.user.id,
                    'Application submitted',
                    message,
                    JSON.stringify({ applicationId, targetType, targetId }),
                    `apply:${applicationId}`
                  ],
                  (notifyErr) => {
                    if (notifyErr) {
                      console.error('Failed to insert application notification:', notifyErr.message);
                    }
                  }
                );
              });
              return res.status(201).json({ message: 'Applied', applicationId });
            }
          );
        }
      );
  });
};

// View student applications
exports.myApplications = (req, res) => {
  db.get('SELECT id FROM students WHERE userId = ?', [req.user.id], (err, student) => {
    if (err || !student) return res.status(400).json({ message: 'Student not found' });

    db.all(
      `SELECT applications.*,
               COALESCE(jobs.title, courses.title, internships.title) as title,
               companies.name as companyName
        FROM applications
        LEFT JOIN jobs ON (applications.targetType = 'job' AND applications.targetId = jobs.id)
        LEFT JOIN courses ON (applications.targetType = 'course' AND applications.targetId = courses.id)
        LEFT JOIN internships ON (applications.targetType = 'internship' AND applications.targetId = internships.id)
        LEFT JOIN companies ON (
          (applications.targetType = 'job' AND companies.id = jobs.companyId) OR
          (applications.targetType = 'course' AND companies.id = courses.companyId) OR
          (applications.targetType = 'internship' AND companies.id = internships.companyId)
        )
        WHERE applications.studentId = ?
        ORDER BY applications.createdAt DESC`,
      [student.id],
      (_, rows) => res.json(rows || [])
    );
  });
};

// Delete student application
exports.deleteApplication = (req, res) => {
  const { id } = req.params;

  db.get('SELECT id FROM students WHERE userId = ?', [req.user.id], (err, student) => {
    if (err || !student) return res.status(400).json({ message: 'Student not found' });

    // Check if application belongs to this student and is not approved/selected
    db.get(
      'SELECT * FROM applications WHERE id = ? AND studentId = ?',
      [id, student.id],
      (err, application) => {
        if (err || !application) {
          return res.status(404).json({ message: 'Application not found' });
        }

        // Prevent deletion of approved/selected applications
        if (application.status === 'selected' || application.status === 'approved') {
          return res.status(400).json({ message: 'Cannot delete approved or selected applications' });
        }

        db.run(
          'DELETE FROM applications WHERE id = ? AND studentId = ?',
          [id, student.id],
          function (err) {
            if (err) return res.status(500).json({ message: 'Failed to delete application', error: err.message });
            if (this.changes === 0) return res.status(404).json({ message: 'Application not found' });
            res.json({ message: 'Application deleted successfully' });
          }
        );
      }
    );
  });
};

// ============================================
// SMART SEARCH, SAVED SEARCHES, WISHLIST, NOTIFICATIONS
// ============================================

exports.getSavedSearches = async (req, res) => {
  try {
    const student = await dbGet('SELECT id FROM students WHERE userId = ?', [req.user.id]);
    if (!student) return res.status(400).json({ message: 'Student not found' });

    const rows = await dbAll(
      `SELECT id, name, searchType, searchParams, lastNotifiedAt, createdAt
       FROM saved_searches
       WHERE studentId = ?
       ORDER BY createdAt DESC`,
      [student.id]
    );

    const payload = rows.map((row) => ({
      ...row,
      searchParams: parseJsonSafely(row.searchParams, {})
    }));
    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch saved searches', error: error.message });
  }
};

exports.createSavedSearch = async (req, res) => {
  try {
    const { name, searchType = 'all', searchParams = {} } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Search name is required' });
    }

    if (!['jobs', 'courses', 'internships', 'all'].includes(searchType)) {
      return res.status(400).json({ message: 'Invalid searchType' });
    }

    const student = await dbGet('SELECT id FROM students WHERE userId = ?', [req.user.id]);
    if (!student) return res.status(400).json({ message: 'Student not found' });

    const result = await dbRun(
      `INSERT INTO saved_searches (studentId, name, searchType, searchParams, lastNotifiedAt, updatedAt)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [student.id, name.trim(), searchType, JSON.stringify(searchParams || {})]
    );

    return res.status(201).json({ message: 'Saved search created', id: result.lastID });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create saved search', error: error.message });
  }
};

exports.deleteSavedSearch = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await dbGet('SELECT id FROM students WHERE userId = ?', [req.user.id]);
    if (!student) return res.status(400).json({ message: 'Student not found' });

    const result = await dbRun(
      'DELETE FROM saved_searches WHERE id = ? AND studentId = ?',
      [id, student.id]
    );
    if (!result.changes) return res.status(404).json({ message: 'Saved search not found' });

    return res.json({ message: 'Saved search deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete saved search', error: error.message });
  }
};

exports.getWishlist = async (req, res) => {
  try {
    const student = await dbGet('SELECT id FROM students WHERE userId = ?', [req.user.id]);
    if (!student) return res.status(400).json({ message: 'Student not found' });

    const rows = await dbAll(
      `SELECT cw.courseId, cw.createdAt, c.title, c.department, c.category, c.platform, c.fees, c.duration, companies.name as companyName
       FROM course_wishlist cw
       JOIN courses c ON c.id = cw.courseId
       LEFT JOIN companies ON companies.id = c.companyId
       WHERE cw.studentId = ?
       ORDER BY cw.createdAt DESC`,
      [student.id]
    );
    return res.json(rows || []);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch wishlist', error: error.message });
  }
};

exports.addToWishlist = async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ message: 'courseId is required' });

    const student = await dbGet('SELECT id FROM students WHERE userId = ?', [req.user.id]);
    if (!student) return res.status(400).json({ message: 'Student not found' });

    const course = await dbGet(
      `SELECT id FROM courses
       WHERE id = ? AND COALESCE(workflowStatus, 'published') = 'published'`,
      [courseId]
    );
    if (!course) return res.status(404).json({ message: 'Course not found or not published' });

    await dbRun(
      `INSERT OR IGNORE INTO course_wishlist (studentId, courseId)
       VALUES (?, ?)`,
      [student.id, courseId]
    );

    return res.status(201).json({ message: 'Course added to wishlist' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add wishlist', error: error.message });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const { courseId } = req.params;
    const student = await dbGet('SELECT id FROM students WHERE userId = ?', [req.user.id]);
    if (!student) return res.status(400).json({ message: 'Student not found' });

    const result = await dbRun(
      'DELETE FROM course_wishlist WHERE studentId = ? AND courseId = ?',
      [student.id, courseId]
    );
    if (!result.changes) return res.status(404).json({ message: 'Course not found in wishlist' });

    return res.json({ message: 'Course removed from wishlist' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to remove wishlist item', error: error.message });
  }
};

async function generateSavedSearchNotifications(userId, studentId) {
  const savedSearches = await dbAll(
    `SELECT id, name, searchType, searchParams, lastNotifiedAt, createdAt
     FROM saved_searches
     WHERE studentId = ?`,
    [studentId]
  );

  for (const saved of savedSearches) {
    const params = parseJsonSafely(saved.searchParams, {});
    const types = saved.searchType === 'all'
      ? ['jobs', 'courses', 'internships']
      : [saved.searchType];
    const since = saved.lastNotifiedAt || saved.createdAt;

    for (const type of types) {
      const queryObj = buildSavedSearchOpportunityQuery(type, params, since);
      if (!queryObj) continue;

      const rows = await dbAll(queryObj.sql, queryObj.params);
      for (const row of rows) {
        const key = `match:${saved.id}:${row.opportunityType}:${row.id}:${row.createdAt}`;
        await dbRun(
          `INSERT OR IGNORE INTO notifications (userId, type, title, message, data, notificationKey)
           VALUES (?, 'new_match', ?, ?, ?, ?)`,
          [
            userId,
            `New ${row.opportunityType} match`,
            `${row.title} at ${row.companyName || 'Company'} matches saved search "${saved.name}"`,
            JSON.stringify({
              savedSearchId: saved.id,
              opportunityId: row.id,
              opportunityType: row.opportunityType
            }),
            key
          ]
        );
      }
    }

    await dbRun(
      `UPDATE saved_searches
       SET lastNotifiedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [saved.id]
    );
  }
}

async function generateApplicationNotifications(userId, studentId) {
  const apps = await dbAll(
    `SELECT applications.id as applicationId,
            applications.status as status,
            applications.targetType as targetType,
            applications.targetId as targetId,
            COALESCE(jobs.title, courses.title, internships.title) as title,
            companies.name as companyName
     FROM applications
     LEFT JOIN jobs ON (applications.targetType = 'job' AND applications.targetId = jobs.id)
     LEFT JOIN courses ON (applications.targetType = 'course' AND applications.targetId = courses.id)
     LEFT JOIN internships ON (applications.targetType = 'internship' AND applications.targetId = internships.id)
     LEFT JOIN companies ON companies.id = COALESCE(jobs.companyId, courses.companyId, internships.companyId)
     WHERE applications.studentId = ?`,
    [studentId]
  );

  for (const app of apps) {
    const title = app.title || app.targetType;
    const companyName = app.companyName || 'Company';

    // Application submitted notification
    await dbRun(
      `INSERT OR IGNORE INTO notifications (userId, type, title, message, data, notificationKey)
       VALUES (?, 'application_submitted', ?, ?, ?, ?)`,
      [
        userId,
        'Application submitted',
        `Your application for ${title} at ${companyName} has been submitted.`,
        JSON.stringify({ applicationId: app.applicationId, targetType: app.targetType, targetId: app.targetId }),
        `apply:${app.applicationId}`
      ]
    );

    // Application status update notification (selected/rejected/approved/etc.)
    if (app.status && !['applied', 'pending', 'assigned'].includes(app.status)) {
      await dbRun(
        `INSERT OR IGNORE INTO notifications (userId, type, title, message, data, notificationKey)
         VALUES (?, 'application_update', ?, ?, ?, ?)`,
        [
          userId,
          'Application update',
          `Your application for ${title} at ${companyName} is now "${app.status}".`,
          JSON.stringify({
            applicationId: app.applicationId,
            status: app.status,
            targetType: app.targetType,
            targetId: app.targetId
          }),
          `app:${app.applicationId}:${app.status}`
        ]
      );
    }
  }
}

  exports.getNotifications = async (req, res) => {
    try {
      const student = await dbGet('SELECT id FROM students WHERE userId = ?', [req.user.id]);
      if (!student) return res.status(400).json({ message: 'Student not found' });
  
      // Generate new notifications based on saved searches before returning list
      await generateSavedSearchNotifications(req.user.id, student.id);
      await generateApplicationNotifications(req.user.id, student.id);
  
      const rows = await dbAll(
        `SELECT id, type, title, message, data, isRead, createdAt
         FROM notifications
       WHERE userId = ?
       ORDER BY createdAt DESC
       LIMIT 100`,
      [req.user.id]
    );
    return res.json(rows || []);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dbRun(
      `UPDATE notifications
       SET isRead = 1
       WHERE id = ? AND userId = ?`,
      [id, req.user.id]
    );
    if (!result.changes) return res.status(404).json({ message: 'Notification not found' });
    return res.json({ message: 'Notification marked as read' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to mark notification', error: error.message });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    await dbRun(
      `UPDATE notifications
       SET isRead = 1
       WHERE userId = ?`,
      [req.user.id]
    );
    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to mark all notifications', error: error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dbRun(
      `DELETE FROM notifications
       WHERE id = ? AND userId = ?`,
      [id, req.user.id]
    );
    if (!result.changes) return res.status(404).json({ message: 'Notification not found' });
    return res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete notification', error: error.message });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const student = await dbGet(
      `SELECT id, department, skills, cgpa
       FROM students
       WHERE userId = ?`,
      [req.user.id]
    );
    if (!student) return res.status(400).json({ message: 'Student not found' });

    const history = await dbAll(
      `SELECT
        applications.targetType,
        COALESCE(jobs.companyId, courses.companyId, internships.companyId) as companyId,
        COALESCE(jobs.requiredSkills, courses.requiredSkills, internships.requiredSkills) as requiredSkills
      FROM applications
      LEFT JOIN jobs ON (applications.targetType = 'job' AND applications.targetId = jobs.id)
      LEFT JOIN courses ON (applications.targetType = 'course' AND applications.targetId = courses.id)
      LEFT JOIN internships ON (applications.targetType = 'internship' AND applications.targetId = internships.id)
      WHERE applications.studentId = ?`,
      [student.id]
    );

    const seenCompanies = new Set(history.map(h => h.companyId).filter(Boolean));
    const typeCounts = history.reduce((acc, h) => {
      acc[h.targetType] = (acc[h.targetType] || 0) + 1;
      return acc;
    }, {});

    const [jobs, courses, internships] = await Promise.all([
      dbAll(
        `SELECT jobs.*, companies.name as companyName
         FROM jobs
         JOIN companies ON companies.id = jobs.companyId
         WHERE COALESCE(jobs.workflowStatus, 'published') = 'published'
         ORDER BY jobs.createdAt DESC
         LIMIT 200`
      ),
      dbAll(
        `SELECT courses.*, companies.name as companyName
         FROM courses
         JOIN companies ON companies.id = courses.companyId
         WHERE COALESCE(courses.workflowStatus, 'published') = 'published'
         ORDER BY courses.createdAt DESC
         LIMIT 200`
      ),
      dbAll(
        `SELECT internships.*, companies.name as companyName
         FROM internships
         JOIN companies ON companies.id = internships.companyId
         WHERE COALESCE(internships.workflowStatus, 'published') = 'published'
         ORDER BY internships.createdAt DESC
         LIMIT 200`
      )
    ]);

    const rank = (item, type) => {
      let score = 0;
      if (item.department && student.department && item.department === student.department) score += 4;
      score += computeSkillOverlap(student.skills, item.requiredSkills) * 2;
      if (seenCompanies.has(item.companyId)) score += 2;
      if (typeCounts[type]) score += 1;
      if (type === 'job' && Number(student.cgpa || 0) >= 8) score += 1;
      if (type === 'course' && Number(student.cgpa || 0) < 7.5) score += 1;
      return score;
    };

    const topN = (rows, type) => rows
      .map((row) => ({ ...row, recommendationScore: rank(row, type) }))
      .sort((a, b) => b.recommendationScore - a.recommendationScore || new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 8);

    return res.json({
      jobs: topN(jobs, 'job'),
      courses: topN(courses, 'course'),
      internships: topN(internships, 'internship')
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch recommendations', error: error.message });
  }
};


// ============================================
// STUDENT EXTRA COURSES CRUD OPERATIONS
// ============================================

// Get all extra courses for the student
exports.getExtraCourses = (req, res) => {
  db.get('SELECT id FROM students WHERE userId = ?', [req.user.id], (err, student) => {
    if (err || !student) return res.status(400).json({ message: 'Student not found' });

    db.all(
      `SELECT * FROM student_extra_courses WHERE studentId = ? ORDER BY createdAt DESC`,
      [student.id],
      (err, rows) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch extra courses' });
        res.json(rows || []);
      }
    );
  });
};

// Add a new extra course
exports.addExtraCourse = (req, res) => {
  const { courseName, platform, category, credits, completionDate, certificateUrl, grade, status } = req.body;

  if (!courseName) {
    return res.status(400).json({ message: 'Course name is required' });
  }

  db.get('SELECT id FROM students WHERE userId = ?', [req.user.id], (err, student) => {
    if (err || !student) return res.status(400).json({ message: 'Student not found' });

    db.run(
      `INSERT INTO student_extra_courses (studentId, courseName, platform, category, credits, completionDate, certificateUrl, grade, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [student.id, courseName, platform || null, category || null, credits || 0, completionDate || null, certificateUrl || null, grade || null, status || 'in_progress'],
      function (err) {
        if (err) return res.status(500).json({ message: 'Failed to add extra course', error: err.message });
        res.status(201).json({ message: 'Extra course added successfully', courseId: this.lastID });
      }
    );
  });
};

// Update an extra course
exports.updateExtraCourse = (req, res) => {
  const { id } = req.params;
  const { courseName, platform, category, credits, completionDate, certificateUrl, grade, status } = req.body;

  if (!courseName) {
    return res.status(400).json({ message: 'Course name is required' });
  }

  db.get('SELECT id FROM students WHERE userId = ?', [req.user.id], (err, student) => {
    if (err || !student) return res.status(400).json({ message: 'Student not found' });

    // Verify the course belongs to this student
    db.get('SELECT id FROM student_extra_courses WHERE id = ? AND studentId = ?', [id, student.id], (err, course) => {
      if (err || !course) return res.status(404).json({ message: 'Extra course not found' });

      db.run(
        `UPDATE student_extra_courses
         SET courseName = ?, platform = ?, category = ?, credits = ?, completionDate = ?, certificateUrl = ?, grade = ?, status = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE id = ? AND studentId = ?`,
        [courseName, platform || null, category || null, credits || 0, completionDate || null, certificateUrl || null, grade || null, status || 'in_progress', id, student.id],
        function (err) {
          if (err) return res.status(500).json({ message: 'Failed to update extra course', error: err.message });
          if (this.changes === 0) return res.status(404).json({ message: 'Extra course not found' });
          res.json({ message: 'Extra course updated successfully' });
        }
      );
    });
  });
};

// Delete an extra course
exports.deleteExtraCourse = (req, res) => {
  const { id } = req.params;

  db.get('SELECT id FROM students WHERE userId = ?', [req.user.id], (err, student) => {
    if (err || !student) return res.status(400).json({ message: 'Student not found' });

    db.run(
      'DELETE FROM student_extra_courses WHERE id = ? AND studentId = ?',
      [id, student.id],
      function (err) {
        if (err) return res.status(500).json({ message: 'Failed to delete extra course', error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Extra course not found' });
        res.json({ message: 'Extra course deleted successfully' });
      }
    );
  });
};

// ============================================
// AI CHAT FUNCTIONALITY
// ============================================

// Send AI message and get response
exports.sendAIMessage = (req, res) => {
  const { message, context } = req.body;
  
  if (!message || !message.trim()) {
    return res.status(400).json({ message: 'Message is required' });
  }

  db.get('SELECT id FROM students WHERE userId = ?', [req.user.id], async (err, student) => {
    if (err || !student) return res.status(400).json({ message: 'Student not found' });

    try {
      // Generate AI response based on message and context
      let aiResponse = null;
      try {
        aiResponse = await generateGeminiResponse(message.trim(), context || {});
      } catch (aiError) {
        console.error('Gemini API error, falling back to Groq/local responder:', aiError.message || aiError);
      }

      if (!aiResponse) {
        try {
          aiResponse = await generateGroqResponse(message.trim(), context || {});
        } catch (aiError) {
          console.error('Groq API error, falling back to local responder:', aiError.message || aiError);
        }
      }

      if (!aiResponse) {
        aiResponse = generateAIResponse(message.trim(), context || {});
      }

      // Save chat to history
      db.run(
        `INSERT INTO student_chat_history (studentId, userMessage, aiResponse, createdAt)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [student.id, message.trim(), aiResponse],
        function (err) {
          if (err) {
            console.error('Failed to save chat history:', err);
            // Still return response even if saving fails
          }
          res.json({ message: aiResponse });
        }
      );
    } catch (error) {
      console.error('Error generating AI response:', error);
      res.json({ 
        message: "I apologize, but I'm having trouble processing your request right now. Please try asking your question in a different way, or contact your faculty for assistance." 
      });
    }
  });
};

// Get chat history
exports.getChatHistory = (req, res) => {
  db.get('SELECT id FROM students WHERE userId = ?', [req.user.id], (err, student) => {
    if (err || !student) return res.status(400).json({ message: 'Student not found' });

    db.all(
      `SELECT userMessage, aiResponse, createdAt as timestamp
       FROM student_chat_history 
       WHERE studentId = ? 
       ORDER BY createdAt ASC 
       LIMIT 50`,
      [student.id],
      (err, rows) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch chat history' });
        res.json(rows || []);
      }
    );
  });
};

// Clear chat history
exports.clearChatHistory = (req, res) => {
  db.get('SELECT id FROM students WHERE userId = ?', [req.user.id], (err, student) => {
    if (err || !student) return res.status(400).json({ message: 'Student not found' });

    db.run(
      'DELETE FROM student_chat_history WHERE studentId = ?',
      [student.id],
      function (err) {
        if (err) return res.status(500).json({ message: 'Failed to clear chat history' });
        res.json({ message: 'Chat history cleared successfully' });
      }
    );
  });
};

// AI Response Generator
function generateAIResponse(message, context = {}) {
  try {
    const lowerMessage = message.toLowerCase();
    
    console.log('Processing message:', message);
    console.log('Context:', context);
    
    // First, try the enhanced knowledge base
    const enhancedResponse = generateEnhancedAIResponse(message, context);
    if (enhancedResponse) {
      return enhancedResponse;
    }
    
    // Interview preparation (check this first to avoid conflicts with "prepare")
    if (lowerMessage.includes('interview') || (lowerMessage.includes('prepare') && lowerMessage.includes('job'))) {
      return generateInterviewAdvice(context);
    }
    
    // Course recommendations
    if (lowerMessage.includes('course') && (lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('should i take'))) {
      return generateCourseRecommendations(context);
    }
    
    // CGPA improvement
    if (lowerMessage.includes('cgpa') || lowerMessage.includes('grade') || lowerMessage.includes('improve')) {
      return generateCGPAAdvice(context);
    }
    
    // Skills and career guidance
    if (lowerMessage.includes('skill') || lowerMessage.includes('career') || lowerMessage.includes('job')) {
      return generateSkillsAdvice(context);
    }
    
    // Study tips
    if (lowerMessage.includes('study') || lowerMessage.includes('learn') || lowerMessage.includes('tips')) {
      return generateStudyTips(context);
    }
    
    // Department specific advice
    if (context.department) {
      if (lowerMessage.includes('department') || lowerMessage.includes(context.department.toLowerCase())) {
        return generateDepartmentAdvice(context);
      }
    }
    
    // General academic guidance
    if (lowerMessage.includes('academic') || lowerMessage.includes('college') || lowerMessage.includes('university')) {
      return generateAcademicAdvice(context);
    }
    
    // Default response with personalized touch
    return generateDefaultResponse(context);
  } catch (error) {
    console.error('Error in generateAIResponse:', error);
    return "I'm here to help you with your studies and career! Please ask me about courses, skills, CGPA improvement, interview preparation, or any academic guidance you need.";
  }
}

function generateCourseRecommendations(context) {
  const { department, yearOfStudy } = context;
  
  let response = "📚 **Course Recommendations for You:**\n\n";
  
  if (department === 'CSE') {
    response += "Based on your Computer Science background, I recommend:\n\n";
    response += "**Technical Courses:**\n";
    response += "- Data Structures and Algorithms (Essential)\n";
    response += "- Web Development (React, Node.js)\n";
    response += "- Machine Learning Fundamentals\n";
    response += "- Database Management Systems\n";
    response += "- Cloud Computing (AWS/Azure)\n\n";
    response += "**Platforms:** NPTEL, Coursera, Udemy, edX\n";
  } else if (department === 'ECE') {
    response += "For Electronics and Communication, consider:\n\n";
    response += "**Core Courses:**\n";
    response += "- Digital Signal Processing\n";
    response += "- VLSI Design\n";
    response += "- Embedded Systems Programming\n";
    response += "- IoT and Wireless Communication\n";
    response += "- MATLAB/Simulink\n\n";
  } else if (department === 'MECH') {
    response += "For Mechanical Engineering, I suggest:\n\n";
    response += "**Essential Courses:**\n";
    response += "- CAD/CAM Software (AutoCAD, SolidWorks)\n";
    response += "- Finite Element Analysis\n";
    response += "- Manufacturing Processes\n";
    response += "- Robotics and Automation\n";
    response += "- Project Management\n\n";
  } else {
    response += "**General Recommendations:**\n";
    response += "- Programming Fundamentals\n";
    response += "- Data Analysis\n";
    response += "- Communication Skills\n";
    response += "- Project Management\n";
    response += "- Industry-specific software tools\n\n";
  }
  
  if (yearOfStudy) {
    if (yearOfStudy <= 2) {
      response += "**For Early Years:** Focus on fundamentals and programming basics.\n";
    } else {
      response += "**For Final Years:** Consider advanced topics and industry certifications.\n";
    }
  }
  
  response += "\n💡 **Tip:** Choose courses that align with your career goals and current industry trends!";
  
  return response;
}

function generateCGPAAdvice(context) {
  const { cgpa, yearOfStudy } = context;
  
  let response = "📈 **CGPA Improvement Strategies:**\n\n";
  
  if (cgpa && cgpa < 7.0) {
    response += "**Immediate Action Plan:**\n";
    response += "- Focus on understanding concepts rather than memorizing\n";
    response += "- Create a structured study schedule\n";
    response += "- Form study groups with classmates\n";
    response += "- Seek help from professors during office hours\n";
    response += "- Practice previous year question papers\n\n";
  } else if (cgpa && cgpa >= 8.0) {
    response += "**Maintaining Excellence:**\n";
    response += "- Continue your current study methods\n";
    response += "- Take on challenging projects\n";
    response += "- Consider research opportunities\n";
    response += "- Mentor junior students\n\n";
  } else {
    response += "**General Improvement Tips:**\n";
    response += "- Set specific, measurable goals for each subject\n";
    response += "- Use active learning techniques\n";
    response += "- Regular revision and practice\n";
    response += "- Maintain consistent attendance\n\n";
  }
  
  response += "**Study Techniques:**\n";
  response += "- Pomodoro Technique (25-min focused sessions)\n";
  response += "- Mind mapping for complex topics\n";
  response += "- Teaching others to reinforce learning\n";
  response += "- Regular self-assessment\n\n";
  
  response += "**Time Management:**\n";
  response += "- Prioritize subjects based on difficulty and weightage\n";
  response += "- Balance theory and practical work\n";
  response += "- Avoid last-minute cramming\n\n";
  
  response += "🎯 **Remember:** Consistency is key to academic success!";
  
  return response;
}

function generateSkillsAdvice(context) {
  const { department, skills } = context;
  
  let response = "💡 **Skills Development Roadmap:**\n\n";
  
  response += "**In-Demand Skills for 2024:**\n";
  
  if (department === 'CSE') {
    response += "- **Programming:** Python, JavaScript, Java\n";
    response += "- **Web Development:** React, Node.js, MongoDB\n";
    response += "- **Data Science:** Machine Learning, Data Analysis\n";
    response += "- **Cloud:** AWS, Docker, Kubernetes\n";
    response += "- **Mobile:** React Native, Flutter\n\n";
  } else if (department === 'ECE') {
    response += "- **Programming:** C/C++, Python, MATLAB\n";
    response += "- **Hardware:** VLSI, Embedded Systems\n";
    response += "- **Communication:** 5G, IoT, Wireless\n";
    response += "- **Software:** Simulink, Cadence, Xilinx\n\n";
  } else {
    response += "- **Technical:** Programming, Data Analysis\n";
    response += "- **Software:** Industry-specific tools\n";
    response += "- **Digital:** AI/ML basics, Cloud computing\n\n";
  }
  
  response += "**Soft Skills (Equally Important):**\n";
  response += "- Communication and Presentation\n";
  response += "- Problem-solving and Critical thinking\n";
  response += "- Leadership and Teamwork\n";
  response += "- Time Management\n";
  response += "- Adaptability\n\n";
  
  response += "**How to Develop Skills:**\n";
  response += "1. **Online Courses:** Coursera, Udemy, NPTEL\n";
  response += "2. **Practice Projects:** Build real-world applications\n";
  response += "3. **Internships:** Gain practical experience\n";
  response += "4. **Competitions:** Hackathons, coding contests\n";
  response += "5. **Networking:** Join professional communities\n\n";
  
  if (skills) {
    response += `**Your Current Skills:** ${skills}\n`;
    response += "**Suggestion:** Build upon these and add complementary skills!\n\n";
  }
  
  response += "🚀 **Pro Tip:** Focus on 2-3 skills at a time for better mastery!";
  
  return response;
}

function generateInterviewAdvice(context) {
  const { department } = context;
  
  let response = "💼 **Interview Preparation Guide:**\n\n";
  
  response += "**Technical Preparation:**\n";
  
  if (department === 'CSE') {
    response += "- **Data Structures:** Arrays, Linked Lists, Trees, Graphs\n";
    response += "- **Algorithms:** Sorting, Searching, Dynamic Programming\n";
    response += "- **System Design:** Basics of scalable systems\n";
    response += "- **Programming:** Practice coding problems daily\n";
    response += "- **Projects:** Be ready to explain your projects in detail\n\n";
  } else {
    response += "- **Core Concepts:** Master fundamental subjects\n";
    response += "- **Projects:** Prepare detailed explanations\n";
    response += "- **Industry Knowledge:** Stay updated with trends\n";
    response += "- **Problem-solving:** Practice analytical questions\n\n";
  }
  
  response += "**Behavioral Interview:**\n";
  response += "- **STAR Method:** Situation, Task, Action, Result\n";
  response += "- **Common Questions:**\n";
  response += "  - Tell me about yourself\n";
  response += "  - Why do you want this job?\n";
  response += "  - Describe a challenging project\n";
  response += "  - Your strengths and weaknesses\n\n";
  
  response += "**Preparation Timeline:**\n";
  response += "- **3 months before:** Start technical preparation\n";
  response += "- **1 month before:** Mock interviews and resume review\n";
  response += "- **1 week before:** Company research and final practice\n";
  response += "- **Day before:** Rest well and review key points\n\n";
  
  response += "**During the Interview:**\n";
  response += "- Arrive 10-15 minutes early\n";
  response += "- Dress professionally\n";
  response += "- Ask clarifying questions\n";
  response += "- Think out loud while solving problems\n";
  response += "- Prepare thoughtful questions about the role\n\n";
  
  response += "**Resources:**\n";
  response += "- LeetCode, HackerRank for coding practice\n";
  response += "- Glassdoor for company-specific questions\n";
  response += "- YouTube for mock interview videos\n\n";
  
  response += "🎯 **Remember:** Confidence comes from preparation!";
  
  return response;
}

function generateStudyTips(context) {
  const { yearOfStudy } = context;
  
  let response = "📝 **Effective Study Strategies:**\n\n";
  
  response += "**Active Learning Techniques:**\n";
  response += "- **Feynman Technique:** Explain concepts in simple terms\n";
  response += "- **Spaced Repetition:** Review material at increasing intervals\n";
  response += "- **Practice Testing:** Regular self-assessment\n";
  response += "- **Interleaving:** Mix different topics in study sessions\n\n";
  
  response += "**Time Management:**\n";
  response += "- **Pomodoro Technique:** 25-min focused sessions with 5-min breaks\n";
  response += "- **Time Blocking:** Dedicate specific hours to subjects\n";
  response += "- **Priority Matrix:** Focus on important and urgent tasks\n";
  response += "- **Weekly Planning:** Set goals and track progress\n\n";
  
  response += "**Note-Taking Methods:**\n";
  response += "- **Cornell Method:** Divide notes into sections\n";
  response += "- **Mind Mapping:** Visual representation of concepts\n";
  response += "- **Outline Method:** Hierarchical structure\n";
  response += "- **Digital Tools:** Notion, Obsidian, OneNote\n\n";
  
  response += "**Memory Enhancement:**\n";
  response += "- **Mnemonics:** Memory aids and acronyms\n";
  response += "- **Visualization:** Create mental images\n";
  response += "- **Association:** Link new info to known concepts\n";
  response += "- **Regular Review:** Consistent reinforcement\n\n";
  
  response += "**Environment Optimization:**\n";
  response += "- **Dedicated Study Space:** Minimize distractions\n";
  response += "- **Good Lighting:** Reduce eye strain\n";
  response += "- **Comfortable Temperature:** Maintain focus\n";
  response += "- **Digital Detox:** Limit social media during study\n\n";
  
  if (yearOfStudy && yearOfStudy >= 3) {
    response += "**For Final Years:**\n";
    response += "- Focus on application-based learning\n";
    response += "- Work on real projects\n";
    response += "- Prepare for placements simultaneously\n\n";
  }
  
  response += "🧠 **Pro Tip:** Quality over quantity - focused study is more effective than long hours!";
  
  return response;
}

function generateDepartmentAdvice(context) {
  const { department, yearOfStudy } = context;
  
  let response = `🎓 **${department} Department Guidance:**\n\n`;
  
  if (department === 'CSE') {
    response += "**Career Paths:**\n";
    response += "- Software Developer/Engineer\n";
    response += "- Data Scientist/Analyst\n";
    response += "- Product Manager\n";
    response += "- Cybersecurity Specialist\n";
    response += "- AI/ML Engineer\n\n";
    
    response += "**Key Focus Areas:**\n";
    response += "- Programming and Software Development\n";
    response += "- Data Structures and Algorithms\n";
    response += "- System Design and Architecture\n";
    response += "- Database Management\n";
    response += "- Web and Mobile Development\n\n";
  } else if (department === 'ECE') {
    response += "**Career Opportunities:**\n";
    response += "- Electronics Engineer\n";
    response += "- Telecommunications Engineer\n";
    response += "- Embedded Systems Developer\n";
    response += "- VLSI Design Engineer\n";
    response += "- IoT Solutions Architect\n\n";
    
    response += "**Core Competencies:**\n";
    response += "- Circuit Design and Analysis\n";
    response += "- Signal Processing\n";
    response += "- Communication Systems\n";
    response += "- Microprocessors and Controllers\n";
    response += "- RF and Antenna Design\n\n";
  } else if (department === 'MECH') {
    response += "**Industry Opportunities:**\n";
    response += "- Mechanical Design Engineer\n";
    response += "- Manufacturing Engineer\n";
    response += "- Automotive Engineer\n";
    response += "- Robotics Engineer\n";
    response += "- Project Manager\n\n";
    
    response += "**Essential Skills:**\n";
    response += "- CAD/CAM Software Proficiency\n";
    response += "- Manufacturing Processes\n";
    response += "- Thermodynamics and Fluid Mechanics\n";
    response += "- Materials Science\n";
    response += "- Quality Control and Testing\n\n";
  }
  
  response += "**Industry Trends:**\n";
  response += "- Automation and AI Integration\n";
  response += "- Sustainable and Green Technologies\n";
  response += "- Digital Transformation\n";
  response += "- Industry 4.0 Technologies\n\n";
  
  response += "**Networking Opportunities:**\n";
  response += "- Join professional societies (IEEE, ASME, etc.)\n";
  response += "- Attend industry conferences and workshops\n";
  response += "- Connect with alumni in your field\n";
  response += "- Participate in technical competitions\n\n";
  
  response += "🌟 **Success Tip:** Stay updated with industry trends and continuously upgrade your skills!";
  
  return response;
}

function generateAcademicAdvice(context) {
  const { yearOfStudy, cgpa } = context;
  
  let response = "🎓 **Academic Excellence Guide:**\n\n";
  
  response += "**Academic Planning:**\n";
  response += "- **Course Selection:** Choose electives aligned with career goals\n";
  response += "- **Research Opportunities:** Explore undergraduate research projects\n";
  response += "- **Internships:** Gain practical industry experience\n";
  response += "- **Certifications:** Earn relevant professional certifications\n\n";
  
  response += "**Building Academic Profile:**\n";
  response += "- **Projects:** Work on innovative and practical projects\n";
  response += "- **Publications:** Aim for conference papers or journals\n";
  response += "- **Competitions:** Participate in technical competitions\n";
  response += "- **Leadership:** Take on student organization roles\n\n";
  
  response += "**Faculty Interaction:**\n";
  response += "- **Office Hours:** Regularly visit professors for guidance\n";
  response += "- **Research Assistance:** Volunteer for faculty research\n";
  response += "- **Mentorship:** Seek academic and career mentorship\n";
  response += "- **Recommendations:** Build relationships for future references\n\n";
  
  if (yearOfStudy && yearOfStudy >= 3) {
    response += "**Final Year Focus:**\n";
    response += "- **Capstone Project:** Choose industry-relevant topics\n";
    response += "- **Placement Preparation:** Start early preparation\n";
    response += "- **Higher Studies:** Consider MS/MBA options\n";
    response += "- **Portfolio Building:** Document all achievements\n\n";
  }
  
  response += "**Academic Resources:**\n";
  response += "- **Library:** Utilize digital and physical resources\n";
  response += "- **Online Courses:** Supplement classroom learning\n";
  response += "- **Study Groups:** Collaborative learning\n";
  response += "- **Tutoring:** Seek help when needed\n\n";
  
  response += "📚 **Remember:** Academic success is a marathon, not a sprint. Stay consistent and focused!";
  
  return response;
}

function generateDefaultResponse(context) {
  const { department, yearOfStudy } = context;
  
  let response = "🤖 **Hello! I'm here to help you succeed academically and professionally.**\n\n";
  
  response += "**I can assist you with:**\n";
  response += "- 📚 Course recommendations and academic planning\n";
  response += "- 📈 CGPA improvement strategies\n";
  response += "- 💡 Skill development and career guidance\n";
  response += "- 💼 Interview preparation and job search tips\n";
  response += "- 📝 Study techniques and time management\n";
  response += "- 🎯 Department-specific advice and industry insights\n\n";
  
  if (department) {
    response += `**For ${department} students, I have specialized knowledge about:**\n`;
    response += "- Industry trends and career opportunities\n";
    response += "- Technical skills and certifications\n";
    response += "- Project ideas and research areas\n\n";
  }
  
  response += "**Popular Questions:**\n";
  response += "- \"What courses should I take for my department?\"\n";
  response += "- \"How can I improve my CGPA?\"\n";
  response += "- \"What skills are in demand for my field?\"\n";
  response += "- \"How to prepare for job interviews?\"\n\n";
  
  response += "💬 **Feel free to ask me anything about your studies, career, or academic life!**";
  
  return response;
}

// ============================================
// STUDENT INTERNSHIP ATTENDANCE
// ============================================

// Get student's internship attendance records
// Get student applied internships
exports.getAppliedInternships = (req, res) => {
  db.get('SELECT id FROM students WHERE userId = ?', [req.user.id], (err, student) => {
    if (err || !student) return res.status(400).json({ message: 'Student not found' });

    db.all(
        `SELECT DISTINCT
                i.id, i.title, i.department, i.duration, i.stipend,
                companies.name as companyName,
                applications.status,
                applications.createdAt as joinDate,
                applications.createdAt as appliedAt
         FROM applications
         JOIN internships i ON (applications.targetType = 'internship' AND applications.targetId = i.id)
         JOIN companies ON companies.id = i.companyId
         WHERE applications.studentId = ?
           AND applications.status IN ('accepted', 'selected', 'approved')
         ORDER BY applications.createdAt DESC`,
        [student.id],
        (err, rows) => {
          if (err) return res.status(500).json({ message: 'Failed to fetch internships' });
          res.json({ value: rows || [], Count: (rows || []).length });
      }
    );
  });
};

exports.getAttendance = (req, res) => {
  db.get('SELECT id FROM students WHERE userId = ?', [req.user.id], (err, student) => {
    if (err || !student) return res.status(400).json({ message: 'Student not found' });

    db.get(
        `SELECT u.name, s.department, s.yearOfStudy, s.registerNumber, s.cgpa
         FROM users u
         JOIN students s ON s.userId = u.id
         WHERE u.id = ?`,
      [req.user.id],
      (err, studentInfo) => {
        if (err) {
          return res.status(500).json({ message: 'Failed to fetch student info' });
        }

        db.all(
            `SELECT att.*,
                    i.title as internshipTitle,
                    companies.name as companyName,
                    apps.createdAt as internshipStartDate,
                    apps.status as applicationStatus,
                    s.registerNumber,
                    s.department,
                    s.cgpa,
                    s.address as studentArea
             FROM attendance att
             JOIN internships i ON att.internshipId = i.id
             JOIN companies ON companies.id = i.companyId
             JOIN students s ON s.id = att.studentId
               LEFT JOIN applications apps ON (
                 apps.studentId = ?
                 AND apps.targetType = 'internship'
                 AND apps.targetId = i.id
                 AND apps.status IN ('accepted', 'selected', 'approved')
             )
             WHERE att.studentId = ?
             ORDER BY att.attendanceDate DESC`,
          [student.id, student.id],
          (err, records) => {
            if (err) return res.status(500).json({ message: 'Failed to fetch attendance' });

            const totalDays = records ? records.length : 0;
            const presentDays = records ? records.filter(r => r.present).length : 0;
            const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

            res.json({
              records: records || [],
              studentInfo: studentInfo || {},
              summary: { totalDays, presentDays, attendancePercentage }
            });
          }
        );
      }
    );
  });
};

// List companies for query submissions
exports.getCompanies = (_, res) => {
  db.all('SELECT id, name, industry, email FROM companies ORDER BY name', (err, rows) => {
    if (err) return res.status(500).json({ message: 'Failed to fetch companies' });
    res.json(rows || []);
  });
};

// List student-submitted queries
exports.listQueries = (req, res) => {
  db.all(
    `SELECT q.id, q.subject, q.message, q.status, q.reply, q.createdAt, q.updatedAt,
            c.name as companyName, c.industry as companyIndustry
     FROM company_queries q
     JOIN companies c ON c.id = q.companyId
     WHERE q.senderUserId = ? AND q.senderRole = 'student'
     ORDER BY q.createdAt DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch queries' });
      res.json(rows || []);
    }
  );
};

// Create a new student query to a company
exports.createQuery = (req, res) => {
  const { companyId, subject, message } = req.body;
  const resolvedCompanyId = Number(companyId);
  const cleanSubject = String(subject || '').trim();
  const cleanMessage = String(message || '').trim();

  if (!Number.isInteger(resolvedCompanyId) || resolvedCompanyId <= 0) {
    return res.status(400).json({ message: 'Valid companyId is required' });
  }
  if (!cleanSubject) {
    return res.status(400).json({ message: 'Subject is required' });
  }
  if (!cleanMessage) {
    return res.status(400).json({ message: 'Message is required' });
  }

  db.get('SELECT id FROM companies WHERE id = ?', [resolvedCompanyId], (err, company) => {
    if (err) return res.status(500).json({ message: 'Failed to validate company' });
    if (!company) return res.status(404).json({ message: 'Company not found' });

    db.run(
      `INSERT INTO company_queries (companyId, senderUserId, senderRole, subject, message)
       VALUES (?, ?, 'student', ?, ?)`,
      [resolvedCompanyId, req.user.id, cleanSubject, cleanMessage],
      function cb(insertErr) {
        if (insertErr) return res.status(500).json({ message: 'Failed to create query' });
        res.status(201).json({ message: 'Query submitted', queryId: this.lastID });
      }
    );
  });
};
