/* ============================================
   COMPANY DASHBOARD FUNCTIONALITY
   ============================================ */

const CompanyAPI = {
  async createJob(data) {
    return API.post('/api/company/jobs', data);
  },

  async getJobs() {
    return API.get('/api/company/jobs');
  },

  async createCourse(data) {
    return API.post('/api/company/courses', data);
  },

  async getCourses() {
    return API.get('/api/company/courses');
  },

  async getApplicants(targetType, targetId) {
    return API.get(`/api/company/applications?targetType=${targetType}&targetId=${targetId}`);
  },

  async getStudentProfile(studentId) {
    console.log('API call: getStudentProfile for studentId:', studentId);
    const url = `/api/company/student-profile/${studentId}`;
    console.log('API URL:', url);
    return API.get(url);
  },

  async updateApplicationStatus(applicationId, status) {
    return API.put(`/api/company/applications/${applicationId}`, { status });
  },

  async getProfile() {
    return API.get('/api/company/profile');
  },

  async updateProfile(data) {
    return API.post('/api/company/profile', data);
  },

  async createInternship(data) {
    return API.post('/api/company/internships', data);
  },

  async getInternships() {
    return API.get('/api/company/internships');
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

// Load company profile
async function loadProfile() {
  try {
    const profile = await CompanyAPI.getProfile();
    if (profile) {
      // Populate view fields
      document.getElementById('viewCompanyName').textContent = profile.name || 'Company Name';
      document.getElementById('viewIndustry').textContent = profile.industry || '-';
      document.getElementById('viewEmail').textContent = profile.email || '-';
      document.getElementById('viewPhone').textContent = profile.phone || '-';
      document.getElementById('viewWebsite').textContent = profile.website || '-';
      document.getElementById('viewCompanySize').textContent = profile.companySize || '-';
      document.getElementById('viewFoundedYear').textContent = profile.foundedYear || '-';
      document.getElementById('viewDescription').textContent = profile.description || '-';
      document.getElementById('viewAddress').textContent = profile.address || '-';

      // Handle company logo display
      const logoContainer = document.getElementById('companyLogoContainer');
      const logoPlaceholder = document.getElementById('companyLogoPlaceholder');
      const logoImg = document.getElementById('companyLogo');
      
      if (profile.logoPath || profile.logoUrl) {
        const logoSrc = profile.logoPath || profile.logoUrl;
        logoImg.src = logoSrc.startsWith('/') ? logoSrc : '/uploads/' + logoSrc;
        logoImg.style.display = 'block';
        logoPlaceholder.style.display = 'none';
      } else {
        logoImg.style.display = 'none';
        logoPlaceholder.style.display = 'flex';
        // Use first letter of company name as placeholder
        const firstLetter = (profile.name || 'C').charAt(0).toUpperCase();
        logoPlaceholder.textContent = firstLetter;
      }

      // Populate form fields
      document.getElementById('name').value = profile.name || '';
      document.getElementById('description').value = profile.description || '';
      document.getElementById('industry').value = profile.industry || '';
      document.getElementById('email').value = profile.email || '';
      document.getElementById('phone').value = profile.phone || '';
      document.getElementById('website').value = profile.website || '';
      document.getElementById('foundedYear').value = profile.foundedYear || '';
      document.getElementById('companySize').value = profile.companySize || '';
      document.getElementById('companyType').value = profile.companyType || '';
      document.getElementById('address').value = profile.address || '';
      document.getElementById('city').value = profile.city || '';
      document.getElementById('state').value = profile.state || '';

      // Show view mode if profile exists
      document.getElementById('profileView').style.display = 'block';
      document.getElementById('profileForm').style.display = 'none';
      document.getElementById('editProfileBtn').style.display = 'inline-flex';
      document.getElementById('cancelEditBtn').style.display = 'none';
    } else {
      // Show form if no profile
      document.getElementById('profileView').style.display = 'none';
      document.getElementById('profileForm').style.display = 'block';
      document.getElementById('editProfileBtn').style.display = 'none';
      document.getElementById('cancelEditBtn').style.display = 'none';
    }
  } catch (error) {
    console.error('Failed to load profile:', error);
    // Show form on error
    document.getElementById('profileView').style.display = 'none';
    document.getElementById('profileForm').style.display = 'block';
    document.getElementById('editProfileBtn').style.display = 'none';
    document.getElementById('cancelEditBtn').style.display = 'none';
  }
}

// Update stats
async function updateStats() {
  try {
    const [jobs, courses, internships] = await Promise.all([
      CompanyAPI.getJobs().catch(() => []),
      CompanyAPI.getCourses().catch(() => []),
      CompanyAPI.getInternships().catch(() => [])
    ]);

    document.getElementById('totalJobs').textContent = jobs.length || 0;
    document.getElementById('totalCourses').textContent = courses.length || 0;
    document.getElementById('totalInternships').textContent = internships.length || 0;

    // Count total applicants (simplified - would need proper endpoint in production)
    let totalApplicants = 0;
    try {
      for (const job of jobs) {
        const applicants = await CompanyAPI.getApplicants('job', job.id).catch(() => []);
        totalApplicants += applicants.length;
      }
      for (const course of courses) {
        const applicants = await CompanyAPI.getApplicants('course', course.id).catch(() => []);
        totalApplicants += applicants.length;
      }
      // Note: Internships would also need applicant counting in a full implementation
    } catch (e) {
      // Ignore errors in counting
    }
    document.getElementById('totalApplicants').textContent = totalApplicants;
  } catch (error) {
    console.error('Failed to update stats:', error);
  }
}

let currentOpportunityType = null;
let currentOpportunities = [];

function getOpportunitySearchQuery() {
  const searchInput = document.getElementById('companyOpportunitySearch');
  return (searchInput?.value || '').trim().toLowerCase();
}

function filterOpportunitiesBySearch(opportunities, query) {
  if (!query) return opportunities;

  return opportunities.filter((opp) => {
    const haystack = [
      opp.title,
      opp.department,
      opp.requiredSkills,
      opp.description,
      opp.location,
      opp.duration,
      opp.category,
      opp.platform
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });
}

function renderCurrentOpportunities() {
  if (!currentOpportunityType) return;
  const filtered = filterOpportunitiesBySearch(currentOpportunities, getOpportunitySearchQuery());
  displayOpportunities(filtered, currentOpportunityType);
}

// Display opportunities
function displayOpportunities(opportunities, type) {
  const container = document.getElementById('opportunitiesContainer');

  // Ensure opportunities is an array
  let list = Array.isArray(opportunities) ? opportunities : [];
  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <h3>No ${type} posted yet</h3>
        <p>Create a new ${type === 'jobs' ? 'job' : 'course'} to get started</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="opportunities-grid">
      ${list.map(opp => `
        <div class="opportunity-card">
          <h4>${opp.title}</h4>
          <div class="meta">
            ${opp.department ? `<span class="meta-item">📚 ${opp.department}</span>` : ''}
            <span class="badge badge-primary">${type === 'jobs' ? 'Job' : type === 'courses' ? 'Course' : 'Internship'}</span>
            <span class="badge badge-info">ID: ${opp.id}</span>
          </div>
          <p class="description">${opp.description || 'No description available'}</p>
          ${opp.requiredSkills ? `<p><strong>Skills:</strong> ${opp.requiredSkills}</p>` : ''}
          ${opp.fees ? `<p><strong>Fees:</strong> ₹${opp.fees}</p>` : ''}
          ${opp.stipend ? `<p><strong>Stipend:</strong> ₹${opp.stipend}</p>` : ''}
          ${opp.duration ? `<p><strong>Duration:</strong> ${opp.duration}</p>` : ''}
          <p><small>Posted: ${formatDate(opp.createdAt)}</small></p>
        </div>
      `).join('')}
    </div>
  `;
}

// Display applicants
function displayApplicants(applicants) {
  const container = document.getElementById('applicantsContainer');

  if (!applicants || applicants.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👥</div>
        <h3>No applicants found</h3>
        <p>No students have applied for this opportunity yet</p>
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
                <span class="badge ${app.status === 'selected' || app.status === 'approved' ? 'badge-success' :
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
                  <button class="btn btn-info btn-sm" onclick="viewStudentProfile(${app.studentId || 'null'})" title="View Full Profile" ${!app.studentId ? 'disabled' : ''}>
                    👤 Profile
                  </button>
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
    const result = await CompanyAPI.updateApplicationStatus(applicationId, status);
    Loading.hide();
    Toast.success(result.message || `Application ${status}ed successfully!`);

    // Reload applicants
    const form = document.getElementById('applicantFilter');
    const targetType = form.targetType.value;
    const targetId = form.targetId.value;
    if (targetType && targetId) {
      await loadApplicants(targetType, targetId);
    }
  } catch (error) {
    Loading.hide();
    Toast.error(error.message || 'Failed to update application status');
  }
}

// Load jobs
async function loadJobs() {
  try {
    Loading.show();
    const jobs = await CompanyAPI.getJobs();
    Loading.hide();
    currentOpportunityType = 'jobs';
    currentOpportunities = Array.isArray(jobs) ? jobs : [];
    renderCurrentOpportunities();
  } catch (error) {
    Loading.hide();
    Toast.error(error.message || 'Failed to load jobs');
  }
}

// Load courses
async function loadCourses() {
  try {
    Loading.show();
    const courses = await CompanyAPI.getCourses();
    Loading.hide();
    currentOpportunityType = 'courses';
    currentOpportunities = Array.isArray(courses) ? courses : [];
    renderCurrentOpportunities();
  } catch (error) {
    Loading.hide();
    Toast.error(error.message || 'Failed to load courses');
  }
}

// Load internships
async function loadInternships() {
  try {
    Loading.show();
    const internships = await CompanyAPI.getInternships();
    Loading.hide();
    currentOpportunityType = 'internships';
    currentOpportunities = Array.isArray(internships) ? internships : [];
    renderCurrentOpportunities();
  } catch (error) {
    Loading.hide();
    Toast.error(error.message || 'Failed to load internships');
  }
}

// Load applicants
async function loadApplicants(targetType, targetId) {
  try {
    Loading.show();
    const applicants = await CompanyAPI.getApplicants(targetType, targetId);
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

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
  if (!checkAuth()) return;

  await loadUserInfo();
  await loadProfile();
  await updateStats();

  // Job form handler
  const jobForm = document.getElementById('jobForm');
  if (jobForm) {
    jobForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = jobForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> Posting...';

        const formData = new FormData(jobForm);
        const payload = Object.fromEntries(formData);
        const result = await CompanyAPI.createJob(payload);

        Toast.success(result.message || 'Job posted successfully!');
        jobForm.reset();
        await updateStats();
        await loadJobs();
      } catch (error) {
        Toast.error(error.message || 'Failed to post job');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

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
        const result = await CompanyAPI.createCourse(payload);

        Toast.success(result.message || 'Course posted successfully!');
        courseForm.reset();
        await updateStats();
        await loadCourses();
      } catch (error) {
        Toast.error(error.message || 'Failed to post course');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // Internship form handler
  const internshipForm = document.getElementById('internshipForm');
  if (internshipForm) {
    internshipForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = internshipForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> Posting...';

        const formData = new FormData(internshipForm);
        const payload = Object.fromEntries(formData);
        const result = await CompanyAPI.createInternship(payload);

        Toast.success(result.message || 'Internship posted successfully!');
        internshipForm.reset();
        await updateStats();
      } catch (error) {
        Toast.error(error.message || 'Failed to post internship');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // Applicant filter form
  const applicantForm = document.getElementById('applicantFilter');
  if (applicantForm) {
    applicantForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const targetType = applicantForm.targetType.value;
      const targetId = applicantForm.targetId.value;

      if (!targetType || !targetId) {
        Toast.warning('Please select type and enter ID');
        return;
      }

      await loadApplicants(targetType, targetId);
    });
  }

  // Profile form handler
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = profileForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> Updating...';

        const formData = new FormData(profileForm);
        const payload = Object.fromEntries(formData);
        const result = await CompanyAPI.updateProfile(payload);

        Toast.success(result.message || 'Profile updated successfully!');
        // Reload profile to show updated info
        await loadProfile();
      } catch (error) {
        Toast.error(error.message || 'Failed to update profile');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // Profile edit/view toggle
  document.getElementById('editProfileBtn').addEventListener('click', () => {
    document.getElementById('profileView').style.display = 'none';
    document.getElementById('profileForm').style.display = 'block';
    document.getElementById('editProfileBtn').style.display = 'none';
    document.getElementById('cancelEditBtn').style.display = 'inline-flex';
  });

  document.getElementById('cancelEditBtn').addEventListener('click', () => {
    document.getElementById('profileView').style.display = 'block';
    document.getElementById('profileForm').style.display = 'none';
    document.getElementById('editProfileBtn').style.display = 'inline-flex';
    document.getElementById('cancelEditBtn').style.display = 'none';
  });

  // Event listeners
  document.getElementById('loadJobs').addEventListener('click', loadJobs);
  document.getElementById('loadCourses').addEventListener('click', loadCourses);
  document.getElementById('loadInternships').addEventListener('click', loadInternships);

  // Opportunity search
  const opportunitySearchInput = document.getElementById('companyOpportunitySearch');
  const clearOpportunitySearchBtn = document.getElementById('clearCompanyOpportunitySearch');

  if (opportunitySearchInput) {
    opportunitySearchInput.addEventListener('input', () => {
      if (!currentOpportunityType) return;
      renderCurrentOpportunities();
    });
  }

  if (clearOpportunitySearchBtn) {
    clearOpportunitySearchBtn.addEventListener('click', () => {
      if (opportunitySearchInput) {
        opportunitySearchInput.value = '';
      }
      if (!currentOpportunityType) return;
      renderCurrentOpportunities();
    });
  }

  // Student profile modal close button
  const closeStudentProfileBtn = document.getElementById('closeStudentProfileModal');
  if (closeStudentProfileBtn) {
    closeStudentProfileBtn.addEventListener('click', hideStudentProfileModal);
  }

  // Close modal when clicking outside
  document.addEventListener('click', (e) => {
    if (e.target.id === 'studentProfileModal') {
      hideStudentProfileModal();
    }
  });
});
// View student profile
async function viewStudentProfile(studentId) {
  console.log('Viewing profile for studentId:', studentId);
  
  if (!studentId) {
    Toast.error('Student ID is missing');
    return;
  }

  try {
    Loading.show();
    const profileData = await CompanyAPI.getStudentProfile(studentId);
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

  title.textContent = `${student.name} - Profile`;

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

      <!-- Application History with this Company -->
      ${applications && applications.length > 0 ? `
        <div class="profile-section">
          <h4>📋 Application History with Your Company</h4>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Opportunity</th>
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
          <p class="text-muted">This student has not applied to any of your opportunities yet.</p>
        </div>
      `}
    </div>
  `;

  modal.style.display = 'flex';
}

// Hide student profile modal
function hideStudentProfileModal() {
  document.getElementById('studentProfileModal').style.display = 'none';
}

// Test function for debugging
function testStudentProfile() {
  console.log('Testing student profile with ID 13...');
  viewStudentProfile(13);
}
