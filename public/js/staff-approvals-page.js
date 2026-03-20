(async function staffApprovalsPage() {
  if (typeof window === "undefined") return;

  function approvalActionButton(type, id, label, status, className) {
    return `<button class="btn ${className} btn-sm" onclick="updateApprovalWorkflow('${type}', ${id}, '${status}')">${label}</button>`;
  }

  async function loadApprovalQueue() {
    try {
      Loading.show();
      const status = document.getElementById("approvalStatusFilter").value || "review";
      const type = document.getElementById("approvalTypeFilter").value || "all";
      const container = document.getElementById("approvalQueueContainer");

      const rows = await StaffPortal.api.approvals.list({ status, type });

      if (!rows || rows.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <h3>No approvals in this view</h3>
            <p>No items match the current filters</p>
          </div>
        `;
        Loading.hide();
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
                <th>Status</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (row) => `
                <tr>
                  <td><span class="status-badge">${StaffPortal.helpers.escapeHtml(row.type)}</span></td>
                  <td>${StaffPortal.helpers.escapeHtml(row.title)}</td>
                  <td>${StaffPortal.helpers.escapeHtml(row.companyName || "-")}</td>
                  <td>${StaffPortal.helpers.escapeHtml(row.department || "-")}</td>
                  <td><span class="status-badge">${StaffPortal.helpers.escapeHtml(row.workflowStatus)}</span></td>
                  <td>${StaffPortal.helpers.escapeHtml(row.reviewNotes || "-")}</td>
                  <td>
                    <div style="display: flex; gap: 0.25rem; flex-wrap: wrap;">
                      ${approvalActionButton(row.type, row.id, "Review", "review", "btn-outline")}
                      ${approvalActionButton(row.type, row.id, "Publish", "published", "btn-success")}
                      ${approvalActionButton(row.type, row.id, "Reject", "rejected", "btn-danger")}
                      ${approvalActionButton(row.type, row.id, "Draft", "draft", "btn-outline")}
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
      Loading.hide();
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to load approval queue");
      document.getElementById("approvalQueueContainer").innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">❌</div>
          <h3>Failed to load approval queue</h3>
          <p>${StaffPortal.helpers.escapeHtml(error.message || "Unknown error")}</p>
        </div>
      `;
    }
  }

  async function updateApprovalWorkflow(type, id, status) {
    const reviewNotes = window.prompt(`Optional note for ${type} #${id}:`) || "";
    try {
      Loading.show();
      await StaffPortal.api.approvals.update(type, id, { status, reviewNotes });
      Loading.hide();
      Toast.success(`Updated to ${status}`);
      await loadApprovalQueue();
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to update workflow");
    }
  }

  window.updateApprovalWorkflow = updateApprovalWorkflow;

  document.addEventListener("DOMContentLoaded", async () => {
    if (!checkAuth()) {
      window.location.href = "/";
      return;
    }

    await StaffPortal.initShell();
    await loadApprovalQueue();

    document.getElementById("refreshApprovals").addEventListener("click", loadApprovalQueue);
    document.getElementById("approvalStatusFilter").addEventListener("change", loadApprovalQueue);
    document.getElementById("approvalTypeFilter").addEventListener("change", loadApprovalQueue);
  });
})();
