/* ============================================
   COMPANY INTERNSHIP ATTENDANCE MANAGEMENT
   ============================================ */

// Debug page state immediately
console.log('=== company-attendance.js loaded ===');
console.log('Document ready state:', document.readyState);
console.log('Body element:', document.body ? 'EXISTS' : 'NOT FOUND');
console.log('Scripts loaded:', document.scripts.length);

const CompanyAttendanceAPI = {
  async getInternships() {
    return API.get('/api/company/internships');
  },

  async getAttendanceRecords(internshipId) {
    return API.get(`/api/company/internships/${internshipId}/attendance`);
  },

  async markAttendance(data) {
    return API.post('/api/company/attendance', data);
  }
};

let currentInternshipId = null;
let currentInternshipStudents = [];
let allAttendanceRecords = [];
let currentFilter = 'all';

// Check authentication
function checkAuth() {
  const token = API.token();
  console.log('checkAuth - Token exists:', !!token);
  if (!token) {
    Toast.error('Please login first');
    setTimeout(() => { window.location.href = '/'; }, 1000);
    return false;
  }
  return true;
}

// Load user info
async function loadUserInfo() {
  try {
    const info = document.getElementById('userInfo');
    if (info) {
      info.textContent = '🏢 Company';
      console.log('User info updated');
    }
  } catch (error) {
    console.error('Failed to load user info:', error);
  }
}

// Load internships on page load
async function loadInternships() {
  try {
    console.log('=== Starting loadInternships ===');
    Loading.show();
    
    // Retry mechanism for finding element
    let select = document.getElementById('internshipSelect');
    let retries = 0;
    while (!select && retries < 5) {
      console.warn(`⚠ internshipSelect not found, retrying... (${retries + 1}/5)`);
      await new Promise(r => setTimeout(r, 100)); // Wait 100ms
      select = document.getElementById('internshipSelect');
      retries++;
    }
    
    if (!select) {
      console.error('❌ CRITICAL: internshipSelect element not found after 5 retries');
      console.error('Available select elements:', document.querySelectorAll('select'));
      Loading.hide();
      Toast.error('Page error: internship select not found. Please refresh the page.');
      return;
    }
    console.log('✓ Select element found');

    console.log('Calling API: /api/company/internships');
    const response = await CompanyAttendanceAPI.getInternships();
    console.log('✓ API Response received:', response);
    
    Loading.hide();

    // Handle API response format: { value: [...], Count: ... } or direct array
    const internships = response.value || response;
    console.log('✓ Parsed internships:', internships);

    if (!Array.isArray(internships)) {
      console.error('❌ ERROR: internships is not an array', typeof internships);
      Toast.error('Invalid response format from server');
      return;
    }

    console.log(`✓ Found ${internships.length} internships`);
    
    // Clear existing options
    select.innerHTML = '<option value="">-- Select an internship --</option>';
    
    if (internships.length === 0) {
      console.warn('⚠ No internships available for this company');
      Toast.info('No internships available');
      return;
    }

    // Add internship options
    internships.forEach((internship, index) => {
      console.log(`  Adding option ${index + 1}: "${internship.title}" (ID: ${internship.id})`);
      const option = document.createElement('option');
      option.value = internship.id;
      option.textContent = internship.title;
      select.appendChild(option);
    });

    select.addEventListener('change', selectInternship);
    console.log('✓ Internships loaded successfully, dropdown has', select.options.length, 'options');
  } catch (error) {
    Loading.hide();
    console.error('❌ Error loading internships:', error);
    console.error('   Error message:', error.message);
    console.error('   Stack:', error.stack);
    Toast.error('Failed to load internships: ' + error.message);
  }
}

// Select internship and load students
async function selectInternship(e) {
  const internshipId = parseInt(e.target.value, 10);
  if (!internshipId) {
    document.getElementById('attendanceFormCard').style.display = 'none';
    document.getElementById('attendanceTableCard').style.display = 'none';
    return;
  }

  currentInternshipId = internshipId;
  
  try {
    Loading.show();
    const response = await CompanyAttendanceAPI.getAttendanceRecords(internshipId);
    Loading.hide();

    // Handle API response format: { value: [...], Count: ... } or direct array
    const records = response.value || response;

    // Extract unique students from records for the dropdown
    const studentsMap = {};
    if (Array.isArray(records)) {
      records.forEach(rec => {
        if (!studentsMap[rec.studentId]) {
          studentsMap[rec.studentId] = {
            id: rec.studentId,
            name: rec.studentName,
            registerNumber: rec.registerNumber,
            email: rec.email
          };
        }
      });
    }
    currentInternshipStudents = Object.values(studentsMap);
    
    // Populate student select
    const studentSelect = document.getElementById('studentSelect');
    studentSelect.innerHTML = '<option value="">-- Select a student --</option>';
    currentInternshipStudents.forEach(student => {
      const option = document.createElement('option');
      option.value = student.id;
      option.textContent = `${student.name} (${student.registerNumber})`;
      studentSelect.appendChild(option);
    });

    // Show forms and load records
    document.getElementById('attendanceFormCard').style.display = 'block';
    document.getElementById('attendanceTableCard').style.display = 'block';
    
    allAttendanceRecords = Array.isArray(records) ? records : [];
    displayAttendanceTable();
  } catch (error) {
    Loading.hide();
    Toast.error('Failed to load attendance records');
    console.error(error);
  }
}

// Display attendance table with filters
function displayAttendanceTable(records = null) {
  const toDisplay = records || allAttendanceRecords;
  const filtered = currentFilter === 'all' ? toDisplay : toDisplay.filter(r => {
    if (currentFilter === 'present') return r.present;
    if (currentFilter === 'absent') return !r.present;
    return true;
  });

  const container = document.getElementById('attendanceTableContainer');

  if (!filtered || filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state company-light">
        <div class="empty-state-icon">📋</div>
        <h3>No attendance records</h3>
        <p>${currentFilter !== 'all' ? `No ${currentFilter} records found` : 'Mark attendance to see records'}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Student Name</th>
            <th>Register Number</th>
            <th>Status</th>
            <th>Presented By</th>
            <th>Notes</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(rec => `
            <tr>
              <td>${formatDate(rec.attendanceDate)}</td>
              <td>${rec.studentName}</td>
              <td>${rec.registerNumber}</td>
              <td>
                <span class="badge ${rec.present ? 'badge-success' : 'badge-danger'}">
                  ${rec.present ? '✅ Present' : '❌ Absent'}
                </span>
              </td>
              <td>${rec.presentedByCompany || '-'}</td>
              <td>${rec.notes || '-'}</td>
              <td>
                <button class="btn btn-info btn-sm" onclick="showAttendanceDetails(${JSON.stringify(rec).replace(/"/g, '&quot;')})">
                  View
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Filter attendance records
function filterAttendance(filter) {
  currentFilter = filter;
  displayAttendanceTable();
}

// Show attendance details in modal
function showAttendanceDetails(record) {
  const modal = document.getElementById('attendanceDetailsModal');
  const body = document.getElementById('attendanceDetailsBody');

  body.innerHTML = `
    <div class="attendance-details">
      <div class="detail-row">
        <strong>Student Name:</strong>
        <span>${record.studentName}</span>
      </div>
      <div class="detail-row">
        <strong>Register Number:</strong>
        <span>${record.registerNumber}</span>
      </div>
      <div class="detail-row">
        <strong>Email:</strong>
        <span>${record.email || '-'}</span>
      </div>
      <div class="detail-row">
        <strong>Date:</strong>
        <span>${formatDate(record.attendanceDate)}</span>
      </div>
      <div class="detail-row">
        <strong>Attendance Status:</strong>
        <span>
          <span class="badge ${record.present ? 'badge-success' : 'badge-danger'}">
            ${record.present ? '✅ Present' : '❌ Absent'}
          </span>
        </span>
      </div>
      <div class="detail-row">
        <strong>Presented By:</strong>
        <span>${record.presentedByCompany || '-'}</span>
      </div>
      <div class="detail-row">
        <strong>Notes:</strong>
        <span>${record.notes || '-'}</span>
      </div>
      <div class="detail-row">
        <strong>Marked At:</strong>
        <span>${formatDate(record.markedAt)}</span>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
}

// Close attendance details modal
function closeAttendanceDetails() {
  document.getElementById('attendanceDetailsModal').style.display = 'none';
}

// Initialize page on load
document.addEventListener('DOMContentLoaded', async () => {
  console.log('=== Page DOMContentLoaded started ===');
  
  if (!checkAuth()) {
    console.error('Auth check failed');
    return;
  }

  console.log('✓ Auth check passed');
  await loadUserInfo();
  console.log('✓ User info loaded');
  await loadInternships();
  console.log('✓ Internships loaded');

  // Attach form submit listener
  const form = document.getElementById('attendanceForm');
  if (form) {
    console.log('✓ Attendance form found');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const studentId = parseInt(document.getElementById('studentSelect').value, 10);
      const attendanceDate = document.getElementById('attendanceDate').value;
      const present = document.getElementById('presentToggle').checked ? 1 : 0;
      const presentedByCompany = document.getElementById('presentedByCompany').value;
      const notes = document.getElementById('attendanceNotes').value;

      if (!studentId || !attendanceDate) {
        Toast.error('Student and date are required');
        return;
      }

      try {
        Loading.show();
        const result = await CompanyAttendanceAPI.markAttendance({
          studentId,
          internshipId: currentInternshipId,
          attendanceDate,
          present,
          presentedByCompany,
          notes
        });
        Loading.hide();
        Toast.success(result.message || 'Attendance marked');
        form.reset();
        
        // Reload records
        try {
          const response = await CompanyAttendanceAPI.getAttendanceRecords(currentInternshipId);
          allAttendanceRecords = response.value || response;
          displayAttendanceTable();
        } catch (err) {
          console.error('Failed to reload records:', err);
        }
      } catch (error) {
        Loading.hide();
        Toast.error(error.message || 'Failed to mark attendance');
      }
    });
  } else {
    console.warn('⚠ Attendance form not found');
  }
  
  console.log('=== Page initialization complete ===');
});

// Logout function
function logout() {
  API.setToken(null);
  Toast.info('Logged out successfully');
  setTimeout(() => window.location.href = '/', 1000);
}

// Date formatter helper
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
