let companyQueryList = [];

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await CompanyPortal.initShell();
    bindCompanyQueryEvents();
    await loadCompanyQueries();
  } catch (error) {
    if (error.message !== "Unauthenticated") {
      Toast.error("Failed to load queries");
    }
  }
});

function bindCompanyQueryEvents() {
  const filter = document.getElementById("statusFilter");
  const refreshBtn = document.getElementById("refreshQueriesBtn");
  const list = document.getElementById("queriesList");

  if (filter) {
    filter.addEventListener("change", () => loadCompanyQueries(true));
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => loadCompanyQueries(true));
  }

  if (list) {
    list.addEventListener("submit", async (event) => {
      const form = event.target.closest(".query-response");
      if (!form) return;
      event.preventDefault();
      await submitCompanyResponse(form);
    });
  }
}

async function loadCompanyQueries(showToast = false) {
  const filter = document.getElementById("statusFilter");
  const status = filter ? filter.value : "all";

  try {
    const queries = await CompanyPortal.api.queries.list({ status });
    companyQueryList = CompanyPortal.normalizeItems(queries);
    renderCompanyQueries();
    if (showToast) Toast.success("Queries refreshed");
  } catch (error) {
    console.error(error);
    if (showToast) Toast.error(error.message || "Failed to refresh queries");
  }
}

function renderCompanyQueries() {
  const container = document.getElementById("queriesList");
  if (!container) return;

  if (!companyQueryList.length) {
    container.innerHTML = `
      <div class="query-empty">
        No queries available for this filter.
      </div>
    `;
    return;
  }

  container.innerHTML = companyQueryList.map(buildCompanyQueryCard).join("");
}

function buildCompanyQueryCard(query) {
  const subject = CompanyPortal.helpers.escapeHtml(query.subject || "Untitled");
  const message = CompanyPortal.helpers.escapeHtml(query.message || "");
  const reply = CompanyPortal.helpers.escapeHtml(query.reply || "");
  const senderName = CompanyPortal.helpers.escapeHtml(query.senderName || "User");
  const senderEmail = CompanyPortal.helpers.escapeHtml(query.senderEmail || "");
  const senderRole = CompanyPortal.helpers.escapeHtml(query.senderRole || "student");
  const status = formatQueryStatus(query.status);
  const createdAt = CompanyPortal.helpers.escapeHtml(CompanyPortal.helpers.formatDate(query.createdAt));

  return `
    <div class="query-card">
      <div class="query-header">
        <div>
          <div class="query-title">${subject}</div>
          <div class="query-meta">From ${senderName} (${senderRole})${senderEmail ? ` • ${senderEmail}` : ""}</div>
          <div class="query-meta">${createdAt}</div>
        </div>
        <span class="query-status ${status.className}">${status.label}</span>
      </div>
      <div class="query-message">${message}</div>
      <div class="query-reply">
        <div class="query-reply-label">Current reply</div>
        <div class="query-reply-text">${reply || "No reply yet."}</div>
      </div>
      <form class="query-response" data-query-id="${query.id}">
        <div class="form-group">
          <label for="reply-${query.id}">Reply</label>
          <textarea id="reply-${query.id}" rows="3" placeholder="Type your response...">${reply}</textarea>
        </div>
        <div class="response-row">
          <div class="form-group">
            <label for="status-${query.id}">Status</label>
            <select id="status-${query.id}">
              <option value="open" ${status.value === "open" ? "selected" : ""}>Open</option>
              <option value="answered" ${status.value === "answered" ? "selected" : ""}>Answered</option>
              <option value="closed" ${status.value === "closed" ? "selected" : ""}>Closed</option>
            </select>
          </div>
          <button class="btn btn-primary btn-sm" type="submit">Save Response</button>
        </div>
      </form>
    </div>
  `;
}

async function submitCompanyResponse(form) {
  const queryId = form.getAttribute("data-query-id");
  const reply = form.querySelector("textarea")?.value || "";
  const status = form.querySelector("select")?.value || "open";

  try {
    await CompanyPortal.api.queries.update(queryId, {
      reply: reply.trim(),
      status
    });
    Toast.success("Query updated");
    await loadCompanyQueries();
  } catch (error) {
    console.error(error);
    Toast.error(error.message || "Failed to update query");
  }
}

function formatQueryStatus(value) {
  const normalized = String(value || "open").toLowerCase();
  if (normalized === "answered") {
    return { label: "Answered", className: "status-answered", value: "answered" };
  }
  if (normalized === "closed") {
    return { label: "Closed", className: "status-closed", value: "closed" };
  }
  return { label: "Open", className: "status-open", value: "open" };
}
