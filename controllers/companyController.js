const db = require('../database/db');

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

function notifyStudentForApplicationUpdate(applicationId, status) {
  if (!applicationId || !status) return;

  db.get(
    `SELECT applications.id as applicationId,
            applications.targetType as targetType,
            applications.targetId as targetId,
            students.userId as userId,
            COALESCE(jobs.title, courses.title, internships.title) as title,
            companies.name as companyName
     FROM applications
     JOIN students ON students.id = applications.studentId
     LEFT JOIN jobs ON (applications.targetType = 'job' AND applications.targetId = jobs.id)
     LEFT JOIN courses ON (applications.targetType = 'course' AND applications.targetId = courses.id)
     LEFT JOIN internships ON (applications.targetType = 'internship' AND applications.targetId = internships.id)
     LEFT JOIN companies ON companies.id = COALESCE(jobs.companyId, courses.companyId, internships.companyId)
     WHERE applications.id = ?`,
    [applicationId],
    (err, row) => {
      if (err || !row?.userId) {
        if (err) console.error('Failed to fetch application for notification:', err.message);
        return;
      }

      const title = row.title || 'your application';
      const companyName = row.companyName || 'Company';
      const message = `Your application for ${title} at ${companyName} is now "${status}".`;
      const data = JSON.stringify({
        applicationId,
        status,
        targetType: row.targetType,
        targetId: row.targetId
      });

      db.run(
        `INSERT OR IGNORE INTO notifications (userId, type, title, message, data, notificationKey)
         VALUES (?, 'application_update', ?, ?, ?, ?)`,
        [row.userId, 'Application update', message, data, `app:${applicationId}:${status}`],
        (insertErr) => {
          if (insertErr) {
            console.error('Failed to insert application notification:', insertErr.message);
          }
        }
      );
    }
  );
}

// Create job posting
exports.createJob = (req, res) => {
  const { title, description, department, requiredSkills, workflowStatus } = req.body;
  const companyId = req.user.companyId;
  if (!title) return res.status(400).json({ message: 'Title required' });
  const wfStatus = workflowStatus || 'published';

  db.run(
    'INSERT INTO jobs (companyId, title, description, department, requiredSkills, workflowStatus) VALUES (?,?,?,?,?,?)',
    [companyId, title, description, department, requiredSkills, wfStatus],
    function cb(err) {
      if (err) return res.status(500).json({ message: 'Failed to create job' });
      if (wfStatus === 'published') {
        notifyStudentsForOpportunity({
          type: 'job',
          opportunityId: this.lastID,
          title,
          department,
          companyId
        });
      }
      res.status(201).json({ message: 'Job created', jobId: this.lastID });
    }
  );
};

// Create course
exports.createCourse = (req, res) => {
  const { title, description, department, requiredSkills, fees, duration, mode, courseLink, status, workflowStatus } = req.body;
  const companyId = req.user.companyId;
  if (!title) return res.status(400).json({ message: 'Title required' });
  const wfStatus = workflowStatus || 'published';
  const courseStatus = status || (wfStatus === 'published' ? 'published' : 'draft');
  db.run(
    'INSERT INTO courses (companyId, title, description, department, requiredSkills, fees, duration, mode, courseLink, status, workflowStatus) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [companyId, title, description, department, requiredSkills, fees, duration, mode, courseLink, courseStatus, wfStatus],
    function cb(err) {
      if (err) return res.status(500).json({ message: 'Failed to create course', error: err.message });
      if (wfStatus === 'published') {
        notifyStudentsForOpportunity({
          type: 'course',
          opportunityId: this.lastID,
          title,
          department,
          companyId
        });
      }
      res.status(201).json({ message: 'Course created', courseId: this.lastID });
    }
  );
};

// Get company's jobs
exports.getJobs = (req, res) => {
  const companyId = req.user.companyId;
  db.all(
    'SELECT * FROM jobs WHERE companyId = ? ORDER BY createdAt DESC',
    [companyId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch jobs' });
      res.json(rows || []);
    }
  );
};

// Get company's courses
exports.getCourses = (req, res) => {
  const companyId = req.user.companyId;
  db.all(
    'SELECT * FROM courses WHERE companyId = ? ORDER BY createdAt DESC',
    [companyId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch courses' });
      res.json(rows || []);
    }
  );
};

// View applied students
exports.viewApplicants = (req, res) => {
  const { targetType, targetId } = req.query;
  if (!targetType || !targetId) {
    return res.status(400).json({ message: 'targetType and targetId required' });
  }
  db.all(
    `SELECT applications.id as applicationId, applications.status, applications.createdAt,
            applications.studentId,
            users.name as studentName,
            users.email as studentEmail,
            students.registerNumber, students.department, students.cgpa, students.skills, students.resumePath
     FROM applications
     JOIN students ON students.id = applications.studentId
     JOIN users ON users.id = students.userId
     WHERE applications.targetType = ? AND applications.targetId = ?
     ORDER BY applications.createdAt DESC`,
    [targetType, targetId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch applicants' });
      res.json(rows || []);
    }
  );
};

// Update application status (selected/rejected)
exports.updateApplication = (req, res) => {
  const { applicationId } = req.params;
  const { status } = req.body;
  db.run('UPDATE applications SET status = ? WHERE id = ?', [status, applicationId], function cb(err) {
    if (err || this.changes === 0) {
      return res.status(400).json({ message: 'Update failed' });
    }
    notifyStudentForApplicationUpdate(applicationId, status);
    res.json({ message: 'Application updated' });
  });
};

// Update company profile
exports.updateProfile = (req, res) => {
  const companyId = req.user.companyId;
  const {
    name, description, industry, email, phone, website,
    foundedYear, companySize, companyType, address, city, state
  } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Company name is required' });
  }

  if (!email) {
    return res.status(400).json({ message: 'Contact email is required' });
  }

  const sql = `
    UPDATE companies
    SET name = ?,
        description = COALESCE(?, description),
        industry = COALESCE(?, industry),
        email = ?,
        phone = COALESCE(?, phone),
        website = COALESCE(?, website),
        foundedYear = COALESCE(?, foundedYear),
        companySize = COALESCE(?, companySize),
        companyType = COALESCE(?, companyType),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        state = COALESCE(?, state)
    WHERE id = ?
  `;

  const params = [name, description, industry, email, phone, website, foundedYear, companySize, companyType, address, city, state, companyId];

  db.run(sql, params, function cb(err) {
    if (err) return res.status(500).json({ message: 'Update failed', error: err.message });
    res.json({ message: 'Profile updated successfully' });
  });
};

// Get company profile
exports.getProfile = (req, res) => {
  const companyId = req.user.companyId;
  db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) => {
    if (err || !row) return res.status(404).json({ message: 'Profile not found' });
    res.json(row);
  });
};

// Create internship posting
exports.createInternship = (req, res) => {
  const { title, description, department, duration, stipend, requiredSkills, location, applicationDeadline, workflowStatus } = req.body;
  const companyId = req.user.companyId;
  if (!title) return res.status(400).json({ message: 'Title required' });
  const wfStatus = workflowStatus || 'published';

  db.run(
    'INSERT INTO internships (companyId, title, description, department, duration, stipend, requiredSkills, location, applicationDeadline, workflowStatus) VALUES (?,?,?,?,?,?,?,?,?,?)',
    [companyId, title, description, department, duration, stipend, requiredSkills, location, applicationDeadline, wfStatus],
    function cb(err) {
      if (err) return res.status(500).json({ message: 'Failed to create internship' });
      if (wfStatus === 'published') {
        notifyStudentsForOpportunity({
          type: 'internship',
          opportunityId: this.lastID,
          title,
          department,
          companyId
        });
      }
      res.status(201).json({ message: 'Internship created', internshipId: this.lastID });
    }
  );
};

// Get company's internships
exports.getInternships = (req, res) => {
  const companyId = req.user.companyId;
  db.all(
    'SELECT * FROM internships WHERE companyId = ? ORDER BY createdAt DESC',
    [companyId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch internships' });
      res.json(rows || []);
    }
  );
};

// Submit a draft opportunity to review queue
exports.submitForReview = (req, res) => {
  const { type, id } = req.params;
  const companyId = req.user.companyId;

  const tableMap = {
    job: 'jobs',
    course: 'courses',
    internship: 'internships'
  };
  const table = tableMap[type];

  if (!table) return res.status(400).json({ message: 'Invalid type' });

  db.run(
    `UPDATE ${table}
     SET workflowStatus = 'review'
     WHERE id = ? AND companyId = ?`,
    [id, companyId],
    function cb(err) {
      if (err) return res.status(500).json({ message: 'Failed to submit for review', error: err.message });
      if (!this.changes) return res.status(404).json({ message: 'Record not found' });
      return res.json({ message: 'Submitted for review' });
    }
  );
};
// Get detailed student profile for companies
exports.getStudentProfile = (req, res) => {
  const { studentId } = req.params;
  console.log('Getting student profile for studentId:', studentId);

  if (!studentId) {
    return res.status(400).json({ message: 'Student ID is required' });
  }

  // Get student details with user information
  db.get(
    `SELECT 
      users.name, users.email, users.createdAt as joinedDate,
      students.*
     FROM students 
     JOIN users ON students.userId = users.id 
     WHERE students.id = ?`,
    [studentId],
    (err, student) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      
      if (!student) {
        console.log('Student not found for ID:', studentId);
        return res.status(404).json({ message: 'Student not found' });
      }

      console.log('Found student:', student.name);

      // Get student's extra courses
      db.all(
        'SELECT * FROM student_extra_courses WHERE studentId = ? ORDER BY createdAt DESC',
        [studentId],
        (err, extraCourses) => {
          if (err) {
            console.error('Error fetching extra courses:', err);
            extraCourses = [];
          }

          // Get student's application history (only for this company)
          db.all(
            `SELECT 
              applications.*,
              COALESCE(jobs.title, courses.title, internships.title) as opportunityTitle,
              COALESCE(jobs.department, courses.department, internships.department) as opportunityDepartment
             FROM applications
             LEFT JOIN jobs ON (applications.targetType = 'job' AND applications.targetId = jobs.id AND jobs.companyId = ?)
             LEFT JOIN courses ON (applications.targetType = 'course' AND applications.targetId = courses.id AND courses.companyId = ?)
             LEFT JOIN internships ON (applications.targetType = 'internship' AND applications.targetId = internships.id AND internships.companyId = ?)
             WHERE applications.studentId = ? 
             AND (jobs.id IS NOT NULL OR courses.id IS NOT NULL OR internships.id IS NOT NULL)
             ORDER BY applications.createdAt DESC`,
            [req.user.companyId, req.user.companyId, req.user.companyId, studentId],
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
};

// Get internship attendance records
exports.getInternshipAttendance = (req, res) => {
  const { internshipId } = req.params;
  const companyId = req.user.companyId;

  // Verify internship belongs to company
  db.get('SELECT id FROM internships WHERE id = ? AND companyId = ?', [internshipId, companyId], (err, internship) => {
    if (err || !internship) return res.status(404).json({ message: 'Internship not found or access denied' });

    db.all(
      `SELECT att.*, s.registerNumber, s.department, u.name as studentName, u.email
       FROM attendance att
       JOIN students s ON att.studentId = s.id
       JOIN users u ON u.id = s.userId
       WHERE att.internshipId = ?
       ORDER BY att.attendanceDate DESC`,
      [internshipId],
      (err, records) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch attendance', error: err.message });
        res.json(records || []);
      }
    );
  });
};

// Mark/update attendance
exports.markAttendance = (req, res) => {
  const { studentId, studentEmail, internshipId, attendanceDate, present, presentedByCompany, notes } = req.body;
  const companyId = req.user.companyId;

  if (!internshipId || !attendanceDate || (!studentId && !studentEmail)) {
    return res.status(400).json({ message: 'internshipId, attendanceDate, and studentId or studentEmail are required' });
  }

  // Verify internship belongs to company
  db.get('SELECT id FROM internships WHERE id = ? AND companyId = ?', [internshipId, companyId], (err, internship) => {
    if (err || !internship) return res.status(404).json({ message: 'Internship not found or access denied' });

    const resolvedStudentId = Number.parseInt(studentId, 10);
    const persistAttendance = (targetStudentId) => {
      const presentValue = present ? 1 : 0;

      db.run(
        `INSERT INTO attendance (studentId, internshipId, attendanceDate, present, presentedByCompany, notes)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(studentId, internshipId, attendanceDate) DO UPDATE SET
         present = ?, presentedByCompany = ?, notes = ?, markedAt = CURRENT_TIMESTAMP`,
        [targetStudentId, internshipId, attendanceDate, presentValue, presentedByCompany || null, notes || null, presentValue, presentedByCompany || null, notes || null],
        function (insertErr) {
          if (insertErr) return res.status(500).json({ message: 'Failed to mark attendance', error: insertErr.message });
          res.json({ message: 'Attendance marked successfully' });
        }
      );
    };

    if (Number.isInteger(resolvedStudentId) && resolvedStudentId > 0) {
      persistAttendance(resolvedStudentId);
      return;
    }

    const normalizedEmail = String(studentEmail || '').trim().toLowerCase();
    if (!normalizedEmail) {
      return res.status(400).json({ message: 'Valid studentId or studentEmail is required' });
    }

    db.get(
      `SELECT s.id as studentId
       FROM students s
       JOIN users u ON u.id = s.userId
       WHERE LOWER(TRIM(u.email)) = ?`,
      [normalizedEmail],
      (studentErr, studentRow) => {
        if (studentErr) return res.status(500).json({ message: 'Failed to resolve student', error: studentErr.message });
        if (!studentRow?.studentId) return res.status(404).json({ message: 'Student not found for provided email' });
        persistAttendance(studentRow.studentId);
      }
    );
  });
};

// List queries sent to this company
exports.getQueries = (req, res) => {
  const { status = 'all' } = req.query;
  const params = [req.user.companyId];
  let where = 'WHERE q.companyId = ?';

  if (status && status !== 'all') {
    where += ' AND q.status = ?';
    params.push(status);
  }

  db.all(
    `SELECT q.id, q.subject, q.message, q.status, q.reply, q.createdAt, q.updatedAt,
            q.senderRole, u.name as senderName, u.email as senderEmail
     FROM company_queries q
     JOIN users u ON u.id = q.senderUserId
     ${where}
     ORDER BY q.createdAt DESC`,
    params,
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch queries' });
      res.json(rows || []);
    }
  );
};

// Update query status or reply
exports.updateQuery = (req, res) => {
  const { id } = req.params;
  const { status, reply } = req.body;
  const allowedStatuses = ['open', 'answered', 'closed'];
  const cleanReply = String(reply || '').trim();

  let nextStatus = String(status || '').trim().toLowerCase();
  if (!nextStatus) {
    nextStatus = cleanReply ? 'answered' : 'open';
  }

  if (!allowedStatuses.includes(nextStatus)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  db.run(
    `UPDATE company_queries
     SET status = ?, reply = ?, updatedAt = CURRENT_TIMESTAMP
     WHERE id = ? AND companyId = ?`,
    [nextStatus, cleanReply || null, id, req.user.companyId],
    function cb(err) {
      if (err) return res.status(500).json({ message: 'Failed to update query' });
      if (!this.changes) return res.status(404).json({ message: 'Query not found' });
      res.json({ message: 'Query updated' });
    }
  );
};
