(async function companyApplicantsPage() {
  if (typeof window === "undefined") return;

  function displayApplicants(applicants) {
    const container = document.getElementById("applicantsContainer");
    const applicantsList = CompanyPortal.normalizeItems(applicants);

    if (!applicantsList || applicantsList.length === 0) {
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
      <div class="table-wrap">
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
            ${applicantsList
              .map(
                (app) => `
              <tr>
                <td><strong>${CompanyPortal.helpers.escapeHtml(app.studentName || "N/A")}</strong></td>
                <td>${CompanyPortal.helpers.escapeHtml(app.registerNumber || "N/A")}</td>
                <td>${CompanyPortal.helpers.escapeHtml(app.department || "N/A")}</td>
                <td>${CompanyPortal.helpers.escapeHtml(app.cgpa || "N/A")}</td>
                <td>${CompanyPortal.helpers.escapeHtml(app.skills || "N/A")}</td>
                <td>
                  <span class="status-badge ${CompanyPortal.helpers.statusClass(app.status)}">
                    ${CompanyPortal.helpers.statusLabel(app.status)}
                  </span>
                </td>
                <td>
                  <div style="display: flex; gap: 0.25rem; flex-wrap: wrap;">
                    ${app.status !== "selected" ? `<button class="btn btn-success btn-sm" onclick="updateApplicationStatus(${app.applicationId}, 'selected')">✓ Select</button>` : ""}
                    ${app.status !== "rejected" ? `<button class="btn btn-danger btn-sm" onclick="updateApplicationStatus(${app.applicationId}, 'rejected')">✕ Reject</button>` : ""}
                    <button class="btn btn-info btn-sm" onclick="viewStudentProfile(${app.studentId || "null"})" title="View Full Profile" ${!app.studentId ? "disabled" : ""}>👤 Profile</button>
                    ${app.resumePath ? `<a href="${app.resumePath.startsWith("/") ? app.resumePath : "/uploads/" + app.resumePath}" target="_blank" class="btn btn-outline btn-sm">📄 Resume</a>` : ""}
                  </div>
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

  async function loadApplicants(targetType, targetId) {
    try {
      Loading.show();
      const applicants = await CompanyPortal.api.applications.get(targetType, targetId);
      Loading.hide();
      displayApplicants(applicants);
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to load applicants");
    }
  }

  async function updateApplicationStatus(applicationId, status) {
    const action = status === "selected" ? "select" : "reject";
    if (!confirm(`Are you sure you want to ${action} this applicant?`)) return;

    try {
      Loading.show();
      await CompanyPortal.api.applications.updateStatus(applicationId, status);
      Loading.hide();
      Toast.success(`Application ${status}ed successfully!`);

      // Reload applicants
      const form = document.getElementById("applicantFilter");
      const targetType = form.targetType.value;
      const targetId = form.targetId.value;
      if (targetType && targetId) {
        await loadApplicants(targetType, targetId);
      }
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to update application status");
    }
  }

  async function viewStudentProfile(studentId) {
    if (!studentId) {
      Toast.error("Student ID is missing");
      return;
    }

    try {
      Loading.show();
      const profileData = await CompanyPortal.api.students.getProfile(studentId);
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

    title.textContent = `${student.name} - Profile`;

    content.innerHTML = `
      <div style="display: grid; gap: 1.5rem;">
        <div class="content-card">
          <h4>📋 Basic Information</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
            <div><strong>Full Name:</strong> ${CompanyPortal.helpers.escapeHtml(student.name || "N/A")}</div>
            <div><strong>Email:</strong> ${CompanyPortal.helpers.escapeHtml(student.email || "N/A")}</div>
            <div><strong>Register Number:</strong> ${CompanyPortal.helpers.escapeHtml(student.registerNumber || "N/A")}</div>
            <div><strong>Department:</strong> ${CompanyPortal.helpers.escapeHtml(student.department || "N/A")}</div>
            <div><strong>Year of Study:</strong> ${student.yearOfStudy ? student.yearOfStudy + " Year" : "N/A"}</div>
            <div><strong>CGPA:</strong> ${CompanyPortal.helpers.escapeHtml(student.cgpa || "N/A")}</div>
            <div><strong>Phone:</strong> ${CompanyPortal.helpers.escapeHtml(student.phone || "N/A")}</div>
            <div><strong>Gender:</strong> ${CompanyPortal.helpers.escapeHtml(student.gender || "N/A")}</div>
          </div>
          ${student.skills ? `<div style="margin-top: 1rem;"><strong>Skills:</strong> ${CompanyPortal.helpers.escapeHtml(student.skills)}</div>` : ""}
          ${student.resumePath ? `<div style="margin-top: 1rem;"><strong>Resume:</strong> <a href="${student.resumePath.startsWith("/") ? student.resumePath : "/uploads/" + student.resumePath}" target="_blank" class="btn btn-outline btn-sm">📄 View Resume</a></div>` : ""}
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
                  </tr>
                </thead>
                <tbody>
                  ${extraCourses
                    .map(
                      (course) => `
                    <tr>
                      <td>${CompanyPortal.helpers.escapeHtml(course.courseName)}</td>
                      <td>${CompanyPortal.helpers.escapeHtml(course.platform || "-")}</td>
                      <td><span class="status-badge">${CompanyPortal.helpers.escapeHtml(course.category || "-")}</span></td>
                      <td>${course.credits || 0}</td>
                      <td><span class="status-badge ${course.status === "completed" ? "status-approved" : "status-pending"}">${course.status === "in_progress" ? "In Progress" : course.status || "In Progress"}</span></td>
                      <td>${CompanyPortal.helpers.escapeHtml(course.grade || "-")}</td>
                      <td>${course.certificateUrl ? `<a href="${CompanyPortal.helpers.escapeHtml(course.certificateUrl)}" target="_blank" rel="noopener">View</a>` : "-"}</td>
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
            <h4>📋 Application History with Your Company</h4>
            <div class="table-wrap">
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
                  ${applications
                    .map(
                      (app) => `
                    <tr>
                      <td><span class="status-badge">${app.targetType === "job" ? "Job" : app.targetType === "course" ? "Course" : "Internship"}</span></td>
                      <td>${CompanyPortal.helpers.escapeHtml(app.opportunityTitle || "N/A")}</td>
                      <td>${CompanyPortal.helpers.escapeHtml(app.opportunityDepartment || "N/A")}</td>
                      <td><span class="status-badge ${CompanyPortal.helpers.statusClass(app.status)}">${CompanyPortal.helpers.statusLabel(app.status)}</span></td>
                      <td>${CompanyPortal.helpers.formatDate(app.createdAt)}</td>
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

  window.updateApplicationStatus = updateApplicationStatus;
  window.viewStudentProfile = viewStudentProfile;

  document.addEventListener("DOMContentLoaded", async () => {
    if (!checkAuth()) {
      window.location.href = "/";
      return;
    }

    await CompanyPortal.initShell();

    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get("type");
    const id = urlParams.get("id");
    if (type && id) {
      document.getElementById("targetType").value = type;
      document.getElementById("targetId").value = id;
      await loadApplicants(type, id);
    }

    document.getElementById("applicantFilter").addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const targetType = form.targetType.value;
      const targetId = form.targetId.value;

      if (!targetType || !targetId) {
        Toast.warning("Please select type and enter ID");
        return;
      }

      await loadApplicants(targetType, targetId);
    });

    document.getElementById("closeStudentProfileModal").addEventListener("click", hideStudentProfileModal);
  });
})();
