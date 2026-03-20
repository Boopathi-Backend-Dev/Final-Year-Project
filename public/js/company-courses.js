/* ============================================
   COMPANY COURSES PAGE FUNCTIONALITY
   ============================================ */

const CourseAPI = {
  async createCourse(data) {
    return API.post('/api/company/courses', data);
  },

  async getCourses() {
    return API.get('/api/company/courses');
  },

  async getApplicants(courseId) {
    return API.get(`/api/company/applications?targetType=course&targetId=${courseId}`);
  },

  async updateApplicationStatus(applicationId, status) {
    return API.put(`/api/company/applications/${applicationId}`, { status });
  }
};

// Load user info
async function loadUserInfo() {
  try {
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
      userInfo.textContent = `👤 Company Admin`;
    }
  } catch (error) {
    console.error('Failed to load user info:', error);
  }
}

// Load and display courses
async function loadCourses() {
  try {
    Loading.show();
    const courses = await CourseAPI.getCourses();
    Loading.hide();
    displayCourses(courses);
    populateCourseDropdown(courses);
  } catch (error) {
    Loading.hide();
    Toast.error(error.message || 'Failed to load courses');
  }
}

// Display courses
function displayCourses(courses) {
  const container = document.getElementById('coursesContainer');
  
  if (!courses || courses.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📚</div>
        <h3>No courses posted yet</h3>
        <p>Create a new course to get started</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="opportunities-grid">
      ${courses.map(course => `
        <div class="opportunity-card">
          <h4>${course.title}</h4>
          <div class="meta">
            ${course.department ? `<span class="meta-item">📚 ${course.department}</span>` : ''}
            <span class="badge badge-secondary">Course</span>
            <span class="badge badge-info">ID: ${course.id}</span>
          </div>
          <p class="description">${course.description || 'No description available'}</p>
          ${course.requiredSkills ? `<p><strong>Skills:</strong> ${course.requiredSkills}</p>` : ''}
          ${course.fees ? `<p><strong>Fees:</strong> ₹${course.fees}</p>` : ''}
          ${course.duration ? `<p><strong>Duration:</strong> ${course.duration}</p>` : ''}
          ${course.mode ? `<p><strong>Mode:</strong> ${course.mode}</p>` : ''}
          ${course.courseLink ? `<p><strong>Link:</strong> <a href="${course.courseLink}" target="_blank">${course.courseLink}</a></p>` : ''}
          <p><small>Posted: ${formatDate(course.createdAt)}</small></p>
        </div>
      `).join('')}
    </div>
  `;
}

// Populate course dropdown for applicant filter
function populateCourseDropdown(courses) {
  const select = document.getElementById('courseId');
  select.innerHTML = '<option value="">Select a course</option>';
  
  courses.forEach(course => {
    const option = document.createElement('option');
    option.value = course.id;
    option.textContent = `${course.title} (ID: ${course.id})`;
    select.appendChild(option);
  });
}

// Display applicants
function displayApplicants(applicants) {
  const container = document.getElementById('courseApplicantsContainer');
  
  if (!applicants || applicants.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👥</div>
        <h3>No applicants found</h3>
        <p>No students have applied for this course yet</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Register Number</th>
            <th>Department</th>
            <th>CGPA</th>
            <th>Skills</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${applicants.map(app => `
            <tr>
              <td><strong>${app.studentName || 'N/A'}</strong></td>
              <td>${app.registerNumber || 'N/A'}</td>
              <td>${app.department || 'N/A'}</td>
              <td>${app.cgpa || 'N/A'}</td>
              <td>${app.skills || 'N/A'}</td>
              <td>
                <span class="badge ${
                  app.status === 'selected' || app.status === 'approved' ? 'badge-success' :
                  app.status === 'rejected' ? 'badge-danger' :
                  'badge-warning'
                }">
                  ${app.status || 'Applied'}
                </span>
              </td>
              <td>
                <div class="btn-group">
                  ${app.status !== 'selected' ? `
                    <button class="btn btn-success btn-sm" onclick="updateApplicationStatus(${app.applicationId}, 'selected')">
                      ✓ Select
                    </button>
                  ` : ''}
                  ${app.status !== 'rejected' ? `
                    <button class="btn btn-danger btn-sm" onclick="updateApplicationStatus(${app.applicationId}, 'rejected')">
                      ✕ Reject
                    </button>
                  ` : ''}
                  ${app.resumePath ? `
                    <a href="${app.resumePath.startsWith('/') ? app.resumePath : '/uploads/' + app.resumePath}" target="_blank" class="btn btn-outline btn-sm">
                      📄 Resume
                    </a>
                  ` : ''}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Update application status
async function updateApplicationStatus(applicationId, status) {
  const action = status === 'selected' ? 'select' : 'reject';
  if (!confirm(`Are you sure you want to ${action} this applicant?`)) return;
  
  try {
    Loading.show();
    const result = await CourseAPI.updateApplicationStatus(applicationId, status);
    Loading.hide();
    Toast.success(result.message || `Application ${status}ed successfully!`);
    
    // Reload applicants
    const courseId = document.getElementById('courseId').value;
    if (courseId) {
      await loadApplicants(courseId);
    }
  } catch (error) {
    Loading.hide();
    Toast.error(error.message || 'Failed to update application status');
  }
}

// Load applicants for a course
async function loadApplicants(courseId) {
  try {
    Loading.show();
    const applicants = await CourseAPI.getApplicants(courseId);
    Loading.hide();
    displayApplicants(applicants);
  } catch (error) {
    Loading.hide();
    Toast.error(error.message || 'Failed to load applicants');
  }
}

// Logout
function logout() {
  API.setToken(null);
  Toast.info('Logged out successfully');
  setTimeout(() => window.location.href = '/', 1000);
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
  if (!checkAuth()) return;

  await loadUserInfo();
  await loadCourses();

  // Course form handler
  const courseForm = document.getElementById('courseForm');
  if (courseForm) {
    courseForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = courseForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> Posting...';

        const formData = new FormData(courseForm);
        const payload = Object.fromEntries(formData);
        const result = await CourseAPI.createCourse(payload);

        Toast.success(result.message || 'Course posted successfully!');
        courseForm.reset();
        await loadCourses();
      } catch (error) {
        Toast.error(error.message || 'Failed to post course');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // Applicant filter form
  const applicantForm = document.getElementById('courseApplicantFilter');
  if (applicantForm) {
    applicantForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const courseId = document.getElementById('courseId').value;
      
      if (!courseId) {
        Toast.warning('Please select a course');
        return;
      }
      
      await loadApplicants(courseId);
    });
  }

  // Refresh button
  const refreshBtn = document.getElementById('refreshCourses');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadCourses);
  }
});
