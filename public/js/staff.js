/* ============================================
   STAFF DASHBOARD FUNCTIONALITY
   ============================================ */

const StaffAPI = {
  async getStudents() {
    return API.get('/api/staff/students');
  },

  async getStudent(id) {
    return API.get(`/api/staff/students/${id}`);
  },

  async updateStudent(id, data) {
    return API.put(`/api/staff/students/${id}`, data);
  },

  async deleteStudent(id) {
    return API.delete(`/api/staff/students/${id}`);
  },

  async approveStudent(id) {
    return API.put(`/api/staff/students/${id}/approve`, {});
  },

  async getApplications() {
    return API.get('/api/staff/applications');
  },

  async getStudentProfile(studentId) {
    return API.get(`/api/staff/students/${studentId}/profile`);
  },

  async getStats() {
    return API.get('/api/staff/stats');
  },

  async getStudentCourses(id) {
    return API.get(`/api/staff/students/${id}/courses`);
  },

  async getStudentCart(id) {
    return API.get(`/api/staff/students/${id}/cart`);
  }
  ,
  async getOpportunities(params = {}) {
    const query = new URLSearchParams(params);
    return API.get(`/api/staff/opportunities${query.toString() ? `?${query.toString()}` : ''}`);
  },
  async getCourses(params = {}) {
    const query = new URLSearchParams(params);
    return API.get(`/api/staff/courses${query.toString() ? `?${query.toString()}` : ''}`);
  },
  async assignStudent(payload) {
    return API.post('/api/staff/assign', payload);
  }
};

let staffOpportunitySearchTimeout = null;

// Load user info
async function loadUserInfo() {
  try {
    const stats = await StaffAPI.getStats();
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
      userInfo.textContent = `👤 Staff Admin`;
    }
  } catch (error) {
    console.error('Failed to load user info:', error);
  }
}

// Update stats
async function updateStats() {
  try {
    const stats = await StaffAPI.getStats();

    document.getElementById('totalStudents').textContent = stats.totalStudents || 0;
    document.getElementById('approvedStudents').textContent = stats.approvedStudents || 0;
    document.getElementById('totalApplications').textContent = stats.totalApplications || 0;
    document.getElementById('pendingApprovals').textContent = stats.pendingApprovals || 0;
  } catch (error) {
    console.error('Failed to update stats:', error);
  }
}

// Display students
function displayStudents(students) {
  const container = document.getElementById('studentsContainer');

  if (!students || students.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👥</div>
        <h3>No students found</h3>
        <p>No students match the current filter</p>
      </div>
    `;
    return;
  }

  // Group students by department
  const grouped = students.reduce((acc, student) => {
    const dept = student.department || 'No Department';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(student);
    return acc;
  }, {});

  container.innerHTML = Object.keys(grouped).map(dept => `
    <div class="department-section">
      <h3 class="department-title">${dept}</h3>
      <div class="students-grid">
        ${grouped[dept].map(student => `
          <div class="student-card">
            <div class="card-header">
              ${student.photoPath ? `<img src="${student.photoPath}" alt="Photo" class="student-photo">` : '<div class="student-photo-placeholder">👤</div>'}
              <h4>${student.name || 'N/A'}</h4>
              <span class="badge ${student.approved ? 'badge-success' : 'badge-warning'}">
                ${student.approved ? 'Approved' : 'Pending'}
              </span>
            </div>
            <div class="card-body">
              <div class="student-info">
                <div class="info-item">
                  <strong>Register Number:</strong> ${student.registerNumber || 'N/A'}
                </div>
                <div class="info-item">
                  <strong>Year:</strong> ${student.yearOfStudy ? `${student.yearOfStudy} Year` : 'N/A'}
                </div>
                <div class="info-item">
                  <strong>Phone:</strong> ${student.phone || 'N/A'}
                </div>
                <div class="info-item">
                  <strong>CGPA:</strong> ${student.cgpa || 'N/A'}
                </div>
                <div class="info-item">
                  <strong>Email:</strong> ${student.email || 'N/A'}
                </div>
                ${student.skills ? `
                  <div class="info-item">
                    <strong>Skills:</strong> ${student.skills}
                  </div>
                ` : ''}
                ${student.address ? `
                  <div class="info-item">
                    <strong>Address:</strong> ${student.address}
                  </div>
                ` : ''}
              </div>
            </div>
            <div class="card-footer">
              <div class="btn-group">
                ${!student.approved ? `
                  <button class="btn btn-success btn-sm" onclick="approveStudent(${student.id})">
                    ✓ Approve
                  </button>
                ` : ''}
                <button class="btn btn-outline btn-sm" onclick="viewStudentDetails(${student.id})">
                  👁 View Details
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteStudent(${student.id})">
                  🗑 Delete
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// Display applications
function displayApplications(applications) {
  const container = document.getElementById('applicationsContainer');

  if (!applications || applications.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <h3>No applications yet</h3>
        <p>Student applications will appear here</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Type</th>
            <th>Title</th>
            <th>Company</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${applications.map(app => `
            <tr>
              <td><strong>${app.studentName || 'N/A'}</strong></td>
              <td><span class="badge badge-info">${app.targetType === 'job' ? 'Job' : app.targetType === 'course' ? 'Course' : 'Internship'}</span></td>
              <td>${app.title || 'N/A'}</td>
              <td>${app.companyName || 'N/A'}</td>
              <td>
                <span class="badge ${app.status === 'selected' || app.status === 'approved' ? 'badge-success' :
      app.status === 'rejected' ? 'badge-danger' :
        'badge-warning'
    }">
                  ${app.status || 'Applied'}
                </span>
              </td>
              <td>${formatDate(app.createdAt)}</td>
              <td>
                <button class="btn btn-info btn-sm" onclick="viewStudentProfileFromApp(${app.studentId || 'null'})" title="View Student Profile" ${!app.studentId ? 'disabled' : ''}>
                  👤 Profile
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Approve student
async function approveStudent(id) {
  if (!confirm('Are you sure you want to approve this student?')) return;

  try {
    Loading.show();
    const result = await StaffAPI.approveStudent(id);
    Loading.hide();
    Toast.success(result.message || 'Student approved successfully!');
    await loadStudents();
    await updateStats();
  } catch (error) {
    Loading.hide();
    Toast.error(error.message || 'Failed to approve student');
  }
}

// Delete student
async function deleteStudent(id) {
  if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) return;

  try {
    Loading.show();
    const result = await StaffAPI.deleteStudent(id);
    Loading.hide();
    Toast.success(result.message || 'Student deleted successfully!');
    await loadStudents();
    await updateStats();
  } catch (error) {
    Loading.hide();
    Toast.error(error.message || 'Failed to delete student');
  }
}

// View student details
async function viewStudentDetails(id) {
  try {
    Loading.show();
    const [student, courseData] = await Promise.all([
      StaffAPI.getStudent(id),
      StaffAPI.getStudentCourses(id)
    ]);
    Loading.hide();

    displayStudentCourseModal(student, courseData);
  } catch (error) {
    Loading.hide();
    Toast.error(error.message || 'Failed to load student details');
  }
}

// Display student course details in modal
function displayStudentCourseModal(student, courseData) {
  const modal = document.getElementById('courseModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('courseModalBody');

  // Debug logging
  console.log('Student data:', student);
  console.log('Course data:', courseData);

  modalTitle.textContent = `${student.name || 'Student'} - Course Details`;

  // Safely extract data with fallbacks
  const studentData = courseData.student || {};
  const summary = courseData.summary || {};
  const enrollments = courseData.enrollments || [];

  modalBody.innerHTML = `
    <div class="student-summary">
      <div class="progress-grid">
        <div class="progress-item">
          <label>Total Credits Earned</label>
          <span>${studentData.totalCreditsEarned || 0}</span>
        </div>
        <div class="progress-item">
          <label>Credits Pending</label>
          <span>${studentData.creditsPending || 0}</span>
        </div>
        <div class="progress-item">
          <label>Completion %</label>
          <span>${studentData.completionPercentage || 0}%</span>
        </div>
        <div class="progress-item">
          <label>Academic Standing</label>
          <span>${studentData.academicStanding || 'Good'}</span>
        </div>
      </div>
    </div>

    <div class="course-enrollments">
      <h4>Course Enrollments</h4>
      ${enrollments.length === 0 ? '<p>No course enrollments found.</p>' : `
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Category</th>
                <th>Credits</th>
                <th>Platform</th>
                <th>Status</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              ${enrollments.map(enrollment => `
                <tr>
                  <td>${enrollment.title || 'N/A'}</td>
                  <td><span class="badge badge-primary">${enrollment.category || 'N/A'}</span></td>
                  <td>${enrollment.credits || 0}</td>
                  <td>${enrollment.platform || 'N/A'}</td>
                  <td>
                    <span class="badge ${enrollment.status === 'completed' ? 'badge-success' : 'badge-warning'}">
                      ${enrollment.status || 'enrolled'}
                    </span>
                  </td>
                  <td>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: ${enrollment.progress || 0}%"></div>
                    </div>
                    <small>${enrollment.progress || 0}%</small>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;

  modal.style.display = 'flex';
}

// View student courses
async function viewStudentCourses(id) {
  try {
    Loading.show();
    const [student, courseData] = await Promise.all([
      StaffAPI.getStudent(id),
      StaffAPI.getStudentCourses(id)
    ]);
    Loading.hide();

    displayStudentCourseModal(student, courseData);
  } catch (error) {
    Loading.hide();
    Toast.error(error.message || 'Failed to load student courses');
  }
}

// View student cart
async function viewStudentCart(id) {
  try {
    Loading.show();
    const [student, cartData] = await Promise.all([
      StaffAPI.getStudent(id),
      StaffAPI.getStudentCart(id)
    ]);
    Loading.hide();

    displayStudentCartModal(student, cartData);
  } catch (error) {
    Loading.hide();
    Toast.error(error.message || 'Failed to load student cart');
  }
}

// Display student cart in modal
function displayStudentCartModal(student, cartData) {
  const modal = document.getElementById('courseModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('courseModalBody');

  console.log('Student data:', student);
  console.log('Cart data:', cartData);

  modalTitle.textContent = `${student.name || 'Student'} - Cart Items`;

  const studentData = cartData.student || {};
  const summary = cartData.summary || {};
  const cartItems = cartData.cartItems || [];

  modalBody.innerHTML = `
    <div class="student-summary">
      <div class="progress-grid">
        <div class="progress-item">
          <label>Total Items in Cart</label>
          <span>${summary.totalItems || 0}</span>
        </div>
        <div class="progress-item">
          <label>Total Credits</label>
          <span>${summary.totalCredits || 0}</span>
        </div>
        <div class="progress-item">
          <label>Student Name</label>
          <span>${studentData.name || 'N/A'}</span>
        </div>
        <div class="progress-item">
          <label>Department</label>
          <span>${studentData.department || 'N/A'}</span>
        </div>
      </div>
    </div>

    <div class="course-enrollments">
      <h4>Cart Items</h4>
      ${cartItems.length === 0 ? '<p>No items in cart.</p>' : `
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Company</th>
                <th>Category</th>
                <th>Credits</th>
                <th>Platform</th>
                <th>Duration</th>
                <th>Fees</th>
                <th>Added On</th>
              </tr>
            </thead>
            <tbody>
              ${cartItems.map(item => `
                <tr>
                  <td>${item.title || 'N/A'}</td>
                  <td>${item.companyName || 'N/A'}</td>
                  <td><span class="badge badge-primary">${item.category || 'N/A'}</span></td>
                  <td>${item.credits || 0}</td>
                  <td>${item.platform || 'N/A'}</td>
                  <td>${item.duration || 'N/A'}</td>
                  <td>${item.fees ? '₹' + item.fees : 'Free'}</td>
                  <td>${formatDate(item.addedAt)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;

  modal.style.display = 'flex';
}

// Close course modal
function closeCourseModal() {
  document.getElementById('courseModal').style.display = 'none';
}

// Load students
async function loadStudents() {
  try {
    Loading.show();
    const dept = document.getElementById('filterDept').value;
    const students = await StaffAPI.getStudents();
    Loading.hide();

    const filtered = dept ? students.filter(s => s.department === dept) : students;
    displayStudents(filtered);
  } catch (error) {
    Loading.hide();
    Toast.error(error.message || 'Failed to load students');
  }
}

// Load applications
async function loadApplications() {
  try {
    Loading.show();
    const applications = await StaffAPI.getApplications();
    Loading.hide();
    displayApplications(applications);
  } catch (error) {
    Loading.hide();
    Toast.error(error.message || 'Failed to load applications');
  }
}

// Logout
function logout() {
  API.setToken(null);
  Toast.info('Logged out successfully');
  setTimeout(() => window.location.href = '/', 1000);
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
  if (!checkAuth()) return;

  await loadUserInfo();
  await updateStats();
  await loadStudents();
  await loadApplications();
  await loadOpportunities();

  document.getElementById('loadStudents').addEventListener('click', loadStudents);
  document.getElementById('loadApplications').addEventListener('click', loadApplications);
  document.getElementById('filterDept').addEventListener('change', loadStudents);
  document.getElementById('loadOpportunities').addEventListener('click', loadOpportunities);
  const staffOpportunitySearch = document.getElementById('staffOpportunitySearch');
  const clearStaffOpportunitySearch = document.getElementById('clearStaffOpportunitySearch');

  if (staffOpportunitySearch) {
    staffOpportunitySearch.addEventListener('input', () => {
      if (staffOpportunitySearchTimeout) clearTimeout(staffOpportunitySearchTimeout);
      staffOpportunitySearchTimeout = setTimeout(() => {
        loadOpportunities();
      }, 250);
    });
  }

  if (clearStaffOpportunitySearch) {
    clearStaffOpportunitySearch.addEventListener('click', () => {
      if (staffOpportunitySearch) {
        staffOpportunitySearch.value = '';
      }
      loadOpportunities();
    });
  }
  
  // Add event listener for student profile modal close button
  document.getElementById('closeStudentProfileModal').addEventListener('click', hideStudentProfileModal);
});
// View student profile from applications
async function viewStudentProfileFromApp(studentId) {
  console.log('Viewing student profile for studentId:', studentId);
  
  if (!studentId) {
    Toast.error('Student ID is missing');
    return;
  }

  try {
    Loading.show();
    const profileData = await StaffAPI.getStudentProfile(studentId);
    Loading.hide();
    
    console.log('Profile data received:', profileData);
    showStudentProfileModal(profileData);
  } catch (error) {
    Loading.hide();
    console.error('Error loading student profile:', error);
    Toast.error(error.message || 'Failed to load student profile');
  }
}

// Show student profile modal
function showStudentProfileModal(data) {
  const { student, extraCourses, applications } = data;
  const modal = document.getElementById('studentProfileModal');
  const title = document.getElementById('studentProfileTitle');
  const content = document.getElementById('studentProfileContent');

  title.textContent = `${student.name} - Complete Profile`;

  content.innerHTML = `
    <div class="student-profile-container">
      <!-- Basic Information -->
      <div class="profile-section">
        <h4>📋 Basic Information</h4>
        <div class="profile-grid">
          <div class="profile-item">
            <label>Full Name:</label>
            <span>${student.name || 'N/A'}</span>
          </div>
          <div class="profile-item">
            <label>Email:</label>
            <span>${student.email || 'N/A'}</span>
          </div>
          <div class="profile-item">
            <label>Register Number:</label>
            <span>${student.registerNumber || 'N/A'}</span>
          </div>
          <div class="profile-item">
            <label>Department:</label>
            <span>${student.department || 'N/A'}</span>
          </div>
          <div class="profile-item">
            <label>Year of Study:</label>
            <span>${student.yearOfStudy ? student.yearOfStudy + ' Year' : 'N/A'}</span>
          </div>
          <div class="profile-item">
            <label>CGPA:</label>
            <span>${student.cgpa || 'N/A'}</span>
          </div>
          <div class="profile-item">
            <label>Phone:</label>
            <span>${student.phone || 'N/A'}</span>
          </div>
          <div class="profile-item">
            <label>Gender:</label>
            <span>${student.gender || 'N/A'}</span>
          </div>
          <div class="profile-item">
            <label>Date of Birth:</label>
            <span>${student.dateOfBirth ? formatDate(student.dateOfBirth) : 'N/A'}</span>
          </div>
          <div class="profile-item">
            <label>Joined:</label>
            <span>${formatDate(student.joinedDate)}</span>
          </div>
          <div class="profile-item">
            <label>Approval Status:</label>
            <span class="badge ${student.approved ? 'badge-success' : 'badge-warning'}">
              ${student.approved ? 'Approved' : 'Pending Approval'}
            </span>
          </div>
          <div class="profile-item">
            <label>College Code:</label>
            <span>${student.collegeCode || 'N/A'}</span>
          </div>
        </div>
        
        ${student.skills ? `
          <div class="profile-item full-width">
            <label>Skills:</label>
            <div class="skills-container">
              ${student.skills.split(',').map(skill => 
                `<span class="skill-tag">${skill.trim()}</span>`
              ).join('')}
            </div>
          </div>
        ` : ''}
        
        ${student.address ? `
          <div class="profile-item full-width">
            <label>Address:</label>
            <span>${student.address}</span>
          </div>
        ` : ''}

        ${student.resumePath ? `
          <div class="profile-item full-width">
            <label>Resume:</label>
            <a href="${student.resumePath.startsWith('/') ? student.resumePath : '/uploads/' + student.resumePath}" 
               target="_blank" class="btn btn-outline btn-sm">
              📄 View Resume
            </a>
          </div>
        ` : ''}

        ${student.photoPath ? `
          <div class="profile-item full-width">
            <label>Profile Photo:</label>
            <div class="profile-photo-container">
              <img src="${student.photoPath.startsWith('/') ? student.photoPath : '/uploads/' + student.photoPath}" 
                   alt="Profile Photo" class="profile-photo-preview">
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Extra Courses -->
      ${extraCourses && extraCourses.length > 0 ? `
        <div class="profile-section">
          <h4>📚 Additional Courses & Certifications</h4>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Course Name</th>
                  <th>Platform</th>
                  <th>Category</th>
                  <th>Credits</th>
                  <th>Status</th>
                  <th>Grade</th>
                  <th>Completion Date</th>
                </tr>
              </thead>
              <tbody>
                ${extraCourses.map(course => `
                  <tr>
                    <td>
                      ${course.courseName}
                      ${course.certificateUrl ? 
                        `<a href="${course.certificateUrl}" target="_blank" class="text-primary" title="View Certificate">🔗</a>` 
                        : ''
                      }
                    </td>
                    <td>${course.platform || '-'}</td>
                    <td><span class="badge badge-info">${course.category || '-'}</span></td>
                    <td>${course.credits || 0}</td>
                    <td>
                      <span class="badge ${course.status === 'completed' ? 'badge-success' : 
                        course.status === 'dropped' ? 'badge-danger' : 'badge-warning'}">
                        ${course.status === 'in_progress' ? 'In Progress' : course.status || 'In Progress'}
                      </span>
                    </td>
                    <td>${course.grade || '-'}</td>
                    <td>${course.completionDate ? formatDate(course.completionDate) : '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      <!-- Complete Application History -->
      ${applications && applications.length > 0 ? `
        <div class="profile-section">
          <h4>📋 Complete Application History</h4>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Opportunity</th>
                  <th>Company</th>
                  <th>Industry</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Applied Date</th>
                </tr>
              </thead>
              <tbody>
                ${applications.map(app => `
                  <tr>
                    <td><span class="badge badge-info">${app.targetType === 'job' ? 'Job' : app.targetType === 'course' ? 'Course' : 'Internship'}</span></td>
                    <td>${app.opportunityTitle || 'N/A'}</td>
                    <td>${app.companyName || 'N/A'}</td>
                    <td>${app.companyIndustry || 'N/A'}</td>
                    <td>${app.opportunityDepartment || 'N/A'}</td>
                    <td>
                      <span class="badge ${app.status === 'selected' || app.status === 'approved' ? 'badge-success' :
                        app.status === 'rejected' ? 'badge-danger' : 'badge-warning'}">
                        ${app.status || 'Applied'}
                      </span>
                    </td>
                    <td>${formatDate(app.createdAt)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : `
        <div class="profile-section">
          <h4>📋 Application History</h4>
          <p class="text-muted">This student has not applied to any opportunities yet.</p>
        </div>
      `}

      <!-- Staff Actions -->
      <div class="profile-section">
        <h4>👨‍💼 Staff Actions</h4>
        <div class="btn-group">
          ${!student.approved ? `
            <button class="btn btn-success" onclick="approveStudentFromProfile(${student.id})">
              ✅ Approve Student
            </button>
          ` : `
            <span class="badge badge-success">✅ Student Already Approved</span>
          `}
        </div>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
}

// Hide student profile modal
function hideStudentProfileModal() {
  document.getElementById('studentProfileModal').style.display = 'none';
}

// Approve student from profile modal
async function approveStudentFromProfile(studentId) {
  if (!confirm('Are you sure you want to approve this student?')) return;

  try {
    Loading.show();
    const result = await StaffAPI.approveStudent(studentId);
    Loading.hide();
    Toast.success(result.message || 'Student approved successfully!');
    
    // Refresh the profile and other data
    hideStudentProfileModal();
    await loadApplications();
    await updateStats();
  } catch (error) {
    Loading.hide();
    Toast.error(error.message || 'Failed to approve student');
  }
}

function getStaffOpportunitySearchQuery() {
  const searchInput = document.getElementById('staffOpportunitySearch');
  return (searchInput?.value || '').trim();
}

// Load opportunities (jobs + internships)
async function loadOpportunities() {
  try {
    Loading.show();
    const search = getStaffOpportunitySearchQuery();
    const [opportunities, courses] = await Promise.all([
      StaffAPI.getOpportunities({ search }),
      StaffAPI.getCourses({ search })
    ]);
    Loading.hide();

    const jobsContainer = document.getElementById('opportunitiesJobsContainer');
    const internshipsContainer = document.getElementById('opportunitiesInternshipsContainer');
    const coursesContainer = document.getElementById('opportunitiesCoursesContainer');

    const safeOps = Array.isArray(opportunities) ? opportunities : [];
    const jobs = safeOps.filter(op => op.type === 'job');
    const internships = safeOps.filter(op => op.type === 'internship');
    const safeCourses = Array.isArray(courses) ? courses : [];

    renderOpportunitiesTable(jobsContainer, jobs, 'No jobs found', search ? 'Try a different search' : 'Click "Refresh" to load jobs');
    renderOpportunitiesTable(internshipsContainer, internships, 'No internships found', search ? 'Try a different search' : 'Click "Refresh" to load internships');
    renderOpportunitiesTable(coursesContainer, safeCourses, 'No courses found', search ? 'Try a different search' : 'Click "Refresh" to load courses');
  } catch (error) {
    Loading.hide();
    Toast.error(error.message || 'Failed to load opportunities');
  }
}

function renderOpportunitiesTable(container, items, emptyTitle, emptySubtitle) {
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="empty-state staff-light">
        <div class="empty-state-icon">💼</div>
        <h3>${emptyTitle}</h3>
        <p>${emptySubtitle}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Title</th>
            <th>Company</th>
            <th>Department</th>
            <th>Skills</th>
            <th>Posted</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(op => `
            <tr>
              <td><span class="badge badge-info">${op.type === 'job' ? 'Job' : op.type === 'course' ? 'Course' : 'Internship'}</span></td>
              <td>${op.title}</td>
              <td>${op.companyName || '-'}</td>
              <td>${op.department || '-'}</td>
              <td>${op.requiredSkills || '-'}</td>
              <td>${formatDate(op.createdAt)}</td>
              <td>
                <button class="btn btn-secondary btn-sm" onclick="promptAssign(${op.id}, '${op.type}')">Assign</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Prompt staff for student email and assign
function promptAssign(targetId, targetType) {
  const studentEmail = prompt('Enter student email to assign this opportunity to:');
  if (!studentEmail) return;
  assignStudentToOpportunity(studentEmail.trim(), targetType, targetId);
}

async function assignStudentToOpportunity(studentEmailOrId, targetType, targetId) {
  try {
    Loading.show();
    const payload = { targetType, targetId };
    // Detect email vs numeric id
    if (typeof studentEmailOrId === 'string' && studentEmailOrId.includes('@')) {
      payload.studentEmail = studentEmailOrId;
    } else {
      payload.studentId = Number(studentEmailOrId);
    }

    const res = await StaffAPI.assignStudent(payload);
    Loading.hide();
    Toast.success(res.message || 'Student assigned');
    await loadApplications();
  } catch (error) {
    Loading.hide();
    Toast.error(error.message || 'Failed to assign student');
  }
}
