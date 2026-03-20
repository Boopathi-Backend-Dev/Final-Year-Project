/* ============================================
   COURSE PROGRESS TRACKING - STUDENT INTERFACE
   ============================================ */

const CourseProgressAPI = {
  // Course modules
  async getCourseModules(courseId) {
    return API.get(`/api/progress/courses/${courseId}/modules`);
  },

  // Attendance
  async getAttendance(studentId, courseId) {
    return API.get(`/api/progress/attendance/${studentId}/${courseId}`);
  },

  // Module progress
  async updateModuleProgress(data) {
    return API.post('/api/progress/progress/module', data);
  },

  async getModuleProgress(studentId, courseId) {
    return API.get(`/api/progress/progress/modules/${studentId}/${courseId}`);
  },

  // Practices
  async getCoursePractices(courseId) {
    return API.get(`/api/progress/courses/${courseId}/practices`);
  },

  async submitPractice(data) {
    return API.post('/api/progress/practices/submit', data);
  },

  async getStudentPractices(studentId, courseId) {
    return API.get(`/api/progress/practices/${studentId}/${courseId}`);
  },

  // Overall progress
  async getCourseProgress(studentId, courseId) {
    return API.get(`/api/progress/progress/${studentId}/${courseId}`);
  },

  // Study sessions
  async logStudySession(data) {
    return API.post('/api/progress/sessions', data);
  },

  async getStudySessions(studentId, courseId) {
    return API.get(`/api/progress/sessions/${studentId}/${courseId}`);
  }
};

// Global state
let currentStudentId = null;
let currentCourseId = null;
let currentModules = [];
let currentPractices = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Get student ID from profile
    const profile = await StudentAPI.getProfile();
    currentStudentId = profile.id;

    // Load available courses
    await loadAvailableCourses();

    // Setup event listeners
    setupEventListeners();
  } catch (error) {
    console.error('Failed to initialize:', error);
    Toast.error('Failed to load course progress system');
  }
});

// Setup event listeners
function setupEventListeners() {
  // Chat input enter key
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });
  }

  // Set default session date to today
  const sessionDate = document.getElementById('sessionDate');
  if (sessionDate) {
    sessionDate.value = new Date().toISOString().split('T')[0];
  }
}

// Load available courses for the student
async function loadAvailableCourses() {
  try {
    // Get courses from student applications
    const applications = await StudentAPI.getApplications();
    const courseApplications = applications.filter(app => 
      app.targetType === 'course' && 
      (app.status === 'selected' || app.status === 'approved')
    );

    const courseSelect = document.getElementById('courseSelect');
    if (!courseSelect) return;

    courseSelect.innerHTML = '<option value="">-- Select a Course --</option>';

    if (courseApplications.length === 0) {
      courseSelect.innerHTML += '<option value="" disabled>No enrolled courses found</option>';
      return;
    }

    courseApplications.forEach(app => {
      const option = document.createElement('option');
      option.value = app.targetId;
      option.textContent = app.title || 'Course';
      option.dataset.courseName = app.title;
      option.dataset.courseDescription = app.description || '';
      courseSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Failed to load courses:', error);
    Toast.error('Failed to load available courses');
  }
}

// Load course progress when course is selected
async function loadCourseProgress() {
  const courseSelect = document.getElementById('courseSelect');
  const selectedOption = courseSelect.options[courseSelect.selectedIndex];
  
  if (!courseSelect.value) {
    document.getElementById('progressOverview').style.display = 'none';
    return;
  }

  currentCourseId = courseSelect.value;

  try {
    Loading.show();

    // Update course header
    document.getElementById('courseName').textContent = selectedOption.dataset.courseName || 'Course';
    document.getElementById('courseDescription').textContent = selectedOption.dataset.courseDescription || '';

    // Load all data in parallel
    await Promise.all([
      loadOverallProgress(),
      loadModules(),
      loadPractices(),
      loadAttendance(),
      loadStudySessions()
    ]);

    // Show progress overview
    document.getElementById('progressOverview').style.display = 'block';

    Loading.hide();
  } catch (error) {
    Loading.hide();
    console.error('Failed to load course progress:', error);
    Toast.error('Failed to load course progress');
  }
}

// Load overall progress
async function loadOverallProgress() {
  try {
    const progress = await CourseProgressAPI.getCourseProgress(currentStudentId, currentCourseId);

    // Update progress ring
    const progressRing = document.getElementById('overallProgressRing');
    const progressValue = document.getElementById('overallProgressValue');
    const overallProgress = progress.overallProgress || 0;

    progressRing.style.setProperty('--progress', overallProgress);
    progressValue.textContent = `${overallProgress}%`;

    // Update stats
    document.getElementById('modulesCompleted').textContent = 
      `${progress.modulesCompleted || 0}/${progress.totalModules || 0}`;
    document.getElementById('practicesCompleted').textContent = 
      `${progress.practicesCompleted || 0}/${progress.totalPractices || 0}`;
    document.getElementById('attendancePercent').textContent = 
      `${progress.attendancePercentage || 0}%`;
    document.getElementById('averageScore').textContent = 
      (progress.averageScore || 0).toFixed(1);
    document.getElementById('totalTimeSpent').textContent = 
      `${Math.round((progress.totalTimeSpent || 0) / 60)}h`;
  } catch (error) {
    console.error('Failed to load overall progress:', error);
  }
}

// Load modules
async function loadModules() {
  try {
    const modules = await CourseProgressAPI.getCourseModules(currentCourseId);
    const moduleProgress = await CourseProgressAPI.getModuleProgress(currentStudentId, currentCourseId);

    currentModules = modules;

    // Create a map of module progress
    const progressMap = {};
    moduleProgress.forEach(p => {
      progressMap[p.moduleId] = p;
    });

    const container = document.getElementById('modulesList');

    if (modules.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📚</div>
          <h3>No modules available</h3>
          <p>Modules will appear here once added by instructor</p>
        </div>
      `;
      return;
    }

    container.innerHTML = modules.map(module => {
      const progress = progressMap[module.id] || {};
      const progressPercent = progress.progressPercentage || 0;
      const status = progress.status || 'not_started';
      
      let statusClass = 'not-started';
      let statusText = 'Not Started';
      if (status === 'completed') {
        statusClass = 'completed';
        statusText = 'Completed';
      } else if (status === 'in_progress') {
        statusClass = 'in-progress';
        statusText = 'In Progress';
      }

      return `
        <div class="module-card ${statusClass}">
          <div class="module-header">
            <div>
              <h4>${module.title}</h4>
              <p class="text-muted">${module.description || 'No description'}</p>
            </div>
            <span class="badge badge-${statusClass === 'completed' ? 'success' : statusClass === 'in-progress' ? 'warning' : 'info'}">
              ${statusText}
            </span>
          </div>
          <div class="module-progress-bar">
            <div class="module-progress-fill" style="width: ${progressPercent}%"></div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
            <span class="text-muted">${progressPercent}% Complete</span>
            <div class="btn-group">
              ${module.contentUrl ? `<a href="${module.contentUrl}" target="_blank" class="btn btn-outline btn-sm">📖 View Content</a>` : ''}
              ${status !== 'completed' ? 
                `<button class="btn btn-success btn-sm" onclick="markModuleComplete(${module.id})">✓ Mark Complete</button>` :
                `<button class="btn btn-outline btn-sm" disabled>✓ Completed</button>`
              }
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Failed to load modules:', error);
  }
}

// Mark module as complete
async function markModuleComplete(moduleId) {
  try {
    Loading.show();

    await CourseProgressAPI.updateModuleProgress({
      studentId: currentStudentId,
      courseId: currentCourseId,
      moduleId: moduleId,
      status: 'completed',
      progressPercentage: 100
    });

    Toast.success('Module marked as complete!');

    // Reload data
    await loadOverallProgress();
    await loadModules();

    Loading.hide();
  } catch (error) {
    Loading.hide();
    console.error('Failed to mark module complete:', error);
    Toast.error('Failed to update module progress');
  }
}

// Load practices
async function loadPractices() {
  try {
    const practices = await CourseProgressAPI.getCoursePractices(currentCourseId);
    const submissions = await CourseProgressAPI.getStudentPractices(currentStudentId, currentCourseId);

    currentPractices = practices;

    // Create a map of submissions
    const submissionMap = {};
    submissions.submissions.forEach(s => {
      submissionMap[s.practiceId] = s;
    });

    const container = document.getElementById('practicesList');

    if (practices.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <h3>No practices available</h3>
          <p>Assignments will appear here once added by instructor</p>
        </div>
      `;
      return;
    }

    container.innerHTML = practices.map(practice => {
      const submission = submissionMap[practice.id];
      const isSubmitted = !!submission;
      const isGraded = submission && submission.status === 'graded';
      const isPastDue = practice.dueDate && new Date(practice.dueDate) < new Date();

      return `
        <div class="practice-card">
          <div class="practice-header">
            <div>
              <h4>${practice.title}</h4>
              <p class="text-muted">${practice.description || 'No description'}</p>
              ${practice.moduleName ? `<p><strong>Module:</strong> ${practice.moduleName}</p>` : ''}
            </div>
            <div style="text-align: right;">
              <span class="badge badge-${practice.difficulty === 'easy' ? 'success' : practice.difficulty === 'hard' ? 'danger' : 'warning'}">
                ${practice.difficulty || 'medium'}
              </span>
              <br>
              <span class="badge badge-info">${practice.practiceType || 'exercise'}</span>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin: 1rem 0;">
            <div>
              <strong>Max Score:</strong> ${practice.maxScore || 100}
            </div>
            ${practice.timeLimit ? `<div><strong>Time Limit:</strong> ${practice.timeLimit} min</div>` : ''}
            ${practice.dueDate ? `
              <div>
                <strong>Due Date:</strong> 
                <span class="${isPastDue ? 'text-danger' : ''}">${formatDate(practice.dueDate)}</span>
              </div>
            ` : ''}
          </div>

          ${isSubmitted ? `
            <div class="submission-info" style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-top: 1rem;">
              <h5>Your Submission</h5>
              <p><strong>Status:</strong> 
                <span class="badge badge-${isGraded ? 'success' : 'warning'}">
                  ${isGraded ? 'Graded' : 'Submitted'}
                </span>
              </p>
              ${isGraded ? `
                <p><strong>Score:</strong> ${submission.score}/${practice.maxScore}</p>
                ${submission.feedback ? `<p><strong>Feedback:</strong> ${submission.feedback}</p>` : ''}
              ` : '<p class="text-muted">Waiting for instructor to grade...</p>'}
              <p><strong>Submitted:</strong> ${formatDate(submission.submittedAt)}</p>
              <button class="btn btn-outline btn-sm" onclick="showPracticeModal(${practice.id}, true)">
                View/Resubmit
              </button>
            </div>
          ` : `
            <button class="btn btn-primary" onclick="showPracticeModal(${practice.id}, false)">
              Submit Practice
            </button>
          `}
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Failed to load practices:', error);
  }
}

// Show practice submission modal
function showPracticeModal(practiceId, isResubmit) {
  const practice = currentPractices.find(p => p.id === practiceId);
  if (!practice) return;

  const modal = document.getElementById('practiceModal');
  const title = document.getElementById('practiceModalTitle');
  
  title.textContent = isResubmit ? `Resubmit: ${practice.title}` : `Submit: ${practice.title}`;
  document.getElementById('practiceId').value = practiceId;

  // Clear form
  document.getElementById('submissionText').value = '';
  document.getElementById('submissionUrl').value = '';
  document.getElementById('timeSpent').value = '';

  modal.style.display = 'flex';
}

// Close practice modal
function closePracticeModal() {
  document.getElementById('practiceModal').style.display = 'none';
}

// Submit practice
async function submitPractice() {
  const practiceId = document.getElementById('practiceId').value;
  const submissionText = document.getElementById('submissionText').value.trim();
  const submissionUrl = document.getElementById('submissionUrl').value.trim();
  const timeSpent = document.getElementById('timeSpent').value;

  if (!submissionText && !submissionUrl) {
    Toast.warning('Please provide either submission text or URL');
    return;
  }

  try {
    Loading.show();

    await CourseProgressAPI.submitPractice({
      studentId: currentStudentId,
      practiceId: parseInt(practiceId),
      submissionText,
      submissionUrl,
      timeSpent: timeSpent ? parseInt(timeSpent) : 0
    });

    Toast.success('Practice submitted successfully!');
    closePracticeModal();

    // Reload data
    await loadOverallProgress();
    await loadPractices();

    Loading.hide();
  } catch (error) {
    Loading.hide();
    console.error('Failed to submit practice:', error);
    Toast.error('Failed to submit practice');
  }
}

// Load attendance
async function loadAttendance() {
  try {
    const data = await CourseProgressAPI.getAttendance(currentStudentId, currentCourseId);
    const { attendance, summary } = data;

    // Update summary
    const summaryContainer = document.getElementById('attendanceSummary');
    summaryContainer.innerHTML = `
      <div class="stat-mini">
        <div class="stat-mini-value">${summary.totalDays}</div>
        <div class="stat-mini-label">Total Days</div>
      </div>
      <div class="stat-mini">
        <div class="stat-mini-value" style="color: var(--success);">${summary.presentDays}</div>
        <div class="stat-mini-label">Present</div>
      </div>
      <div class="stat-mini">
        <div class="stat-mini-value" style="color: var(--danger);">${summary.absentDays}</div>
        <div class="stat-mini-label">Absent</div>
      </div>
      <div class="stat-mini">
        <div class="stat-mini-value" style="color: var(--warning);">${summary.lateDays}</div>
        <div class="stat-mini-label">Late</div>
      </div>
      <div class="stat-mini">
        <div class="stat-mini-value">${summary.attendancePercentage}%</div>
        <div class="stat-mini-label">Attendance Rate</div>
      </div>
    `;

    // Create calendar view
    const calendarContainer = document.getElementById('attendanceCalendar');
    
    if (attendance.length === 0) {
      calendarContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <h3>No attendance records</h3>
          <p>Attendance will be marked by your instructor</p>
        </div>
      `;
      return;
    }

    // Group by date
    const attendanceMap = {};
    attendance.forEach(a => {
      attendanceMap[a.attendanceDate] = a.status;
    });

    // Get last 30 days
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        day: date.getDate(),
        status: attendanceMap[dateStr] || 'empty'
      });
    }

    calendarContainer.innerHTML = days.map(d => `
      <div class="attendance-day ${d.status}" title="${d.date} - ${d.status}">
        ${d.day}
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load attendance:', error);
  }
}

// Load study sessions
async function loadStudySessions() {
  try {
    const data = await CourseProgressAPI.getStudySessions(currentStudentId, currentCourseId);
    const { sessions, summary } = data;

    // Update total time
    const hours = Math.floor(summary.totalMinutes / 60);
    const minutes = summary.totalMinutes % 60;
    document.getElementById('totalStudyTime').textContent = `${hours}h ${minutes}m`;

    // Display sessions
    const container = document.getElementById('sessionsList');

    if (sessions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⏱️</div>
          <h3>No study sessions logged</h3>
          <p>Start logging your study time to track your progress</p>
        </div>
      `;
      return;
    }

    container.innerHTML = sessions.map(session => `
      <div class="session-log">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>${formatDate(session.sessionDate)}</strong>
            <span class="text-muted"> • ${session.startTime} - ${session.endTime || 'Ongoing'}</span>
            ${session.moduleName ? `<br><small>Module: ${session.moduleName}</small>` : ''}
          </div>
          <div style="text-align: right;">
            <span class="badge badge-info">${session.activityType || 'study'}</span>
            <br>
            <strong>${session.duration} min</strong>
          </div>
        </div>
        ${session.notes ? `<p class="text-muted" style="margin-top: 0.5rem;">${session.notes}</p>` : ''}
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load study sessions:', error);
  }
}

// Show session modal
function showSessionModal() {
  const modal = document.getElementById('sessionModal');
  
  // Set default date to today
  document.getElementById('sessionDate').value = new Date().toISOString().split('T')[0];
  
  // Clear form
  document.getElementById('startTime').value = '';
  document.getElementById('endTime').value = '';
  document.getElementById('activityType').value = 'video-watching';
  document.getElementById('sessionNotes').value = '';

  modal.style.display = 'flex';
}

// Close session modal
function closeSessionModal() {
  document.getElementById('sessionModal').style.display = 'none';
}

// Log study session
async function logSession() {
  const sessionDate = document.getElementById('sessionDate').value;
  const startTime = document.getElementById('startTime').value;
  const endTime = document.getElementById('endTime').value;
  const activityType = document.getElementById('activityType').value;
  const notes = document.getElementById('sessionNotes').value.trim();

  if (!sessionDate || !startTime || !endTime) {
    Toast.warning('Please fill in all required fields');
    return;
  }

  // Calculate duration
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  const duration = Math.round((end - start) / 60000); // minutes

  if (duration <= 0) {
    Toast.warning('End time must be after start time');
    return;
  }

  try {
    Loading.show();

    await CourseProgressAPI.logStudySession({
      studentId: currentStudentId,
      courseId: currentCourseId,
      sessionDate,
      startTime,
      endTime,
      duration,
      activityType,
      notes
    });

    Toast.success('Study session logged successfully!');
    closeSessionModal();

    // Reload data
    await loadOverallProgress();
    await loadStudySessions();

    Loading.hide();
  } catch (error) {
    Loading.hide();
    console.error('Failed to log session:', error);
    Toast.error('Failed to log study session');
  }
}

// Switch tabs
function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`${tabName}Tab`).classList.add('active');
}

// Format date helper
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// Logout function
function logout() {
  localStorage.removeItem('token');
  window.location.href = '/login.html';
}
