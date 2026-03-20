let studentQueryCompanies = [];
let studentQueryList = [];

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await StudentPortal.initShell();
    bindStudentQueryEvents();
    await Promise.all([loadStudentCompanies(), loadStudentQueries()]);
  } catch (error) {
    if (error.message !== "Unauthenticated") {
      Toast.error("Failed to load queries");
    }
  }
});

function bindStudentQueryEvents() {
  const form = document.getElementById("queryForm");
  const resetBtn = document.getElementById("resetQueryForm");
  const refreshBtn = document.getElementById("refreshQueriesBtn");

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await submitStudentQuery();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (form) form.reset();
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => loadStudentQueries(true));
  }
}

async function loadStudentCompanies() {
  try {
    const companies = await StudentPortal.api.companies.list();
    studentQueryCompanies = StudentPortal.normalizeItems(companies);
    renderStudentCompanyOptions();
  } catch (error) {
    console.error(error);
    Toast.error(error.message || "Failed to load companies");
  }
}

function renderStudentCompanyOptions() {
  const select = document.getElementById("companySelect");
  if (!select) return;

  if (!studentQueryCompanies.length) {
    select.innerHTML = `<option value="">No companies available</option>`;
    select.disabled = true;
    return;
  }

  select.disabled = false;
  select.innerHTML = [
    `<option value="">Select company</option>`,
    ...studentQueryCompanies.map((company) => {
      const label = StudentPortal.helpers.escapeHtml(company.name || "Company");
      return `<option value="${company.id}">${label}</option>`;
    })
  ].join("");
}

async function loadStudentQueries(showToast = false) {
  try {
    const queries = await StudentPortal.api.queries.list();
    studentQueryList = StudentPortal.normalizeItems(queries);
    renderStudentQueries();
    if (showToast) Toast.success("Queries refreshed");
  } catch (error) {
    console.error(error);
    if (showToast) Toast.error(error.message || "Failed to refresh queries");
  }
}

async function submitStudentQuery() {
  const companyId = document.getElementById("companySelect")?.value;
  const subject = document.getElementById("subjectInput")?.value || "";
  const message = document.getElementById("messageInput")?.value || "";

  if (!companyId) {
    Toast.warning("Select a company");
    return;
  }

  try {
    await StudentPortal.api.queries.create({
      companyId: Number(companyId),
      subject: subject.trim(),
      message: message.trim()
    });
    Toast.success("Query submitted");
    const form = document.getElementById("queryForm");
    if (form) form.reset();
    await loadStudentQueries();
  } catch (error) {
    console.error(error);
    Toast.error(error.message || "Failed to submit query");
  }
}

function renderStudentQueries() {
  const container = document.getElementById("queriesList");
  if (!container) return;

  if (!studentQueryList.length) {
    container.innerHTML = `
      <div class="query-empty">
        No queries yet. Use the form above to send your first query.
      </div>
    `;
    return;
  }

  container.innerHTML = studentQueryList.map(buildStudentQueryCard).join("");
}

function buildStudentQueryCard(query) {
  const subject = StudentPortal.helpers.escapeHtml(query.subject || "Untitled");
  const message = StudentPortal.helpers.escapeHtml(query.message || "");
  const reply = query.reply ? StudentPortal.helpers.escapeHtml(query.reply) : "";
  const company = StudentPortal.helpers.escapeHtml(query.companyName || "Company");
  const status = formatQueryStatus(query.status);
  const createdAt = StudentPortal.helpers.escapeHtml(StudentPortal.helpers.formatDate(query.createdAt));

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
