/* ============================================
   STUDENT INTERNSHIP ATTENDANCE VIEW
   ============================================ */

const StudentAttendanceAPI = {
  async getAppliedInternships() {
    return API.get('/api/student/applied-internships');
  },

  async getAttendance() {
    return API.get('/api/student/attendance');
  }
};

let currentInternshipId = null;
let allAttendanceRecords = [];
let currentStudentInfo = {};

// Load user info
async function loadUserInfo() {
  try {
    const info = document.getElementById('userInfo');
    if (info) info.textContent = 'ðŸ‘¨â€ðŸŽ“ Student';
  } catch (error) {
    console.error('Failed to load user info:', error);
  }
}

// Load applied internships into dropdown
async function loadAppliedInternships() {
  try {
    Loading.show();
    const response = await StudentAttendanceAPI.getAppliedInternships();
    Loading.hide();

    const internships = response.value || response || [];
    const select = document.getElementById('internshipSelect');
    
    if (!select) return;

    select.innerHTML = '<option value="">-- Select an internship --</option>';

    if (Array.isArray(internships) && internships.length > 0) {
      internships.forEach(internship => {
        const option = document.createElement('option');
        option.value = internship.id;
        option.textContent = `${internship.title} @ ${internship.companyName}`;
        select.appendChild(option);
      });
      select.addEventListener('change', selectInternship);
      return;
    }

    // Fallback: if no applied internships, use attendance records to populate
    await loadAttendance(true);
    if (allAttendanceRecords.length > 0) {
      const seen = new Set();
      allAttendanceRecords.forEach(rec => {
        if (seen.has(rec.internshipId)) return;
        seen.add(rec.internshipId);
        const option = document.createElement('option');
        option.value = rec.internshipId;
        option.textContent = `${rec.internshipTitle || 'Internship'} @ ${rec.companyName || 'Company'}`;
        select.appendChild(option);
      });
      select.addEventListener('change', selectInternship);
    }
  } catch (error) {
    console.error('Error loading internships:', error);
  }
}

// Select internship and load attendance
async function selectInternship(e) {
  const internshipId = e ? parseInt(e.target.value, 10) : currentInternshipId;
  if (!internshipId) {
    document.getElementById('attendanceTableCard').style.display = 'none';
    return;
  }

  currentInternshipId = internshipId;
  await loadAttendance();
}

// Load attendance records
async function loadAttendance(skipRender = false) {
  try {
    Loading.show();
    const data = await StudentAttendanceAPI.getAttendance();
    Loading.hide();

    const allRecords = data.records || data.value || [];
    currentStudentInfo = data.studentInfo || {};
    allAttendanceRecords = Array.isArray(allRecords) ? allRecords : [];

    if (!skipRender) {
      renderAttendanceTable();
    }
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
  // Filter by selected internship
  let records = currentInternshipId
    ? allAttendanceRecords.filter(r => r.internshipId === currentInternshipId)
    : allAttendanceRecords.slice();

  // Filter by date
  const dateFilter = document.getElementById('attendanceDateFilter');
  const selectedDate = dateFilter ? dateFilter.value : '';
  if (selectedDate) {
    records = records.filter(r => dateOnly(r.attendanceDate) === selectedDate);
  }

  const totalDays = records.length;
  const presentDays = records.filter(r => r.present).length;
  const absentDays = totalDays - presentDays;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  document.getElementById('totalDays').textContent = totalDays;
  document.getElementById('presentDays').textContent = presentDays;
  document.getElementById('absentDays').textContent = absentDays;
  document.getElementById('attendancePercentage').textContent = `${attendancePercentage}%`;

  const container = document.getElementById('attendanceTableContainer');
  if (!records || records.length === 0) {
    container.innerHTML = `
      <div class="empty-state student-light">
        <div class="empty-state-icon">ðŸ“‹</div>
        <h3>No attendance records</h3>
        <p>You have not yet been marked for any internship attendance</p>
      </div>
    `;
    document.getElementById('attendanceTableCard').style.display = currentInternshipId ? 'block' : 'none';
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
            <th>Marked By</th>
            <th>Notes</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${records.map(rec => `
            <tr>
              <td>${formatDateLocal(rec.attendanceDate)}</td>
              <td>${rec.internshipTitle || '-'}</td>
              <td>${rec.companyName || '-'}</td>
              <td>${currentStudentInfo.registerNumber || rec.registerNumber || '-'}</td>
              <td>${currentStudentInfo.department || rec.department || '-'}</td>
              <td>${currentStudentInfo.address || rec.studentArea || '-'}</td>
              <td>${currentStudentInfo.cgpa || rec.cgpa || '-'}</td>
              <td>
                <span class="badge ${statusBadge(rec.applicationStatus)}">
                  ${rec.applicationStatus || '-'}
                </span>
              </td>
              <td style="text-align:center;">
                <input type="checkbox" ${rec.present ? 'checked' : ''} disabled />
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

  document.getElementById('attendanceTableCard').style.display = 'block';
}

// Show attendance details in modal
function showAttendanceDetails(record) {
  const modal = document.getElementById('attendanceDetailsModal');
  const body = document.getElementById('attendanceDetailsBody');
  
  body.innerHTML = `
    <div class="attendance-details">
      <div class="detail-row">
        <strong>Register Number:</strong>
        <span>${currentStudentInfo.registerNumber || record.registerNumber || '-'}</span>
      </div>
      <div class="detail-row">
        <strong>Department:</strong>
        <span>${currentStudentInfo.department || record.department || '-'}</span>
      </div>
      <div class="detail-row">
        <strong>Area:</strong>
        <span>${currentStudentInfo.address || record.studentArea || '-'}</span>
      </div>
      <div class="detail-row">
        <strong>CGPA:</strong>
        <span>${currentStudentInfo.cgpa || record.cgpa || '-'}</span>
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
        <span>${formatDateLocal(record.attendanceDate)}</span>
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
        <strong>Notes:</strong>
        <span>${record.notes || '-'}</span>
      </div>
      <div class="detail-row">
        <strong>Marked At:</strong>
        <span>${formatDateLocal(record.markedAt)}</span>
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
  await loadAppliedInternships();

  const dateFilter = document.getElementById('attendanceDateFilter');
  if (dateFilter) {
    dateFilter.value = '';
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
function formatDateLocal(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
