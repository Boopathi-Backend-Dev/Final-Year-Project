const db = require('../database/db');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

function parsePagination(query = {}) {
  const page = Math.max(parseInt(query.page, 10) || DEFAULT_PAGE, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  return { page, limit, offset: (page - 1) * limit };
}

function shouldReturnMeta(query = {}) {
  return query.withMeta === '1' || query.withMeta === 'true';
}

function logStaffSearchEvent(req, searchType, keyword, filters = {}) {
  if (!keyword || !keyword.trim()) return;
  db.run(
    `INSERT INTO search_events (userId, role, searchType, keyword, filters)
     VALUES (?, 'staff', ?, ?, ?)`,
    [req.user.id, searchType, keyword.trim().toLowerCase(), JSON.stringify(filters)]
  );
}

function dbGetAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

function dbAllAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
  });
}

function dbRunAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function runCb(err) {
      if (err) return reject(err);
      return resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function notifyStudentsForOpportunity({ type, opportunityId, title, department, companyId }) {
  if (!type || !opportunityId) return;
  const dept = (department || '').trim();

  db.get('SELECT name FROM companies WHERE id = ?', [companyId], (err, company) => {
    if (err) {
      console.error('Failed to fetch company for notification:', err.message);
      return;
    }

    const companyName = company?.name || 'Company';
    const label = type.charAt(0).toUpperCase() + type.slice(1);
    const notificationTitle = `New ${label}`;
    const message = `${title || label} at ${companyName} is now available.`;
    const data = JSON.stringify({ opportunityType: type, opportunityId });
    const baseKey = `opp:${type}:${opportunityId}`;

    const params = [notificationTitle, message, data, baseKey];
    let where = 'WHERE users.role = \'student\' AND COALESCE(students.approved, 0) = 1';
    if (dept) {
      where += ' AND students.department = ?';
      params.push(dept);
    }

    db.run(
      `
        INSERT OR IGNORE INTO notifications (userId, type, title, message, data, notificationKey)
        SELECT users.id, 'new_opportunity', ?, ?, ?, ? || ':' || users.id
        FROM students
        JOIN users ON users.id = students.userId
        ${where}
      `,
      params,
      (insertErr) => {
        if (insertErr) {
          console.error('Failed to insert opportunity notifications:', insertErr.message);
        }
      }
    );
  });
}

// Get single student
exports.getStudent = (req, res) => {
  const { id } = req.params;
  db.get(
    `SELECT students.*, users.name, users.email 
     FROM students 
     JOIN users ON users.id = students.userId 
     WHERE students.id = ?`,
    [id],
    (err, row) => {
      if (err || !row) {
        return res.status(404).json({ message: 'Student not found' });
      }
      res.json(row);
    }
  );
};

// Update student
exports.updateStudent = (req, res) => {
  const { id } = req.params;
  const { registerNumber, department, skills, cgpa, eligibility } = req.body;
  db.run(
    'UPDATE students SET registerNumber = ?, department = ?, skills = ?, cgpa = ?, eligibility = ? WHERE id = ?',
    [registerNumber, department, skills, cgpa, eligibility, id],
    function cb(err) {
      if (err || this.changes === 0) {
        return res.status(400).json({ message: 'Update failed' });
      }
      res.json({ message: 'Student updated successfully' });
    }
  );
};

// Delete student
exports.deleteStudent = (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM students WHERE id = ?', [id], function cb(err) {
    if (err || this.changes === 0) {
      return res.status(400).json({ message: 'Delete failed' });
    }
    res.json({ message: 'Student deleted successfully' });
  });
};

// Approve student
exports.approveStudent = (req, res) => {
  const { id } = req.params;
  db.run('UPDATE students SET approved = 1 WHERE id = ?', [id], function cb(err) {
    if (err || this.changes === 0) {
      return res.status(400).json({ message: 'Approval failed' });
    }
    res.json({ message: 'Student approved successfully' });
  });
};

// View students department-wise
exports.listStudents = (req, res) => {
  const { department } = req.query;
  const userId = req.user.id;

  // Get staff's college code
  db.get('SELECT collegeCode FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) {
      return res.status(400).json({ message: 'Staff not found' });
    }

      const collegeCode = user.collegeCode;
      const filters = [];
      const params = [];

      if (collegeCode) {
        filters.push('users.collegeCode = ?');
        params.push(collegeCode);
      } else {
        console.warn('[listStudents] Missing staff collegeCode, returning all students');
      }

      if (department) {
        filters.push('students.department = ?');
        params.push(department);
      }

      const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

      db.all(`SELECT students.*, users.name, users.email FROM students
              JOIN users ON users.id = students.userId
              ${whereClause}`, params, (_, rows) => res.json(rows || []));
    });
  };

// Dashboard stats
exports.getStats = (req, res) => {
  const userId = req.user.id;

  // Get staff's college code
  db.get('SELECT collegeCode FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) {
      return res.status(400).json({ message: 'Staff not found' });
    }

    const collegeCode = user.collegeCode;

    db.get('SELECT COUNT(*) as totalStudents FROM students JOIN users ON users.id = students.userId WHERE users.collegeCode = ?', [collegeCode], (err1, row1) => {
      if (err1) return res.status(500).json({ message: 'Failed to fetch stats' });

      db.get('SELECT COUNT(*) as approvedStudents FROM students JOIN users ON users.id = students.userId WHERE users.collegeCode = ? AND students.approved = 1', [collegeCode], (err2, row2) => {
        if (err2) return res.status(500).json({ message: 'Failed to fetch stats' });

        db.get('SELECT COUNT(*) as totalApplications FROM applications JOIN students ON students.id = applications.studentId JOIN users ON users.id = students.userId WHERE users.collegeCode = ?', [collegeCode], (err3, row3) => {
          if (err3) return res.status(500).json({ message: 'Failed to fetch stats' });

          db.get('SELECT COUNT(*) as pendingApprovals FROM students JOIN users ON users.id = students.userId WHERE users.collegeCode = ? AND students.approved = 0', [collegeCode], (err4, row4) => {
            if (err4) return res.status(500).json({ message: 'Failed to fetch stats' });

            res.json({
              totalStudents: row1.totalStudents || 0,
              approvedStudents: row2.approvedStudents || 0,
              totalApplications: row3.totalApplications || 0,
              pendingApprovals: row4.pendingApprovals || 0
            });
          });
        });
      });
    });
  });
};

// Get all applications
exports.getApplications = (req, res) => {
  const userId = req.user.id;

  // Get staff's college code
  db.get('SELECT collegeCode FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) {
      return res.status(400).json({ message: 'Staff not found' });
    }

    const collegeCode = user.collegeCode;

    db.all(
      `SELECT applications.*,
              users.name as studentName,
              COALESCE(jobs.title, courses.title, internships.title) as title,
              companies.name as companyName
       FROM applications
       JOIN students ON students.id = applications.studentId
       JOIN users ON users.id = students.userId
       LEFT JOIN jobs ON (applications.targetType = 'job' AND applications.targetId = jobs.id)
       LEFT JOIN courses ON (applications.targetType = 'course' AND applications.targetId = courses.id)
       LEFT JOIN internships ON (applications.targetType = 'internship' AND applications.targetId = internships.id)
       LEFT JOIN companies ON (
         (applications.targetType = 'job' AND companies.id = jobs.companyId) OR
         (applications.targetType = 'course' AND companies.id = courses.companyId) OR
         (applications.targetType = 'internship' AND companies.id = internships.companyId)
       )
       WHERE users.collegeCode = ?
       ORDER BY applications.createdAt DESC`,
      [collegeCode],
      (err, rows) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch applications' });
        res.json(rows || []);
      }
    );
  });
};

// Get companies (for staff to view)
exports.getCompanies = (req, res) => {
  db.all('SELECT id, name, description, industry, companySize, email FROM companies ORDER BY name', (err, rows) => {
    if (err) return res.status(500).json({ message: 'Failed to fetch companies' });
    res.json(rows || []);
  });
};

// Get available opportunities (jobs + internships) for staff view
exports.getOpportunities = (req, res) => {
  const { department, search, sort = 'latest', status = 'all' } = req.query;
  const withMeta = shouldReturnMeta(req.query);
  const { page, limit, offset } = parsePagination(req.query);
  const params = [];
  const filters = [];

  if (status && status !== 'all') {
    filters.push(`COALESCE(workflowStatus, 'published') = ?`);
    params.push(status);
  }

  if (department) {
    filters.push('department = ?');
    params.push(department);
  }

  if (search && search.trim()) {
    const searchTerm = `%${search.trim().toLowerCase()}%`;
    filters.push(`(
      LOWER(title) LIKE ?
      OR LOWER(COALESCE(description, '')) LIKE ?
      OR LOWER(COALESCE(requiredSkills, '')) LIKE ?
      OR LOWER(COALESCE(companyName, '')) LIKE ?
    )`);
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    logStaffSearchEvent(req, 'opportunities', search, { department, sort, status });
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const searchScoreTerm = search && search.trim() ? `%${search.trim().toLowerCase()}%` : null;
  const scoreSql = searchScoreTerm
    ? `(CASE WHEN LOWER(title) LIKE ? THEN 4 ELSE 0 END +
        CASE WHEN LOWER(COALESCE(requiredSkills, '')) LIKE ? THEN 3 ELSE 0 END +
        CASE WHEN LOWER(COALESCE(description, '')) LIKE ? THEN 2 ELSE 0 END +
        CASE WHEN LOWER(COALESCE(companyName, '')) LIKE ? THEN 1 ELSE 0 END)`
    : '0';

  const sortMap = {
    latest: 'createdAt DESC',
    az: 'title COLLATE NOCASE ASC',
    relevance: `${scoreSql} DESC, createdAt DESC`
  };
  const orderBy = sortMap[sort] || sortMap.latest;

  const baseSql = `
    FROM (
      SELECT
        jobs.id as id,
        jobs.title as title,
        jobs.description as description,
        jobs.department as department,
        jobs.requiredSkills as requiredSkills,
        jobs.createdAt as createdAt,
        COALESCE(jobs.workflowStatus, 'published') as workflowStatus,
        'job' as type,
        companies.name as companyName
      FROM jobs
      JOIN companies ON companies.id = jobs.companyId
      UNION ALL
      SELECT
        internships.id as id,
        internships.title as title,
        internships.description as description,
        internships.department as department,
        internships.requiredSkills as requiredSkills,
        internships.createdAt as createdAt,
        COALESCE(internships.workflowStatus, 'published') as workflowStatus,
        'internship' as type,
        companies.name as companyName
      FROM internships
      JOIN companies ON companies.id = internships.companyId
    ) base
    ${whereClause}
  `;

  const countSql = `SELECT COUNT(*) as total ${baseSql}`;
  const dataSql = `
    SELECT base.*, ${scoreSql} as relevanceScore
    ${baseSql}
    ORDER BY ${orderBy}
    ${withMeta ? 'LIMIT ? OFFSET ?' : ''}
  `;

  const scoreParams = searchScoreTerm ? [searchScoreTerm, searchScoreTerm, searchScoreTerm, searchScoreTerm] : [];
  const dataParams = params.concat(scoreParams).concat(
    sort === 'relevance' && searchScoreTerm ? scoreParams : []
  ).concat(withMeta ? [limit, offset] : []);

  db.get(countSql, params, (countErr, countRow) => {
    if (countErr) {
      return res.status(500).json({ message: 'Failed to fetch opportunities count', error: countErr.message });
    }

    db.all(dataSql, dataParams, (err, rows) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch opportunities', error: err.message });

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

// Get available courses for staff view with optional search
exports.getCourses = (req, res) => {
  const {
    department,
    category,
    platform,
    feesMin,
    feesMax,
    status = 'all',
    search,
    sort = 'latest'
  } = req.query;
  const withMeta = shouldReturnMeta(req.query);
  const { page, limit, offset } = parsePagination(req.query);
  const params = [];
  let where = `WHERE 1=1`;

  if (status && status !== 'all') {
    where += ' AND COALESCE(courses.workflowStatus, \'published\') = ?';
    params.push(status);
  }

  if (department) {
    where += ' AND courses.department = ?';
    params.push(department);
  }

  if (category) {
    where += ' AND courses.category = ?';
    params.push(category);
  }

  if (platform) {
    where += ' AND courses.platform = ?';
    params.push(platform);
  }

  if (feesMin !== undefined && feesMin !== '') {
    where += ' AND COALESCE(courses.fees, 0) >= ?';
    params.push(Number(feesMin));
  }

  if (feesMax !== undefined && feesMax !== '') {
    where += ' AND COALESCE(courses.fees, 0) <= ?';
    params.push(Number(feesMax));
  }

  if (search && search.trim()) {
    const searchTerm = `%${search.trim().toLowerCase()}%`;
    where += `
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
    logStaffSearchEvent(req, 'courses', search, { department, category, platform, feesMin, feesMax, sort, status });
  }

  const scoreTerm = search && search.trim() ? `%${search.trim().toLowerCase()}%` : null;
  const scoreSql = scoreTerm
    ? `(CASE WHEN LOWER(courses.title) LIKE ? THEN 4 ELSE 0 END +
        CASE WHEN LOWER(COALESCE(courses.requiredSkills, '')) LIKE ? THEN 3 ELSE 0 END +
        CASE WHEN LOWER(COALESCE(courses.description, '')) LIKE ? THEN 2 ELSE 0 END +
        CASE WHEN LOWER(COALESCE(companies.name, '')) LIKE ? THEN 1 ELSE 0 END)`
    : '0';

  const sortMap = {
    latest: 'courses.createdAt DESC',
    az: 'courses.title COLLATE NOCASE ASC',
    fees_low: 'COALESCE(courses.fees, 0) ASC, courses.createdAt DESC',
    fees_high: 'COALESCE(courses.fees, 0) DESC, courses.createdAt DESC',
    relevance: `${scoreSql} DESC, courses.createdAt DESC`
  };
  const orderBy = sortMap[sort] || sortMap.latest;

  const countSql = `
    SELECT COUNT(*) as total
    FROM courses
    JOIN companies ON companies.id = courses.companyId
    ${where}
  `;

  const dataSql = `SELECT
      courses.id as id,
      courses.title as title,
      courses.department as department,
      courses.requiredSkills as requiredSkills,
      courses.createdAt as createdAt,
      courses.description as description,
      courses.category as category,
      courses.platform as platform,
      courses.fees as fees,
      courses.duration as duration,
      COALESCE(courses.workflowStatus, 'published') as workflowStatus,
      ${scoreSql} as relevanceScore,
      'course' as type,
      companies.name as companyName
     FROM courses
     JOIN companies ON companies.id = courses.companyId
     ${where}
     ORDER BY ${orderBy}
     ${withMeta ? 'LIMIT ? OFFSET ?' : ''}`;

  const scoreParams = scoreTerm ? [scoreTerm, scoreTerm, scoreTerm, scoreTerm] : [];
  const dataParams = params.concat(scoreParams).concat(
    sort === 'relevance' && scoreTerm ? scoreParams : []
  ).concat(withMeta ? [limit, offset] : []);

  db.get(countSql, params, (countErr, countRow) => {
    if (countErr) return res.status(500).json({ message: 'Failed to fetch courses count', error: countErr.message });

    db.all(dataSql, dataParams, (err, rows) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch courses', error: err.message });

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

// Assign a student to an opportunity (staff action) — creates an application with status 'assigned'
// Staff analytics: search trends, wishlist trends, placement trends
exports.getAnalytics = async (req, res) => {
  try {
    const [topSearches, popularCourses, placementTrends, workflowSummary] = await Promise.all([
      dbAllAsync(
        `SELECT keyword, searchType, COUNT(*) as searches
         FROM search_events
         WHERE keyword IS NOT NULL AND keyword != ''
         GROUP BY keyword, searchType
         ORDER BY searches DESC
         LIMIT 12`
      ),
      dbAllAsync(
        `SELECT c.id as courseId, c.title, c.department, c.category, c.platform, companies.name as companyName, COUNT(cw.id) as wishlistCount
         FROM course_wishlist cw
         JOIN courses c ON c.id = cw.courseId
         LEFT JOIN companies ON companies.id = c.companyId
         GROUP BY c.id, c.title, c.department, c.category, c.platform, companies.name
         ORDER BY wishlistCount DESC
         LIMIT 12`
      ),
      dbAllAsync(
        `SELECT
          COALESCE(s.department, 'Unknown') as department,
          COUNT(a.id) as totalApplications,
          SUM(CASE WHEN a.status IN ('selected', 'approved') THEN 1 ELSE 0 END) as placedCount
         FROM applications a
         JOIN students s ON s.id = a.studentId
         GROUP BY COALESCE(s.department, 'Unknown')
         ORDER BY totalApplications DESC`
      ),
      dbAllAsync(
        `SELECT type, workflowStatus, COUNT(*) as count
         FROM (
           SELECT 'job' as type, COALESCE(workflowStatus, 'published') as workflowStatus FROM jobs
           UNION ALL
           SELECT 'course' as type, COALESCE(workflowStatus, 'published') as workflowStatus FROM courses
           UNION ALL
           SELECT 'internship' as type, COALESCE(workflowStatus, 'published') as workflowStatus FROM internships
         )
         GROUP BY type, workflowStatus
         ORDER BY type, workflowStatus`
      )
    ]);

    const placement = placementTrends.map((row) => ({
      ...row,
      placementRate: row.totalApplications > 0
        ? Math.round((row.placedCount / row.totalApplications) * 100)
        : 0
    }));

    return res.json({
      topSearches,
      popularCourses,
      placementTrends: placement,
      workflowSummary
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
};

exports.deleteSearchKeyword = async (req, res) => {
  try {
    const { keyword, searchType } = req.params;
    if (!keyword || !searchType) {
      return res.status(400).json({ message: 'Keyword and search type are required' });
    }

    const result = await dbRunAsync(
      'DELETE FROM search_events WHERE keyword = ? AND searchType = ?',
      [keyword, searchType]
    );

    return res.json({
      message: 'Search keyword deleted successfully',
      deleted: result?.changes || 0
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete search keyword', error: error.message });
  }
};

exports.getWishlistTrends = async (req, res) => {
  try {
    const rows = await dbAllAsync(
      `SELECT c.id as courseId, c.title, c.department, c.category, c.platform, companies.name as companyName, COUNT(cw.id) as wishlistCount
       FROM course_wishlist cw
       JOIN courses c ON c.id = cw.courseId
       LEFT JOIN companies ON companies.id = c.companyId
       GROUP BY c.id, c.title, c.department, c.category, c.platform, companies.name
       ORDER BY wishlistCount DESC
       LIMIT 25`
    );
    return res.json(rows || []);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch wishlist trends', error: error.message });
  }
};

exports.getApprovals = async (req, res) => {
  try {
    const { status = 'review', type = 'all' } = req.query;
    const params = [];
    const filters = [];

    if (status && status !== 'all') {
      filters.push(`workflowStatus = ?`);
      params.push(status);
    }

    if (type && type !== 'all') {
      filters.push(`type = ?`);
      params.push(type);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const rows = await dbAllAsync(
      `SELECT *
       FROM (
         SELECT jobs.id, jobs.title, jobs.department, jobs.createdAt, COALESCE(jobs.workflowStatus, 'published') as workflowStatus, jobs.reviewNotes, 'job' as type, companies.name as companyName
         FROM jobs
         JOIN companies ON companies.id = jobs.companyId
         UNION ALL
         SELECT courses.id, courses.title, courses.department, courses.createdAt, COALESCE(courses.workflowStatus, 'published') as workflowStatus, courses.reviewNotes, 'course' as type, companies.name as companyName
         FROM courses
         JOIN companies ON companies.id = courses.companyId
         UNION ALL
         SELECT internships.id, internships.title, internships.department, internships.createdAt, COALESCE(internships.workflowStatus, 'published') as workflowStatus, internships.reviewNotes, 'internship' as type, companies.name as companyName
         FROM internships
         JOIN companies ON companies.id = internships.companyId
       ) q
       ${whereClause}
       ORDER BY createdAt DESC
       LIMIT 200`,
      params
    );

    return res.json(rows || []);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch approval queue', error: error.message });
  }
};

exports.updateApprovalStatus = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { status, reviewNotes = null } = req.body;

    if (!['job', 'course', 'internship'].includes(type)) {
      return res.status(400).json({ message: 'Invalid opportunity type' });
    }
    if (!['draft', 'review', 'published', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid workflow status' });
    }

    const tableMap = {
      job: 'jobs',
      course: 'courses',
      internship: 'internships'
    };
    const table = tableMap[type];

    const result = await dbRunAsync(
      `UPDATE ${table}
       SET workflowStatus = ?, reviewNotes = ?, reviewedBy = ?, reviewedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, reviewNotes, req.user.id, id]
    );

    if (!result.changes) {
      return res.status(404).json({ message: 'Record not found' });
    }

      if (type === 'course' && (status === 'published' || status === 'draft')) {
        await dbRunAsync(
          `UPDATE courses
           SET status = ?
           WHERE id = ?`,
          [status, id]
        );
      }

      if (status === 'published') {
        const opportunity = await dbGetAsync(
          `SELECT id, title, department, companyId
           FROM ${table}
           WHERE id = ?`,
          [id]
        );
        if (opportunity) {
          notifyStudentsForOpportunity({
            type,
            opportunityId: id,
            title: opportunity.title,
            department: opportunity.department,
            companyId: opportunity.companyId
          });
        }
      }

    const owner = await dbGetAsync(
      `SELECT users.id as userId
       FROM ${table}
       JOIN companies ON companies.id = ${table}.companyId
       JOIN users ON users.id = companies.userId
       WHERE ${table}.id = ?`,
      [id]
    );

    if (owner?.userId) {
      await dbRunAsync(
        `INSERT INTO notifications (userId, type, title, message, data)
         VALUES (?, 'approval_update', ?, ?, ?)`,
        [
          owner.userId,
          `Your ${type} has been ${status}`,
          `Staff updated ${type} #${id} to "${status}"${reviewNotes ? `: ${reviewNotes}` : ''}`,
          JSON.stringify({ type, id, status, reviewNotes })
        ]
      );
    }

    return res.json({ message: `Workflow updated to ${status}` });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update workflow', error: error.message });
  }
};

exports.assignStudentToOpportunity = (req, res) => {
  const { studentId, studentEmail, targetType, targetId } = req.body;

  if ((!studentId && !studentEmail) || !targetType || !targetId) {
    return res.status(400).json({ message: 'studentId or studentEmail, targetType and targetId are required' });
  }

  // Ensure student exists and belongs to staff's college
  const userId = req.user.id;
  db.get('SELECT collegeCode FROM users WHERE id = ?', [userId], (err, staff) => {
    if (err || !staff) return res.status(400).json({ message: 'Staff not found' });

    const lookupByEmail = !!studentEmail;
    const lookupSql = lookupByEmail
      ? `SELECT students.* FROM students JOIN users ON users.id = students.userId WHERE users.email = ? AND users.collegeCode = ?`
      : `SELECT students.* FROM students JOIN users ON users.id = students.userId WHERE students.id = ? AND users.collegeCode = ?`;

    const lookupParam = lookupByEmail ? [studentEmail, staff.collegeCode] : [studentId, staff.collegeCode];

    db.get(lookupSql, lookupParam, (err, student) => {
      if (err) {
        console.error('assignStudent lookup error:', err);
        return res.status(500).json({ message: 'Database error while finding student' });
      }
      if (!student) return res.status(404).json({ message: 'Student not found or access denied' });

      const sid = student.id;
      // Create application with status 'assigned'
      db.run('INSERT INTO applications (studentId, targetType, targetId, status) VALUES (?,?,?,?)', [sid, targetType, targetId, 'assigned'], function (err) {
        if (err) return res.status(500).json({ message: 'Failed to assign student', error: err.message });
        res.json({ message: 'Student assigned successfully', applicationId: this.lastID });
      });
    });
  });
};

// Get student course details
exports.getStudentCourses = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  console.log(`[getStudentCourses] Fetching courses for student ID: ${id}, staff user ID: ${userId}`);

  // Verify staff has access to this student
  db.get('SELECT collegeCode FROM users WHERE id = ?', [userId], (err, staff) => {
    if (err) {
      console.error('[getStudentCourses] Error fetching staff:', err);
      return res.status(500).json({ message: 'Database error fetching staff' });
    }
    if (!staff) {
      console.error('[getStudentCourses] Staff not found for user ID:', userId);
      return res.status(400).json({ message: 'Staff not found' });
    }

    console.log(`[getStudentCourses] Staff college code: ${staff.collegeCode}`);

    db.get(
      `SELECT students.*, users.name, users.email
       FROM students
       JOIN users ON users.id = students.userId
       WHERE students.id = ? AND users.collegeCode = ?`,
      [id, staff.collegeCode],
      (err, student) => {
        if (err) {
          console.error('[getStudentCourses] Error fetching student:', err);
          return res.status(500).json({ message: 'Database error fetching student' });
        }
        if (!student) {
          console.error('[getStudentCourses] Student not found or access denied for ID:', id);
          return res.status(404).json({ message: 'Student not found' });
        }

        console.log(`[getStudentCourses] Student found: ${student.name}, fetching enrollments...`);

        // Get course enrollments
        db.all(
          `SELECT ce.*, c.title, c.category, c.credits, c.platform
           FROM course_enrollments ce
           JOIN courses c ON ce.courseId = c.id
           WHERE ce.studentId = ?
           ORDER BY ce.enrolledAt DESC`,
          [id],
          (err, enrollments) => {
            if (err) {
              console.error('[getStudentCourses] Error fetching enrollments:', err);
              return res.status(500).json({ message: 'Failed to fetch course data', error: err.message });
            }

            console.log(`[getStudentCourses] Found ${enrollments ? enrollments.length : 0} enrollments`);

            // Handle null enrollments
            const safeEnrollments = enrollments || [];

            // Calculate progress stats
            const completedCourses = safeEnrollments.filter(e => e.status === 'completed');
            const totalCreditsEarned = completedCourses.reduce((sum, course) => sum + (course.credits || 0), 0);
            const creditsPending = (student.totalCreditsRequired || 160) - totalCreditsEarned;
            const completionPercentage = student.totalCreditsRequired ?
              Math.round((totalCreditsEarned / student.totalCreditsRequired) * 100) : 0;

            const response = {
              student: {
                ...student,
                totalCreditsEarned,
                creditsPending,
                completionPercentage,
                academicStanding: student.academicStanding || 'Good'
              },
              enrollments: safeEnrollments,
              summary: {
                totalEnrolled: safeEnrollments.length,
                completed: completedCourses.length,
                inProgress: safeEnrollments.filter(e => e.status === 'enrolled').length,
                totalCreditsEarned,
                creditsPending,
                completionPercentage
              }
            };

            console.log('[getStudentCourses] Sending response with', safeEnrollments.length, 'enrollments');
            res.json(response);
          }
        );
      }
    );
  });
};

// Get student cart items
exports.getStudentCart = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  console.log(`[getStudentCart] Fetching cart for student ID: ${id}, staff user ID: ${userId}`);

  // Verify staff has access to this student
  db.get('SELECT collegeCode FROM users WHERE id = ?', [userId], (err, staff) => {
    if (err) {
      console.error('[getStudentCart] Error fetching staff:', err);
      return res.status(500).json({ message: 'Database error fetching staff' });
    }
    if (!staff) {
      console.error('[getStudentCart] Staff not found for user ID:', userId);
      return res.status(400).json({ message: 'Staff not found' });
    }

    console.log(`[getStudentCart] Staff college code: ${staff.collegeCode}`);

    db.get(
      `SELECT students.*, users.name, users.email
       FROM students
       JOIN users ON users.id = students.userId
       WHERE students.id = ? AND users.collegeCode = ?`,
      [id, staff.collegeCode],
      (err, student) => {
        if (err) {
          console.error('[getStudentCart] Error fetching student:', err);
          return res.status(500).json({ message: 'Database error fetching student' });
        }
        if (!student) {
          console.error('[getStudentCart] Student not found or access denied for ID:', id);
          return res.status(404).json({ message: 'Student not found' });
        }

        console.log(`[getStudentCart] Student found: ${student.name}, fetching cart items...`);

        // Get cart items
        db.all(
          `SELECT cart.*, c.title, c.category, c.credits, c.platform, c.fees, c.duration, c.mode,
                  comp.name as companyName
           FROM cart
           JOIN courses c ON cart.courseId = c.id
           LEFT JOIN companies comp ON c.companyId = comp.id
           WHERE cart.studentId = ?
           ORDER BY cart.addedAt DESC`,
          [id],
          (err, cartItems) => {
            if (err) {
              console.error('[getStudentCart] Error fetching cart items:', err);
              return res.status(500).json({ message: 'Failed to fetch cart data', error: err.message });
            }

            console.log(`[getStudentCart] Found ${cartItems ? cartItems.length : 0} cart items`);

            const response = {
              student: student,
              cartItems: cartItems || [],
              summary: {
                totalItems: (cartItems || []).length,
                totalCredits: (cartItems || []).reduce((sum, item) => sum + (item.credits || 0), 0)
              }
            };

            console.log('[getStudentCart] Sending response with', (cartItems || []).length, 'cart items');
            res.json(response);
          }
        );
      }
    );
  });
};

// Get detailed student profile for staff (enhanced version)
exports.getStudentProfile = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  console.log('Staff getting student profile for studentId:', id);

  // Get staff's college code for access control
  db.get('SELECT collegeCode FROM users WHERE id = ?', [userId], (err, staff) => {
    if (err || !staff) {
      return res.status(400).json({ message: 'Staff not found' });
    }

    // Get student details with user information (with college code check)
    db.get(
      `SELECT 
        users.name, users.email, users.createdAt as joinedDate, users.collegeCode,
        students.*
       FROM students 
       JOIN users ON students.userId = users.id 
       WHERE students.id = ? AND users.collegeCode = ?`,
      [id, staff.collegeCode],
      (err, student) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error' });
        }
        
        if (!student) {
          console.log('Student not found or access denied for ID:', id);
          return res.status(404).json({ message: 'Student not found or access denied' });
        }

        console.log('Found student:', student.name);

        // Get student's extra courses
        db.all(
          'SELECT * FROM student_extra_courses WHERE studentId = ? ORDER BY createdAt DESC',
          [id],
          (err, extraCourses) => {
            if (err) {
              console.error('Error fetching extra courses:', err);
              extraCourses = [];
            }

            // Get student's complete application history
            db.all(
              `SELECT 
                applications.*,
                COALESCE(jobs.title, courses.title, internships.title) as opportunityTitle,
                COALESCE(jobs.department, courses.department, internships.department) as opportunityDepartment,
                companies.name as companyName,
                companies.industry as companyIndustry
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
              [id],
              (err, applications) => {
                if (err) {
                  console.error('Error fetching applications:', err);
                  applications = [];
                }

                console.log('Returning profile data for:', student.name);
                // Return comprehensive student profile
                res.json({
                  student,
                  extraCourses: extraCourses || [],
                  applications: applications || []
                });
              }
            );
          }
        );
      }
    );
  });
};

// Get student attendance records (for staff view)
exports.getStudentAttendance = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Verify staff has access to this student
  db.get('SELECT collegeCode FROM users WHERE id = ?', [userId], (err, staff) => {
    if (err || !staff) return res.status(400).json({ message: 'Staff not found' });

    const hasCollegeCode = !!staff.collegeCode;
    const studentSql = `
      SELECT students.*, users.name, users.email
      FROM students
      JOIN users ON users.id = students.userId
      WHERE students.id = ? ${hasCollegeCode ? 'AND users.collegeCode = ?' : ''}
    `;
    const studentParams = hasCollegeCode ? [id, staff.collegeCode] : [id];

    if (!hasCollegeCode) {
      console.warn('[getStudentAttendance] Missing staff collegeCode, skipping college filter');
    }

    db.get(
      studentSql,
      studentParams,
      (err, student) => {
        if (err || !student) return res.status(404).json({ message: 'Student not found or access denied' });

          // Get attendance records
          db.all(
            `SELECT att.*,
                    i.title as internshipTitle,
                    companies.name as companyName,
                    s.registerNumber,
                    s.department,
                    s.cgpa,
                    s.address as studentArea,
                    apps.status as applicationStatus
             FROM attendance att
             JOIN internships i ON att.internshipId = i.id
             JOIN companies ON companies.id = i.companyId
             JOIN students s ON s.id = att.studentId
             LEFT JOIN applications apps ON (
               apps.studentId = att.studentId
               AND apps.targetType = 'internship'
               AND apps.targetId = i.id
             )
             WHERE att.studentId = ?
             ORDER BY att.attendanceDate DESC`,
            [id],
            (err, records) => {
            if (err) return res.status(500).json({ message: 'Failed to fetch attendance', error: err.message });

            const totalDays = records ? records.length : 0;
            const presentDays = records ? records.filter(r => r.present).length : 0;
            const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

            res.json({
              student,
              records: records || [],
              summary: { totalDays, presentDays, attendancePercentage }
            });
          }
        );
      }
    );
  });
};

// List staff-submitted queries
exports.listQueries = (req, res) => {
  db.all(
    `SELECT q.id, q.subject, q.message, q.status, q.reply, q.createdAt, q.updatedAt,
            c.name as companyName, c.industry as companyIndustry
     FROM company_queries q
     JOIN companies c ON c.id = q.companyId
     WHERE q.senderUserId = ? AND q.senderRole = 'staff'
     ORDER BY q.createdAt DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch queries' });
      res.json(rows || []);
    }
  );
};

// Create a new staff query to a company
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
       VALUES (?, ?, 'staff', ?, ?)`,
      [resolvedCompanyId, req.user.id, cleanSubject, cleanMessage],
      function cb(insertErr) {
        if (insertErr) return res.status(500).json({ message: 'Failed to create query' });
        res.status(201).json({ message: 'Query submitted', queryId: this.lastID });
      }
    );
  });
};
