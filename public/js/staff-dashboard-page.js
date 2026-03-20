(async function staffDashboardPage() {
  if (typeof window === "undefined") return;

  async function loadStats() {
    try {
      const stats = await StaffPortal.api.stats.get();
      const totalStudents = stats.totalStudents || 0;
      const approvedStudents = stats.approvedStudents || 0;
      const totalApplications = stats.totalApplications || 0;
      const pendingApprovals = stats.pendingApprovals || 0;

      const totalEl = document.getElementById("totalStudents");
      const approvedEl = document.getElementById("approvedStudents");
      const applicationsEl = document.getElementById("totalApplications");
      const approvalsEl = document.getElementById("pendingApprovals");

      if (window.animateCounter) {
        window.animateCounter(totalEl, totalStudents);
        window.animateCounter(approvedEl, approvedStudents);
        window.animateCounter(applicationsEl, totalApplications);
        window.animateCounter(approvalsEl, pendingApprovals);
      } else {
        totalEl.textContent = totalStudents;
        approvedEl.textContent = approvedStudents;
        applicationsEl.textContent = totalApplications;
        approvalsEl.textContent = pendingApprovals;
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

    await StaffPortal.initShell();
    await loadStats();
  });
})();
