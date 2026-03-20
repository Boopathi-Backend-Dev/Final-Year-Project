(async function companyInternshipsPage() {
  if (typeof window === "undefined") return;

  function displayInternships(internships) {
    const container = document.getElementById("internshipsContainer");
    const internshipsList = CompanyPortal.normalizeItems(internships);

    if (!internshipsList || internshipsList.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🎓</div>
          <h3>No internships posted yet</h3>
          <p>Post an internship to get started</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Department</th>
              <th>Duration</th>
              <th>Stipend</th>
              <th>Location</th>
              <th>Posted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${internshipsList
              .map(
                (internship) => `
              <tr>
                <td><strong>${CompanyPortal.helpers.escapeHtml(internship.title || "N/A")}</strong></td>
                <td>${CompanyPortal.helpers.escapeHtml(internship.department || "-")}</td>
                <td>${CompanyPortal.helpers.escapeHtml(internship.duration || "-")}</td>
                <td>${internship.stipend ? "₹" + internship.stipend : "Unpaid"}</td>
                <td>${CompanyPortal.helpers.escapeHtml(internship.location || "-")}</td>
                <td>${CompanyPortal.helpers.formatDate(internship.createdAt)}</td>
                <td>
                  <a href="/company/applicants.html?type=internship&id=${internship.id}" class="btn btn-info btn-sm">View Applicants</a>
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

  async function loadInternships() {
    try {
      Loading.show();
      const internships = await CompanyPortal.api.internships.list();
      Loading.hide();
      displayInternships(internships);
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to load internships");
    }
  }

  async function createInternship(formData) {
    try {
      Loading.show();
      const payload = Object.fromEntries(formData);
      await CompanyPortal.api.internships.create(payload);
      Loading.hide();
      Toast.success("Internship posted successfully!");
      document.getElementById("internshipForm").reset();
      await loadInternships();
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to post internship");
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (!checkAuth()) {
      window.location.href = "/";
      return;
    }

    await CompanyPortal.initShell();
    await loadInternships();

    document.getElementById("refreshInternships").addEventListener("click", loadInternships);

    const internshipForm = document.getElementById("internshipForm");
    if (internshipForm) {
      internshipForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(internshipForm);
        await createInternship(formData);
      });
    }
  });
})();
