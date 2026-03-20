/* ============================================
   STAFF STUDENT ATTENDANCE MANAGEMENT
   ============================================ */

const StaffAttendanceAPI = {
  async getStudents() {
    return API.get('/api/staff/students');
  },

  async getAttendance(studentId) {
    return API.get(`/api/staff/students/${studentId}/attendance`);
  }
};

let allAttendanceRecords = [];

// Load user info
async function loadUserInfo() {
  try {
    const info = document.getElementById('userInfo');
    if (info) info.textContent = 'ðŸ‘¨â€ðŸ’¼ Staff Admin';
  } catch (error) {
    console.error('Failed to load user info:', error);
  }
}

// Load students
async function loadStudents() {
  try {
    Loading.show();
    const response = await StaffAttendanceAPI.getStudents();
    Loading.hide();

    const students = response.value || response;

    const select = document.getElementById('studentSelect');
    select.innerHTML = '<option value="">-- Select a student --</option>';
    
    if (Array.isArray(students) && students.length > 0) {
      students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.name || 'Student'} (${student.registerNumber || 'ID: ' + student.id})`;
        select.appendChild(option);
      });
      select.addEventListener('change', selectStudent);
    } else {
      console.warn('No students found');
      Toast.warning('No students available');
    }
  } catch (error) {
    Loading.hide();
    Toast.error('Failed to load students');
    console.error(error);
  }
}

// Select student and load attendance
async function selectStudent(e) {
  const studentId = parseInt(e.target.value, 10);
  if (!studentId) {
    document.getElementById('attendanceSummaryCard').style.display = 'none';
    document.getElementById('attendanceTableCard').style.display = 'none';
    return;
  }

  await loadStudentAttendance(studentId);
}

// Load student attendance
async function loadStudentAttendance(studentId = null) {
  if (!studentId) {
    studentId = parseInt(document.getElementById('studentSelect').value, 10);
  }

  if (!studentId) return;

  try {
    Loading.show();
    const data = await StaffAttendanceAPI.getAttendance(studentId);
    Loading.hide();

    const records = data.records || data.value || [];
    allAttendanceRecords = Array.isArray(records) ? records : [];

    document.getElementById('attendanceSummaryCard').style.display = 'block';
    document.getElementById('attendanceTableCard').style.display = 'block';

    renderAttendanceTable();
  } catch (error) {
    Loading.hide();
    Toast.error('Failed to load attendance records');
    console.error(error);
  }
}

function dateOnly(value) {
  if (!value) return '';
  return value.split('T')[0];
}

function statusBadge(status) {
  const normalized = (status || '').toLowerCase();
  if (['accepted', 'selected', 'approved'].includes(normalized)) return 'badge-success';
  if (normalized === 'rejected') return 'badge-danger';
  if (!normalized) return 'badge-warning';
  return 'badge-warning';
}

function renderAttendanceTable() {
  const dateFilter = document.getElementById('attendanceDateFilter');
  const selectedDate = dateFilter ? dateFilter.value : '';
  const filtered = selectedDate
    ? allAttendanceRecords.filter(r => dateOnly(r.attendanceDate) === selectedDate)
    : allAttendanceRecords.slice();

  const totalDays = filtered.length;
  const presentDays = filtered.filter(r => r.present).length;
  const absentDays = totalDays - presentDays;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  document.getElementById('totalDays').textContent = totalDays;
  document.getElementById('presentDays').textContent = presentDays;
  document.getElementById('absentDays').textContent = absentDays;
  document.getElementById('attendancePercentage').textContent = `${attendancePercentage}%`;

  const container = document.getElementById('attendanceTableContainer');
  if (!filtered || filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state staff-light">
        <div class="empty-state-icon">ðŸ“‹</div>
        <h3>No attendance records</h3>
        <p>Student has no attendance records yet</p>
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
            <th>Internship</th>
            <th>Company</th>
            <th>Register No</th>
            <th>Department</th>
            <th>Area</th>
            <th>CGPA</th>
            <th>Application Status</th>
            <th>Present</th>
            <th>Presented By</th>
            <th>Staff Name</th>
            <th>Staff Area</th>
            <th>Monitor Staff</th>
            <th>Notes</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(rec => `
            <tr>
              <td>${formatDate(rec.attendanceDate)}</td>
              <td>${rec.internshipTitle || '-'}</td>
              <td>${rec.companyName || '-'}</td>
              <td>${rec.registerNumber || '-'}</td>
              <td>${rec.department || '-'}</td>
              <td>${rec.studentArea || '-'}</td>
              <td>${rec.cgpa || '-'}</td>
              <td>
                <span class="badge ${statusBadge(rec.applicationStatus)}">
                  ${rec.applicationStatus || '-'}
                </span>
              </td>
              <td style="text-align:center;">
                <input type="checkbox" ${rec.present ? 'checked' : ''} disabled />
              </td>
              <td>${rec.presentedByCompany || '-'}</td>
              <td>${rec.staffName || '-'}</td>
              <td>${rec.staffArea || '-'}</td>
              <td>${rec.monitorStaff || '-'}</td>
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

// Show attendance details in modal
function showAttendanceDetails(record) {
  const modal = document.getElementById('attendanceDetailsModal');
  const body = document.getElementById('attendanceDetailsBody');
  
  body.innerHTML = `
    <div class="attendance-details">
      <div class="detail-row">
        <strong>Register Number:</strong>
        <span>${record.registerNumber || '-'}</span>
      </div>
      <div class="detail-row">
        <strong>Department:</strong>
        <span>${record.department || '-'}</span>
      </div>
      <div class="detail-row">
        <strong>Area:</strong>
        <span>${record.studentArea || '-'}</span>
      </div>
      <div class="detail-row">
        <strong>CGPA:</strong>
        <span>${record.cgpa || '-'}</span>
      </div>
      <div class="detail-row">
        <strong>Internship:</strong>
        <span>${record.internshipTitle || '-'}</span>
      </div>
      <div class="detail-row">
        <strong>Company:</strong>
        <span>${record.companyName || '-'}</span>
      </div>
      <div class="detail-row">
        <strong>Application Status:</strong>
        <span>${record.applicationStatus || '-'}</span>
      </div>
      <div class="detail-row">
        <strong>Date:</strong>
        <span>${formatDate(record.attendanceDate)}</span>
      </div>
      <div class="detail-row">
        <strong>Attendance Status:</strong>
        <span>
          <span class="badge ${record.present ? 'badge-success' : 'badge-danger'}">
            ${record.present ? 'âœ… Present' : 'âŒ Absent'}
          </span>
        </span>
      </div>
      <div class="detail-row">
        <strong>Presented By:</strong>
        <span>${record.presentedByCompany || '-'}</span>
      </div>
      <div class="detail-row">
        <strong>Staff Name:</strong>
        <span>${record.staffName || '-'}</span>
      </div>
      <div class="detail-row">
        <strong>Staff Area:</strong>
        <span>${record.staffArea || '-'}</span>
      </div>
      <div class="detail-row">
        <strong>Monitor Staff:</strong>
        <span>${record.monitorStaff || '-'}</span>
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

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
  if (!checkAuth()) return;

  await loadUserInfo();
  await loadStudents();

  const refreshBtn = document.getElementById('loadStudents');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadStudents);
  }

  const dateFilter = document.getElementById('attendanceDateFilter');
  if (dateFilter) {
    dateFilter.addEventListener('change', renderAttendanceTable);
  }

  const clearDateFilter = document.getElementById('clearDateFilter');
  if (clearDateFilter) {
    clearDateFilter.addEventListener('click', () => {
      if (dateFilter) dateFilter.value = '';
      renderAttendanceTable();
    });
  }
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
