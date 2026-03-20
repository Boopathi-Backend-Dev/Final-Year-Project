let staffQueryCompanies = [];
let staffQueryList = [];

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await StaffPortal.initShell();
    bindStaffQueryEvents();
    await Promise.all([loadStaffCompanies(), loadStaffQueries()]);
  } catch (error) {
    if (error.message !== "Unauthenticated") {
      Toast.error("Failed to load queries");
    }
  }
});

function bindStaffQueryEvents() {
  const form = document.getElementById("queryForm");
  const resetBtn = document.getElementById("resetQueryForm");
  const refreshBtn = document.getElementById("refreshQueriesBtn");

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await submitStaffQuery();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (form) form.reset();
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => loadStaffQueries(true));
  }
}

async function loadStaffCompanies() {
  try {
    const companies = await StaffPortal.api.companies.list();
    staffQueryCompanies = StaffPortal.normalizeItems(companies);
    renderStaffCompanyOptions();
  } catch (error) {
    console.error(error);
    Toast.error(error.message || "Failed to load companies");
  }
}

function renderStaffCompanyOptions() {
  const select = document.getElementById("companySelect");
  if (!select) return;

  if (!staffQueryCompanies.length) {
    select.innerHTML = `<option value="">No companies available</option>`;
    select.disabled = true;
    return;
  }

  select.disabled = false;
  select.innerHTML = [
    `<option value="">Select company</option>`,
    ...staffQueryCompanies.map((company) => {
      const label = StaffPortal.helpers.escapeHtml(company.name || "Company");
      return `<option value="${company.id}">${label}</option>`;
    })
  ].join("");
}

async function loadStaffQueries(showToast = false) {
  try {
    const queries = await StaffPortal.api.queries.list();
    staffQueryList = StaffPortal.normalizeItems(queries);
    renderStaffQueries();
    if (showToast) Toast.success("Queries refreshed");
  } catch (error) {
    console.error(error);
    if (showToast) Toast.error(error.message || "Failed to refresh queries");
  }
}

async function submitStaffQuery() {
  const companyId = document.getElementById("companySelect")?.value;
  const subject = document.getElementById("subjectInput")?.value || "";
  const message = document.getElementById("messageInput")?.value || "";

  if (!companyId) {
    Toast.warning("Select a company");
    return;
  }

  try {
    await StaffPortal.api.queries.create({
      companyId: Number(companyId),
      subject: subject.trim(),
      message: message.trim()
    });
    Toast.success("Query submitted");
    const form = document.getElementById("queryForm");
    if (form) form.reset();
    await loadStaffQueries();
  } catch (error) {
    console.error(error);
    Toast.error(error.message || "Failed to submit query");
  }
}

function renderStaffQueries() {
  const container = document.getElementById("queriesList");
  if (!container) return;

  if (!staffQueryList.length) {
    container.innerHTML = `
      <div class="query-empty">
        No queries yet. Use the form above to send your first query.
      </div>
    `;
    return;
  }

  container.innerHTML = staffQueryList.map(buildStaffQueryCard).join("");
}

function buildStaffQueryCard(query) {
  const subject = StaffPortal.helpers.escapeHtml(query.subject || "Untitled");
  const message = StaffPortal.helpers.escapeHtml(query.message || "");
  const reply = query.reply ? StaffPortal.helpers.escapeHtml(query.reply) : "";
  const company = StaffPortal.helpers.escapeHtml(query.companyName || "Company");
  const status = formatQueryStatus(query.status);
  const createdAt = StaffPortal.helpers.escapeHtml(StaffPortal.helpers.formatDate(query.createdAt));

  return `
    <div class="query-card">
      <div class="query-header">
        <div>
          <div class="query-title">${subject}</div>
          <div class="query-meta">${company} • ${createdAt}</div>
        </div>
        <span class="query-status ${status.className}">${status.label}</span>
      </div>
      <div class="query-message">${message}</div>
      <div class="query-reply">
        <div class="query-reply-label">Company reply</div>
        <div class="query-reply-text">${reply || "No reply yet."}</div>
      </div>
    </div>
  `;
}

function formatQueryStatus(value) {
  const normalized = String(value || "open").toLowerCase();
  if (normalized === "answered") {
    return { label: "Answered", className: "status-answered" };
  }
  if (normalized === "closed") {
    return { label: "Closed", className: "status-closed" };
  }
  return { label: "Open", className: "status-open" };
}
