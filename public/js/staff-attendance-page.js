(async function staffAttendancePage() {
  if (typeof window === "undefined") return;

  let allAttendanceRecords = [];
  let allStudents = [];

  async function loadStudents() {
    try {
      Loading.show();
      const students = await StaffPortal.api.students.list();
      Loading.hide();

      allStudents = students;
      const select = document.getElementById("filterStudent");
      select.innerHTML = '<option value="">All Students</option>';

      if (Array.isArray(students) && students.length > 0) {
        students.forEach((student) => {
          const option = document.createElement("option");
          option.value = student.id;
          option.textContent = `${student.name || "Student"} (${student.registerNumber || "ID: " + student.id})`;
          select.appendChild(option);
        });
      }
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to load students");
    }
  }

  async function loadAttendance() {
    try {
      Loading.show();
      const studentId = document.getElementById("filterStudent").value;
      const dept = document.getElementById("filterDept").value;

      if (!studentId) {
        Loading.hide();
        displayAttendance([]);
        return;
      }

      const data = await StaffPortal.api.students.getAttendance(studentId);
      const records = data.records || data.value || [];
      allAttendanceRecords = Array.isArray(records) ? records : [];

      const filtered = dept ? allAttendanceRecords.filter((r) => r.department === dept) : allAttendanceRecords;
      Loading.hide();
      displayAttendance(filtered);
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to load attendance records");
    }
  }

  function displayAttendance(records) {
    const container = document.getElementById("attendanceContainer");

    if (!records || records.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <h3>No attendance records found</h3>
          <p>Select a student to view attendance records</p>
        </div>
      `;
      return;
    }

    const totalDays = records.length;
    const presentDays = records.filter((r) => r.present).length;
    const absentDays = totalDays - presentDays;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    container.innerHTML = `
      <div class="content-card" style="margin-bottom: 1rem;">
        <h4>Attendance Summary</h4>
        <div class="split-grid">
          <div class="kpi-card">
            <div class="kpi-label">Total Days</div>
            <div class="kpi-value">${totalDays}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Present Days</div>
            <div class="kpi-value" style="color: #065f46;">${presentDays}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Absent Days</div>
            <div class="kpi-value" style="color: #991b1b;">${absentDays}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Attendance %</div>
            <div class="kpi-value" style="color: #1e40af;">${attendancePercentage}%</div>
          </div>
        </div>
      </div>

      <div class="content-card">
        <h4>Attendance Records</h4>
        <div class="table-wrap">
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
              </tr>
            </thead>
            <tbody>
              ${records
                .map(
                  (rec) => `
                <tr>
                  <td>${StaffPortal.helpers.formatDate(rec.attendanceDate)}</td>
                  <td>${StaffPortal.helpers.escapeHtml(rec.internshipTitle || "-")}</td>
                  <td>${StaffPortal.helpers.escapeHtml(rec.companyName || "-")}</td>
                  <td>${StaffPortal.helpers.escapeHtml(rec.registerNumber || "-")}</td>
                  <td>${StaffPortal.helpers.escapeHtml(rec.department || "-")}</td>
                  <td>${StaffPortal.helpers.escapeHtml(rec.studentArea || "-")}</td>
                  <td>${StaffPortal.helpers.escapeHtml(rec.cgpa || "-")}</td>
                  <td><span class="status-badge ${StaffPortal.helpers.statusClass(rec.applicationStatus)}">${StaffPortal.helpers.escapeHtml(rec.applicationStatus || "-")}</span></td>
                  <td style="text-align:center;"><input type="checkbox" ${rec.present ? "checked" : ""} disabled /></td>
                  <td>${StaffPortal.helpers.escapeHtml(rec.presentedByCompany || "-")}</td>
                  <td>${StaffPortal.helpers.escapeHtml(rec.staffName || "-")}</td>
                  <td>${StaffPortal.helpers.escapeHtml(rec.staffArea || "-")}</td>
                  <td>${StaffPortal.helpers.escapeHtml(rec.monitorStaff || "-")}</td>
                  <td>${StaffPortal.helpers.escapeHtml(rec.notes || "-")}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (!checkAuth()) {
      window.location.href = "/";
      return;
    }

    await StaffPortal.initShell();
    await loadStudents();

    document.getElementById("refreshAttendance").addEventListener("click", loadAttendance);
    document.getElementById("filterStudent").addEventListener("change", loadAttendance);
    document.getElementById("filterDept").addEventListener("change", loadAttendance);
  });
})();
