(async function companyOpportunitiesPage() {
  if (typeof window === "undefined") return;

  let currentType = null;
  let allOpportunities = [];

  function displayOpportunities(opportunities, type) {
    const container = document.getElementById("opportunitiesContainer");
    const opportunitiesList = CompanyPortal.normalizeItems(opportunities);

    if (!opportunitiesList || opportunitiesList.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <h3>No ${type} found</h3>
          <p>You haven't posted any ${type} yet</p>
        </div>
      `;
      return;
    }

    // Filter by search if provided
    const searchTerm = document.getElementById("opportunitySearch").value.toLowerCase().trim();
    const filtered = searchTerm
      ? opportunitiesList.filter(
          (opp) =>
            (opp.title || "").toLowerCase().includes(searchTerm) ||
            (opp.description || "").toLowerCase().includes(searchTerm) ||
            (opp.department || "").toLowerCase().includes(searchTerm)
        )
      : opportunitiesList;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <h3>No results found</h3>
          <p>Try a different search term</p>
        </div>
      `;
      return;
    }

    allOpportunities = filtered;

    // Determine columns based on type
    let columns = "";
    let rows = "";

    if (type === "jobs") {
      columns = `
        <th>ID</th>
        <th>Title</th>
        <th>Department</th>
        <th>Skills</th>
        <th>Posted</th>
        <th>Actions</th>
      `;
      rows = filtered
        .map(
          (job) => `
        <tr>
          <td><strong>J-${CompanyPortal.helpers.escapeHtml(job.id || "-")}</strong></td>
          <td><strong>${CompanyPortal.helpers.escapeHtml(job.title || "N/A")}</strong></td>
          <td>${CompanyPortal.helpers.escapeHtml(job.department || "-")}</td>
          <td>${CompanyPortal.helpers.escapeHtml(job.requiredSkills || "-")}</td>
          <td>${CompanyPortal.helpers.formatDate(job.createdAt)}</td>
          <td>
            <a href="/company/applicants.html?type=job&id=${job.id}" class="btn btn-info btn-sm">View Applicants</a>
          </td>
        </tr>
      `
        )
        .join("");
    } else if (type === "courses") {
      columns = `
        <th>ID</th>
        <th>Title</th>
        <th>Department</th>
        <th>Fees</th>
        <th>Duration</th>
        <th>Mode</th>
        <th>Posted</th>
        <th>Actions</th>
      `;
      rows = filtered
        .map(
          (course) => `
        <tr>
          <td><strong>C-${CompanyPortal.helpers.escapeHtml(course.id || "-")}</strong></td>
          <td><strong>${CompanyPortal.helpers.escapeHtml(course.title || "N/A")}</strong></td>
          <td>${CompanyPortal.helpers.escapeHtml(course.department || "-")}</td>
          <td>${course.fees ? "₹" + course.fees : "Free"}</td>
          <td>${CompanyPortal.helpers.escapeHtml(course.duration || "-")}</td>
          <td>${CompanyPortal.helpers.escapeHtml(course.mode || "-")}</td>
          <td>${CompanyPortal.helpers.formatDate(course.createdAt)}</td>
          <td>
            <a href="/company/applicants.html?type=course&id=${course.id}" class="btn btn-info btn-sm">View Applicants</a>
          </td>
        </tr>
      `
        )
        .join("");
    } else if (type === "internships") {
      columns = `
        <th>ID</th>
        <th>Title</th>
        <th>Department</th>
        <th>Duration</th>
        <th>Stipend</th>
        <th>Location</th>
        <th>Posted</th>
        <th>Actions</th>
      `;
      rows = filtered
        .map(
          (internship) => `
        <tr>
          <td><strong>I-${CompanyPortal.helpers.escapeHtml(internship.id || "-")}</strong></td>
          <td><strong>${CompanyPortal.helpers.escapeHtml(internship.title || "N/A")}</strong></td>
          <td>${CompanyPortal.helpers.escapeHtml(internship.department || "-")}</td>
          <td>${CompanyPortal.helpers.escapeHtml(internship.duration || "-")}</td>
          <td>${internship.stipend ? "₹" + internship.stipend : "Unpaid"}</td>
          <td>${CompanyPortal.helpers.escapeHtml(internship.location || "-")}</td>
          <td>${CompanyPortal.helpers.formatDate(internship.createdAt)}</td>
          <td>
            <a href="/company/applicants.html?type=internship&id=${internship.id}" class="btn btn-info btn-sm">View Applicants</a>
            <a href="/company/attendance.html" class="btn btn-secondary btn-sm">Mark Attendance</a>
          </td>
        </tr>
      `
        )
        .join("");
    }

    container.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              ${columns}
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  async function loadJobs() {
    try {
      Loading.show();
      const jobs = await CompanyPortal.api.jobs.list();
      Loading.hide();
      currentType = "jobs";
      displayOpportunities(jobs, "jobs");
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to load jobs");
    }
  }

  async function loadCourses() {
    try {
      Loading.show();
      const courses = await CompanyPortal.api.courses.list();
      Loading.hide();
      currentType = "courses";
      displayOpportunities(courses, "courses");
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to load courses");
    }
  }

  async function loadInternships() {
    try {
      Loading.show();
      const internships = await CompanyPortal.api.internships.list();
      Loading.hide();
      currentType = "internships";
      displayOpportunities(internships, "internships");
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to load internships");
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (!checkAuth()) {
      window.location.href = "/";
      return;
    }

    await CompanyPortal.initShell();

    document.getElementById("loadJobs").addEventListener("click", loadJobs);
    document.getElementById("loadCourses").addEventListener("click", loadCourses);
    document.getElementById("loadInternships").addEventListener("click", loadInternships);

    // Search functionality
    const searchInput = document.getElementById("opportunitySearch");
    let searchTimeout = null;
    searchInput.addEventListener("input", () => {
      if (searchTimeout) clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        if (currentType) {
          if (currentType === "jobs") loadJobs();
          else if (currentType === "courses") loadCourses();
          else if (currentType === "internships") loadInternships();
        }
      }, 300);
    });
  });
})();
