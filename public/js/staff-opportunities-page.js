(async function staffOpportunitiesPage() {
  if (typeof window === "undefined") return;

  let searchTimeout = null;

  function renderOpportunitiesTable(container, items, emptyTitle, emptySubtitle) {
    if (!container) return;

    if (!items || items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💼</div>
          <h3>${StaffPortal.helpers.escapeHtml(emptyTitle)}</h3>
          <p>${StaffPortal.helpers.escapeHtml(emptySubtitle)}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Title</th>
              <th>Company</th>
              <th>Department</th>
              <th>Skills</th>
              <th>Posted</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (op) => `
              <tr>
                <td><span class="status-badge">${op.type === "job" ? "Job" : op.type === "course" ? "Course" : "Internship"}</span></td>
                <td>${StaffPortal.helpers.escapeHtml(op.title)}</td>
                <td>${StaffPortal.helpers.escapeHtml(op.companyName || "-")}</td>
                <td>${StaffPortal.helpers.escapeHtml(op.department || "-")}</td>
                <td>${StaffPortal.helpers.escapeHtml(op.requiredSkills || "-")}</td>
                <td>${StaffPortal.helpers.formatDate(op.createdAt)}</td>
                <td>
                  <button class="btn btn-secondary btn-sm" onclick="promptAssign(${op.id}, '${op.type}')">Assign</button>
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

  async function loadOpportunities() {
    try {
      Loading.show();
      const search = document.getElementById("opportunitySearch").value.trim();
      const status = document.getElementById("opportunityStatus").value || "all";
      const sort = document.getElementById("opportunitySort").value || "latest";
      const params = { search, status, sort, withMeta: "1", page: "1", limit: "25" };

      const [opportunitiesRes, coursesRes] = await Promise.all([
        StaffPortal.api.opportunities.get(params),
        StaffPortal.api.courses.get(params),
      ]);

      const opportunities = StaffPortal.normalizeItems(opportunitiesRes);
      const courses = StaffPortal.normalizeItems(coursesRes);

      const jobs = opportunities.filter((op) => op.type === "job");
      const internships = opportunities.filter((op) => op.type === "internship");

      renderOpportunitiesTable(
        document.getElementById("opportunitiesJobsContainer"),
        jobs,
        "No jobs found",
        search ? "Try a different search" : "Click refresh to load jobs"
      );
      renderOpportunitiesTable(
        document.getElementById("opportunitiesInternshipsContainer"),
        internships,
        "No internships found",
        search ? "Try a different search" : "Click refresh to load internships"
      );
      renderOpportunitiesTable(
        document.getElementById("opportunitiesCoursesContainer"),
        courses,
        "No courses found",
        search ? "Try a different search" : "Click refresh to load courses"
      );
    } catch (error) {
      Toast.error(error.message || "Failed to load opportunities");
    } finally {
      Loading.hide();
    }
  }

  function promptAssign(targetId, targetType) {
    const studentEmail = prompt("Enter student email to assign this opportunity to:");
    if (!studentEmail) return;
    assignStudentToOpportunity(studentEmail.trim(), targetType, targetId);
  }

  async function assignStudentToOpportunity(studentEmailOrId, targetType, targetId) {
    try {
      Loading.show();
      const payload = { targetType, targetId };
      if (typeof studentEmailOrId === "string" && studentEmailOrId.includes("@")) {
        payload.studentEmail = studentEmailOrId;
      } else {
        payload.studentId = Number(studentEmailOrId);
      }

      await StaffPortal.api.opportunities.assign(payload);
      Loading.hide();
      Toast.success("Student assigned successfully");
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to assign student");
    }
  }

  window.promptAssign = promptAssign;

  document.addEventListener("DOMContentLoaded", async () => {
    if (!checkAuth()) {
      window.location.href = "/";
      return;
    }

    await StaffPortal.initShell();
    await loadOpportunities();

    document.getElementById("refreshOpportunities").addEventListener("click", loadOpportunities);
    document.getElementById("opportunityStatus").addEventListener("change", loadOpportunities);
    document.getElementById("opportunitySort").addEventListener("change", loadOpportunities);

    const searchInput = document.getElementById("opportunitySearch");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        if (searchTimeout) clearTimeout(searchTimeout);
        searchTimeout = setTimeout(loadOpportunities, 250);
      });
    }
  });
})();
