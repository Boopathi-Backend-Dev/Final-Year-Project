(async function companyAttendancePage() {
  if (typeof window === "undefined") return;

  async function loadInternships() {
    try {
      const internships = await CompanyPortal.api.internships.list();
      const internshipsList = CompanyPortal.normalizeItems(internships);

      const select1 = document.getElementById("internshipId");
      const select2 = document.getElementById("viewInternshipId");

      [select1, select2].forEach((select) => {
        if (select) {
          select.innerHTML = '<option value="">Select Internship</option>';
          internshipsList.forEach((internship) => {
            const option = document.createElement("option");
            option.value = internship.id;
            option.textContent = internship.title || `Internship #${internship.id}`;
            select.appendChild(option);
          });
        }
      });
    } catch (error) {
      console.error("Failed to load internships:", error);
    }
  }

  async function loadStudentsForInternship(internshipId) {
    const studentSelect = document.getElementById("studentId");
    if (!studentSelect) return;

    studentSelect.innerHTML = '<option value="">Select Student</option>';

    if (!internshipId) return;

    try {
      const applicants = await CompanyPortal.api.applications.get("internship", internshipId);
      const applicantsList = CompanyPortal.normalizeItems(applicants);
      const uniqueStudents = new Map();

      applicantsList.forEach((app) => {
        if (!app.studentId || uniqueStudents.has(app.studentId)) return;
        uniqueStudents.set(app.studentId, app);
      });

      uniqueStudents.forEach((app) => {
        const option = document.createElement("option");
        option.value = String(app.studentId);

        const name = app.studentName || "Student";
        const reg = app.registerNumber ? ` (${app.registerNumber})` : "";
        const email = app.studentEmail ? ` - ${app.studentEmail}` : "";
        option.textContent = `${name}${reg}${email}`;
        studentSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Failed to load internship students:", error);
      Toast.error("Failed to load students for selected internship");
    }
  }

  async function markAttendance(formData) {
    try {
      Loading.show();
      const payload = Object.fromEntries(formData);
      payload.attendanceDate = (payload.attendanceDate || "").trim();
      payload.internshipId = (payload.internshipId || "").trim();
      payload.studentId = Number.parseInt((payload.studentId || "").trim(), 10);
      payload.present = payload.present === "1";

      if (!payload.internshipId || !payload.attendanceDate || !Number.isInteger(payload.studentId) || payload.studentId <= 0) {
        Loading.hide();
        Toast.error("Internship, student, and date are required.");
        return;
      }

      await CompanyPortal.api.attendance.mark(payload);
      Loading.hide();
      Toast.success("Attendance marked successfully!");
      const internshipId = payload.internshipId;
      document.getElementById("attendanceForm").reset();
      document.getElementById("internshipId").value = internshipId;
      await loadStudentsForInternship(internshipId);
      document.getElementById("attendanceDate").value = new Date().toISOString().split("T")[0];
    } catch (error) {
      Loading.hide();
      const msg = String(error?.message || "");
      if (
        msg.includes("studentId, internshipId, and attendanceDate are required") ||
        msg.includes("internshipId, attendanceDate, and studentId or studentEmail are required")
      ) {
        Toast.error("Please select internship, student, and date.");
        return;
      }
      Toast.error(error.message || "Failed to mark attendance");
    }
  }

  async function viewAttendance(internshipId) {
    if (!internshipId) {
      Toast.warning("Please select an internship");
      return;
    }

    try {
      Loading.show();
      const data = await CompanyPortal.api.internships.getAttendance(internshipId);
      Loading.hide();
      displayAttendance(data);
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to load attendance");
    }
  }

  function displayAttendance(data) {
    const container = document.getElementById("attendanceContainer");
    const records = CompanyPortal.normalizeItems(data);

    if (!records || records.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <h3>No attendance records found</h3>
          <p>No attendance has been marked for this internship yet</p>
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
                <th>Student</th>
                <th>Register No</th>
                <th>Department</th>
                <th>Present</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${records
                .map(
                  (rec) => `
                <tr>
                  <td>${CompanyPortal.helpers.formatDate(rec.attendanceDate)}</td>
                  <td>${CompanyPortal.helpers.escapeHtml(rec.studentName || "-")}</td>
                  <td>${CompanyPortal.helpers.escapeHtml(rec.registerNumber || "-")}</td>
                  <td>${CompanyPortal.helpers.escapeHtml(rec.department || "-")}</td>
                  <td><span class="status-badge ${rec.present ? "status-approved" : "status-rejected"}">${rec.present ? "Present" : "Absent"}</span></td>
                  <td>${CompanyPortal.helpers.escapeHtml(rec.notes || "-")}</td>
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

    await CompanyPortal.initShell();
    await loadInternships();

    // Set today's date as default
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("attendanceDate").value = today;

    document.getElementById("internshipId").addEventListener("change", (e) => {
      loadStudentsForInternship(e.target.value);
    });

    document.getElementById("attendanceForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      await markAttendance(formData);
    });

    document.getElementById("viewAttendance").addEventListener("click", () => {
      const internshipId = document.getElementById("viewInternshipId").value;
      viewAttendance(internshipId);
    });
  });
})();
