(async function companyDashboardPage() {
  if (typeof window === "undefined") return;

  async function loadStats() {
    try {
      const [jobs, courses, internships] = await Promise.all([
        CompanyPortal.api.jobs.list().catch(() => []),
        CompanyPortal.api.courses.list().catch(() => []),
        CompanyPortal.api.internships.list().catch(() => []),
      ]);

      const jobsList = CompanyPortal.normalizeItems(jobs);
      const coursesList = CompanyPortal.normalizeItems(courses);
      const internshipsList = CompanyPortal.normalizeItems(internships);

      const totalJobs = jobsList.length || 0;
      const totalCourses = coursesList.length || 0;
      const totalInternships = internshipsList.length || 0;

      const jobsEl = document.getElementById("totalJobs");
      const coursesEl = document.getElementById("totalCourses");
      const internshipsEl = document.getElementById("totalInternships");

      if (window.animateCounter) {
        window.animateCounter(jobsEl, totalJobs);
        window.animateCounter(coursesEl, totalCourses);
        window.animateCounter(internshipsEl, totalInternships);
      } else {
        jobsEl.textContent = totalJobs;
        coursesEl.textContent = totalCourses;
        internshipsEl.textContent = totalInternships;
      }

      // Count total applicants
      let totalApplicants = 0;
      try {
        for (const job of jobsList) {
          const applicants = await CompanyPortal.api.applications.get("job", job.id).catch(() => []);
          totalApplicants += CompanyPortal.normalizeItems(applicants).length;
        }
        for (const course of coursesList) {
          const applicants = await CompanyPortal.api.applications.get("course", course.id).catch(() => []);
          totalApplicants += CompanyPortal.normalizeItems(applicants).length;
        }
        for (const internship of internshipsList) {
          const applicants = await CompanyPortal.api.applications.get("internship", internship.id).catch(() => []);
          totalApplicants += CompanyPortal.normalizeItems(applicants).length;
        }
      } catch (e) {
        // Ignore errors in counting
      }
      const applicantsEl = document.getElementById("totalApplicants");
      if (window.animateCounter) {
        window.animateCounter(applicantsEl, totalApplicants);
      } else {
        applicantsEl.textContent = totalApplicants;
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
      Toast.error(error.message || "Failed to load statistics");
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (!checkAuth()) {
      window.location.href = "/";
      return;
    }

    await CompanyPortal.initShell();
    await loadStats();
  });
})();
