let applicationRows = [];

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await StudentPortal.initShell();
    bindApplicationEvents();
    await loadApplications();
  } catch (error) {
    if (error.message !== "Unauthenticated") {
      Toast.error("Failed to load applications page");
    }
  }
});

function bindApplicationEvents() {
  document.getElementById("refreshApplicationsBtn").addEventListener("click", loadApplications);
  document.getElementById("selectAllApplications").addEventListener("change", toggleSelectAll);
  document.getElementById("deleteSelectedBtn").addEventListener("click", deleteSelectedApplications);
}

async function loadApplications() {
  try {
    const response = await StudentPortal.api.applications.list();
    applicationRows = StudentPortal.normalizeItems(response);
    renderApplications();
  } catch (error) {
    console.error(error);
    Toast.error(error.message || "Could not load applications");
  }
}

function renderApplications() {
  const body = document.getElementById("applicationsTableBody");
  const empty = document.getElementById("applicationsEmptyState");
  const tableWrap = document.getElementById("applicationsTableWrap");

  if (!applicationRows.length) {
    body.innerHTML = "";
    empty.classList.remove("hidden");
    tableWrap.classList.add("hidden");
    updateSelectionInfo();
    return;
  }

  empty.classList.add("hidden");
  tableWrap.classList.remove("hidden");

  body.innerHTML = applicationRows.map((app) => {
    const status = String(app.status || "pending").toLowerCase();
    const protectedState = status === "approved" || status === "selected";
    const safeType = StudentPortal.helpers.escapeHtml(String(app.targetType || "").toUpperCase());
    const safeTitle = StudentPortal.helpers.escapeHtml(app.title || "-");
    const safeCompany = StudentPortal.helpers.escapeHtml(app.companyName || "-");
    const dateText = StudentPortal.helpers.formatDate(app.createdAt);

    return `
      <tr data-app-id="${app.id}">
        <td>
          <input type="checkbox" class="application-checkbox" value="${app.id}" ${protectedState ? "disabled" : ""}>
        </td>
        <td>${safeType}</td>
        <td>${safeTitle}</td>
        <td>${safeCompany}</td>
        <td>
          <span class="status-badge ${StudentPortal.helpers.statusClass(status)}">
            ${StudentPortal.helpers.escapeHtml(StudentPortal.helpers.statusLabel(status))}
          </span>
        </td>
        <td>${dateText}</td>
        <td>
          <button class="btn btn-danger btn-sm" type="button" onclick="deleteApplication(${app.id})" ${protectedState ? "disabled" : ""}>
            ${protectedState ? "Protected" : "Delete"}
          </button>
        </td>
      </tr>
    `;
  }).join("");

  document.querySelectorAll(".application-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", updateSelectionInfo);
  });

  updateSelectionInfo();
}

function toggleSelectAll(event) {
  const isChecked = event.target.checked;
  document.querySelectorAll(".application-checkbox:not(:disabled)").forEach((checkbox) => {
    checkbox.checked = isChecked;
  });
  updateSelectionInfo();
}

function getSelectedApplicationIds() {
  return Array.from(document.querySelectorAll(".application-checkbox:checked")).map((checkbox) => Number(checkbox.value));
}

function updateSelectionInfo() {
  const selected = getSelectedApplicationIds().length;
  document.getElementById("selectionInfo").textContent = selected ? `${selected} selected` : "No selection";
  document.getElementById("deleteSelectedBtn").disabled = selected === 0;
}

async function deleteSelectedApplications() {
  const selectedIds = getSelectedApplicationIds();
  if (!selectedIds.length) {
    Toast.warning("Select at least one application");
    return;
  }

  if (!window.confirm(`Delete ${selectedIds.length} selected application(s)?`)) return;

  try {
    await Promise.all(selectedIds.map((id) => StudentPortal.api.applications.remove(id)));
    Toast.success("Selected applications deleted");
    document.getElementById("selectAllApplications").checked = false;
    await loadApplications();
  } catch (error) {
    console.error(error);
    Toast.error(error.message || "Failed to delete selected applications");
  }
}

async function deleteApplication(id) {
  if (!window.confirm("Delete this application?")) return;

  try {
    await StudentPortal.api.applications.remove(id);
    Toast.success("Application deleted");
    await loadApplications();
  } catch (error) {
    console.error(error);
    Toast.error(error.message || "Failed to delete application");
  }
}
