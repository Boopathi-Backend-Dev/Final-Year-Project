/* ============================================
   COMPANY ATTENDANCE DASHBOARD
   ============================================ */

const CompanyAttendanceDashboardAPI = {
  async getInternships() {
    return API.get('/api/company/internships');
  },

  async getInternshipApplicants(internshipId) {
    return API.get(`/api/company/applications?targetType=internship&targetId=${internshipId}`);
  },

  async getInternshipAttendance(internshipId) {
    return API.get(`/api/company/internships/${internshipId}/attendance`);
  },

  async markAttendance(data) {
    return API.post('/api/company/attendance', data);
  }
};

let dashboardCurrentInternshipId = null;
let dashboardStudents = [];
let dashboardAttendanceRecords = [];

function dashboardCheckAuth() {
  const token = API.token();
  if (!token) {
    Toast.error('Please login first');
    setTimeout(() => { window.location.href = '/'; }, 1000);
    return false;
  }
  return true;
}

async function dashboardLoadUserInfo() {
  try {
    const info = document.getElementById('userInfo');
    if (info) {
      info.textContent = '🏢 Company';
    }
  } catch (error) {
    console.error('Failed to load user info:', error);
  }
}

async function dashboardLoadInternships() {
  try {
    Loading.show();
    const select = document.getElementById('internshipSelect');
    const response = await CompanyAttendanceDashboardAPI.getInternships();
    const internships = response.value || response || [];

    select.innerHTML = '<option value="">-- Select an internship --</option>';

    if (!Array.isArray(internships) || internships.length === 0) {
      Toast.info('No internships available for this company');
      return;
    }

    internships.forEach(internship => {
      const option = document.createElement('option');
      option.value = internship.id;
      option.textContent = internship.title;
      select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
      const internshipId = parseInt(e.target.value, 10);
      if (!internshipId) {
        dashboardCurrentInternshipId = null;
        dashboardStudents = [];
        dashboardAttendanceRecords = [];
        document.getElementById('summaryCard').style.display = 'none';
        document.getElementById('tableCard').style.display = 'none';
        return;
      }
      dashboardCurrentInternshipId = internshipId;
      dashboardLoadAllData();
    });
  } catch (error) {
    console.error('Error loading internships for dashboard:', error);
    Toast.error('Failed to load internships');
  } finally {
    Loading.hide();
  }
}

function dashboardSetDefaultDateIfEmpty() {
  const dateEl = document.getElementById('dashboardDate');
  if (dateEl && !dateEl.value) {
    dateEl.value = new Date().toISOString().slice(0, 10);
  }
}

function dashboardSelectedDate() {
  const dateEl = document.getElementById('dashboardDate');
  return dateEl ? dateEl.value : '';
}

function dashboardRecordFor(studentId, date) {
  if (!date) return null;
  return dashboardAttendanceRecords.find(r =>
    r.studentId === studentId && r.attendanceDate === date
  ) || null;
}

function dashboardRender() {
  const date = dashboardSelectedDate();

  // Summary is based on accepted students list (even if no attendance exists yet)
  const total = dashboardStudents.length;
  const present = dashboardStudents.filter(s => {
    const rec = dashboardRecordFor(s.studentId, date);
    return rec ? !!rec.present : false;
  }).length;
  const absent = total - present;

  document.getElementById('totalRecords').textContent = total;
  document.getElementById('totalPresent').textContent = present;
  document.getElementById('totalAbsent').textContent = absent;
  document.getElementById('summaryCard').style.display = 'block';

  const container = document.getElementById('attendanceDashboardTable');

  if (!dashboardStudents.length) {
    container.innerHTML = `
      <div class="empty-state company-light">
        <div class="empty-state-icon">👥</div>
        <h3>No accepted students</h3>
        <p>Accept students for this internship to mark attendance.</p>
      </div>
    `;
    document.getElementById('tableCard').style.display = 'block';
    return;
  }

  container.innerHTML = `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Register No</th>
            <th>Department</th>
            <th>CGPA</th>
            <th>Application Status</th>
            <th>Present</th>
          </tr>
        </thead>
        <tbody>
          ${dashboardStudents.map(s => {
            const rec = dashboardRecordFor(s.studentId, date);
            const checked = rec && rec.present ? 'checked' : '';
            return `
              <tr>
                <td>${s.studentName}</td>
                <td>${s.registerNumber || '-'}</td>
                <td>${s.department || '-'}</td>
                <td>${typeof s.cgpa === 'number' ? s.cgpa : (s.cgpa || '-')}</td>
                <td><span class="badge badge-success">${s.status}</span></td>
                <td style="text-align:center;">
                  <input type="checkbox" id="dash-present-${s.studentId}" ${checked} />
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('tableCard').style.display = 'block';
}

async function dashboardLoadAllData() {
  if (!dashboardCurrentInternshipId) return;

  try {
    Loading.show();
    const [applicants, records] = await Promise.all([
      CompanyAttendanceDashboardAPI.getInternshipApplicants(dashboardCurrentInternshipId),
      CompanyAttendanceDashboardAPI.getInternshipAttendance(dashboardCurrentInternshipId)
    ]);

    dashboardStudents = (applicants || [])
      .filter(a => a.status === 'accepted' || a.status === 'selected')
      .map(a => ({
        studentId: a.studentId,
        studentName: a.studentName,
        registerNumber: a.registerNumber,
        department: a.department,
        cgpa: a.cgpa,
        status: a.status
      }));

    dashboardAttendanceRecords = Array.isArray(records) ? records : [];

    dashboardSetDefaultDateIfEmpty();
    dashboardRender();
  } catch (error) {
    console.error('Failed to load attendance dashboard:', error);
    Toast.error('Failed to load attendance dashboard');
  } finally {
    Loading.hide();
  }
}

async function dashboardRefreshAttendanceOnly() {
  if (!dashboardCurrentInternshipId) return;
  try {
    Loading.show();
    const records = await CompanyAttendanceDashboardAPI.getInternshipAttendance(dashboardCurrentInternshipId);
    dashboardAttendanceRecords = Array.isArray(records) ? records : [];
    dashboardRender();
  } catch (error) {
    console.error('Failed to refresh attendance:', error);
    Toast.error('Failed to refresh attendance');
  } finally {
    Loading.hide();
  }
}

async function dashboardSaveDailyAttendance() {
  if (!dashboardCurrentInternshipId) {
    Toast.warning('Please select an internship first');
    return;
  }

  const date = dashboardSelectedDate();
  if (!date) {
    Toast.error('Please select a date');
    return;
  }

  if (!dashboardStudents.length) {
    Toast.warning('No students to mark attendance');
    return;
  }

  try {
    Loading.show();
    await Promise.all(dashboardStudents.map(s => {
      const el = document.getElementById(`dash-present-${s.studentId}`);
      const present = el && el.checked ? 1 : 0;
      return CompanyAttendanceDashboardAPI.markAttendance({
        studentId: s.studentId,
        internshipId: dashboardCurrentInternshipId,
        attendanceDate: date,
        present,
        presentedByCompany: null,
        notes: null
      });
    }));

    Toast.success('Attendance saved');
    await dashboardRefreshAttendanceOnly();
  } catch (error) {
    console.error('Failed to save attendance:', error);
    Toast.error('Failed to save attendance');
  } finally {
    Loading.hide();
  }
}

function logout() {
  API.setToken(null);
  Toast.info('Logged out successfully');
  setTimeout(() => window.location.href = '/', 1000);
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!dashboardCheckAuth()) return;
  await dashboardLoadUserInfo();
  await dashboardLoadInternships();

  const dateEl = document.getElementById('dashboardDate');
  if (dateEl) {
    dashboardSetDefaultDateIfEmpty();
    dateEl.addEventListener('change', () => dashboardRender());
  }

  const refreshBtn = document.getElementById('refreshDashboardBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => dashboardLoadAllData());
  }

  const saveBtn = document.getElementById('saveDashboardBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => dashboardSaveDailyAttendance());
  }
});

