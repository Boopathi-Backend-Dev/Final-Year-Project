(async function companyJobsPage() {
  if (typeof window === "undefined") return;

  function displayJobs(jobs) {
    const container = document.getElementById("jobsContainer");
    const jobsList = CompanyPortal.normalizeItems(jobs);

    if (!jobsList || jobsList.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💼</div>
          <h3>No jobs posted yet</h3>
          <p>Post a job to get started</p>
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
              <th>Skills</th>
              <th>Posted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${jobsList
              .map(
                (job) => `
              <tr>
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
              .join("")}
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
      displayJobs(jobs);
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to load jobs");
    }
  }

  async function createJob(formData) {
    try {
      Loading.show();
      const payload = Object.fromEntries(formData);
      await CompanyPortal.api.jobs.create(payload);
      Loading.hide();
      Toast.success("Job posted successfully!");
      document.getElementById("jobForm").reset();
      await loadJobs();
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to post job");
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (!checkAuth()) {
      window.location.href = "/";
      return;
    }

    await CompanyPortal.initShell();
    await loadJobs();

    document.getElementById("refreshJobs").addEventListener("click", loadJobs);

    const jobForm = document.getElementById("jobForm");
    if (jobForm) {
      jobForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(jobForm);
        await createJob(formData);
      });
    }
  });
})();
