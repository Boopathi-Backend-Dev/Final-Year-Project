(async function staffProfilePage() {
  if (typeof window === "undefined") return;

  async function loadProfile() {
    try {
      Loading.show();
      const stats = await StaffPortal.api.stats.get();
      Loading.hide();

      const content = document.getElementById("profileContent");
      content.innerHTML = `
        <div style="display: grid; gap: 1.5rem;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
            <div class="profile-stat-card" style="background: linear-gradient(135deg, #f5f3ff 0%, #e0e7ff 100%); padding: 1.5rem; border-radius: 12px; color: #1f2937; border: 1px solid #e2e8f0; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);">
              <div style="font-size: 0.95rem; opacity: 0.9; margin-bottom: 0.5rem;">Role</div>
              <div style="font-size: 1.5rem; font-weight: 700;">Staff Admin</div>
            </div>
            <div class="profile-stat-card" style="background: linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%); padding: 1.5rem; border-radius: 12px; color: #7f1d1d; border: 1px solid #fecdd3; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);">
              <div style="font-size: 0.95rem; opacity: 0.9; margin-bottom: 0.5rem;">College Code</div>
              <div style="font-size: 1.5rem; font-weight: 700;">${StaffPortal.helpers.escapeHtml(stats.collegeCode || "N/A")}</div>
            </div>
            <div class="profile-stat-card" style="background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%); padding: 1.5rem; border-radius: 12px; color: #1f2937; border: 1px solid #bae6fd; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);">
              <div style="font-size: 0.95rem; opacity: 0.9; margin-bottom: 0.5rem;">Total Students</div>
              <div style="font-size: 1.5rem; font-weight: 700;">${stats.totalStudents || 0}</div>
            </div>
            <div class="profile-stat-card" style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 1.5rem; border-radius: 12px; color: #14532d; border: 1px solid #bbf7d0; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);">
              <div style="font-size: 0.95rem; opacity: 0.9; margin-bottom: 0.5rem;">Approved Profiles</div>
              <div style="font-size: 1.5rem; font-weight: 700;">${stats.approvedStudents || 0}</div>
            </div>
            <div class="profile-stat-card" style="background: linear-gradient(135deg, #fef9c3 0%, #fde68a 100%); padding: 1.5rem; border-radius: 12px; color: #713f12; border: 1px solid #fde68a; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);">
              <div style="font-size: 0.95rem; opacity: 0.9; margin-bottom: 0.5rem;">Total Applications</div>
              <div style="font-size: 1.5rem; font-weight: 700;">${stats.totalApplications || 0}</div>
            </div>
            <div class="profile-stat-card" style="background: linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%); padding: 1.5rem; border-radius: 12px; color: #7c2d12; border: 1px solid #fed7aa; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);">
              <div style="font-size: 0.95rem; opacity: 0.9; margin-bottom: 0.5rem;">Pending Approvals</div>
              <div style="font-size: 1.5rem; font-weight: 700;">${stats.pendingApprovals || 0}</div>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to load profile");
      document.getElementById("profileContent").innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">❌</div>
          <h3>Failed to load profile</h3>
          <p>${StaffPortal.helpers.escapeHtml(error.message || "Unknown error")}</p>
        </div>
      `;
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (!checkAuth()) {
      window.location.href = "/";
      return;
    }

    await StaffPortal.initShell();
    await loadProfile();
  });
})();
