(async function staffApplicationsPage() {
  if (typeof window === "undefined") return;

  function displayApplications(applications) {
    const container = document.getElementById("applicationsContainer");

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
      <div class="table-wrap">
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
            ${applications
              .map(
                (app) => `
              <tr>
                <td><strong>${StaffPortal.helpers.escapeHtml(app.studentName || "N/A")}</strong></td>
                <td><span class="status-badge">${app.targetType === "job" ? "Job" : app.targetType === "course" ? "Course" : "Internship"}</span></td>
                <td>${StaffPortal.helpers.escapeHtml(app.title || "N/A")}</td>
                <td>${StaffPortal.helpers.escapeHtml(app.companyName || "N/A")}</td>
                <td><span class="status-badge ${StaffPortal.helpers.statusClass(app.status)}">${StaffPortal.helpers.statusLabel(app.status)}</span></td>
                <td>${StaffPortal.helpers.formatDate(app.createdAt)}</td>
                <td>
                  <button class="btn btn-info btn-sm" onclick="viewStudentProfileFromApp(${app.studentId || "null"})" title="View Student Profile" ${!app.studentId ? "disabled" : ""}>
                    👤 Profile
                  </button>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  async function loadApplications() {
    try {
      Loading.show();
      const applications = await StaffPortal.api.applications.list();
      Loading.hide();
      displayApplications(applications);
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to load applications");
    }
  }

  async function viewStudentProfileFromApp(studentId) {
    if (!studentId) {
      Toast.error("Student ID is missing");
      return;
    }

    try {
      Loading.show();
      const profileData = await StaffPortal.api.students.getProfile(studentId);
      Loading.hide();
      showStudentProfileModal(profileData);
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to load student profile");
    }
  }

  function showStudentProfileModal(data) {
    const { student, extraCourses, applications } = data;
    const modal = document.getElementById("studentProfileModal");
    const title = document.getElementById("studentProfileTitle");
    const content = document.getElementById("studentProfileContent");

    title.textContent = `${student.name} - Complete Profile`;

    content.innerHTML = `
      <div style="display: grid; gap: 1.5rem;">
        <div class="content-card">
          <h4>📋 Basic Information</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
            <div><strong>Full Name:</strong> ${StaffPortal.helpers.escapeHtml(student.name || "N/A")}</div>
            <div><strong>Email:</strong> ${StaffPortal.helpers.escapeHtml(student.email || "N/A")}</div>
            <div><strong>Register Number:</strong> ${StaffPortal.helpers.escapeHtml(student.registerNumber || "N/A")}</div>
            <div><strong>Department:</strong> ${StaffPortal.helpers.escapeHtml(student.department || "N/A")}</div>
            <div><strong>Year of Study:</strong> ${student.yearOfStudy ? student.yearOfStudy + " Year" : "N/A"}</div>
            <div><strong>CGPA:</strong> ${StaffPortal.helpers.escapeHtml(student.cgpa || "N/A")}</div>
            <div><strong>Phone:</strong> ${StaffPortal.helpers.escapeHtml(student.phone || "N/A")}</div>
            <div><strong>Gender:</strong> ${StaffPortal.helpers.escapeHtml(student.gender || "N/A")}</div>
            <div><strong>Date of Birth:</strong> ${student.dateOfBirth ? StaffPortal.helpers.formatDate(student.dateOfBirth) : "N/A"}</div>
            <div><strong>Joined:</strong> ${StaffPortal.helpers.formatDate(student.joinedDate)}</div>
            <div><strong>Approval Status:</strong> <span class="status-badge ${student.approved ? "status-approved" : "status-pending"}">${student.approved ? "Approved" : "Pending Approval"}</span></div>
            <div><strong>College Code:</strong> ${StaffPortal.helpers.escapeHtml(student.collegeCode || "N/A")}</div>
          </div>
          ${student.skills ? `<div style="margin-top: 1rem;"><strong>Skills:</strong> ${StaffPortal.helpers.escapeHtml(student.skills)}</div>` : ""}
          ${student.address ? `<div style="margin-top: 1rem;"><strong>Address:</strong> ${StaffPortal.helpers.escapeHtml(student.address)}</div>` : ""}
        </div>

        ${extraCourses && extraCourses.length > 0 ? `
          <div class="content-card">
            <h4>📚 Additional Courses & Certifications</h4>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Course Name</th>
                    <th>Platform</th>
                    <th>Category</th>
                    <th>Credits</th>
                    <th>Status</th>
                    <th>Grade</th>
                    <th>Certificate</th>
                    <th>Completion Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${extraCourses
                    .map(
                      (course) => `
                    <tr>
                      <td>${StaffPortal.helpers.escapeHtml(course.courseName)}</td>
                      <td>${StaffPortal.helpers.escapeHtml(course.platform || "-")}</td>
                      <td><span class="status-badge">${StaffPortal.helpers.escapeHtml(course.category || "-")}</span></td>
                      <td>${course.credits || 0}</td>
                      <td><span class="status-badge ${course.status === "completed" ? "status-approved" : "status-pending"}">${course.status === "in_progress" ? "In Progress" : course.status || "In Progress"}</span></td>
                      <td>${StaffPortal.helpers.escapeHtml(course.grade || "-")}</td>
                      <td>${course.certificateUrl ? `<a href="${StaffPortal.helpers.escapeHtml(course.certificateUrl)}" target="_blank" rel="noopener">View</a>` : "-"}</td>
                      <td>${course.completionDate ? StaffPortal.helpers.formatDate(course.completionDate) : "-"}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>
        ` : ""}

        ${applications && applications.length > 0 ? `
          <div class="content-card">
            <h4>📋 Complete Application History</h4>
            <div class="table-wrap">
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
                  ${applications
                    .map(
                      (app) => `
                    <tr>
                      <td><span class="status-badge">${app.targetType === "job" ? "Job" : app.targetType === "course" ? "Course" : "Internship"}</span></td>
                      <td>${StaffPortal.helpers.escapeHtml(app.opportunityTitle || "N/A")}</td>
                      <td>${StaffPortal.helpers.escapeHtml(app.companyName || "N/A")}</td>
                      <td>${StaffPortal.helpers.escapeHtml(app.companyIndustry || "N/A")}</td>
                      <td>${StaffPortal.helpers.escapeHtml(app.opportunityDepartment || "N/A")}</td>
                      <td><span class="status-badge ${StaffPortal.helpers.statusClass(app.status)}">${StaffPortal.helpers.statusLabel(app.status)}</span></td>
                      <td>${StaffPortal.helpers.formatDate(app.createdAt)}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>
        ` : ""}
      </div>
    `;

    modal.style.display = "flex";
  }

  function hideStudentProfileModal() {
    document.getElementById("studentProfileModal").style.display = "none";
  }

  window.viewStudentProfileFromApp = viewStudentProfileFromApp;

  document.addEventListener("DOMContentLoaded", async () => {
    if (!checkAuth()) {
      window.location.href = "/";
      return;
    }

    await StaffPortal.initShell();
    await loadApplications();

    document.getElementById("refreshApplications").addEventListener("click", loadApplications);
    document.getElementById("closeStudentProfileModal").addEventListener("click", hideStudentProfileModal);
  });
})();
