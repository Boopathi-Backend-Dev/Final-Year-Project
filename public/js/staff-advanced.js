/* ============================================
   STAFF ADVANCED ANALYTICS + APPROVALS
   ============================================ */

const staffAdvancedState = {
  searchDebounce: null
};

if (typeof StaffAPI !== 'undefined') {
  StaffAPI.getAnalytics = () => API.get('/api/staff/analytics');
  StaffAPI.getApprovals = (params = {}) => {
    const query = new URLSearchParams(params);
    return API.get(`/api/staff/approvals${query.toString() ? `?${query.toString()}` : ''}`);
  };
  StaffAPI.updateApprovalStatus = (type, id, payload) => API.put(`/api/staff/approvals/${type}/${id}`, payload);
}

function staffEscapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getStaffFilterValue(id) {
  return document.getElementById(id)?.value?.trim() || '';
}

function normalizePagedResponse(response) {
  if (Array.isArray(response)) {
    return { items: response };
  }
  return { items: response?.items || [] };
}

function renderAdvancedOpportunitiesTable(container, items, emptyTitle, emptySubtitle) {
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="empty-state staff-light">
        <div class="empty-state-icon">-</div>
        <h3>${staffEscapeHtml(emptyTitle)}</h3>
        <p>${staffEscapeHtml(emptySubtitle)}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Title</th>
            <th>Company</th>
            <th>Department</th>
            <th>Status</th>
            <th>Posted</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((op) => `
            <tr>
              <td><span class="badge badge-info">${op.type === 'job' ? 'Job' : op.type === 'course' ? 'Course' : 'Internship'}</span></td>
              <td>${staffEscapeHtml(op.title)}</td>
              <td>${staffEscapeHtml(op.companyName || '-')}</td>
              <td>${staffEscapeHtml(op.department || '-')}</td>
              <td><span class="badge badge-primary">${staffEscapeHtml(op.workflowStatus || 'published')}</span></td>
              <td>${typeof formatDate === 'function' ? formatDate(op.createdAt) : staffEscapeHtml(op.createdAt)}</td>
              <td>
                <div class="btn-group">
                  <button class="btn btn-secondary btn-sm" onclick="promptAssign(${op.id}, '${op.type}')">Assign</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function loadOpportunities() {
  try {
    if (window.Loading) Loading.show();

    const search = getStaffFilterValue('staffOpportunitySearch');
    const status = getStaffFilterValue('staffOpportunityStatus') || 'all';
    const sort = getStaffFilterValue('staffOpportunitySort') || 'latest';
    const params = { search, status, sort, withMeta: '1', page: '1', limit: '25' };

    const [opportunitiesRes, coursesRes] = await Promise.all([
      StaffAPI.getOpportunities(params),
      StaffAPI.getCourses(params)
    ]);

    const opportunities = normalizePagedResponse(opportunitiesRes).items;
    const courses = normalizePagedResponse(coursesRes).items;

    const jobs = opportunities.filter((op) => op.type === 'job');
    const internships = opportunities.filter((op) => op.type === 'internship');

    renderAdvancedOpportunitiesTable(
      document.getElementById('opportunitiesJobsContainer'),
      jobs,
      'No jobs found',
      search ? 'Try a different search' : 'Click refresh to load jobs'
    );
    renderAdvancedOpportunitiesTable(
      document.getElementById('opportunitiesInternshipsContainer'),
      internships,
      'No internships found',
      search ? 'Try a different search' : 'Click refresh to load internships'
    );
    renderAdvancedOpportunitiesTable(
      document.getElementById('opportunitiesCoursesContainer'),
      courses,
      'No courses found',
      search ? 'Try a different search' : 'Click refresh to load courses'
    );
  } catch (error) {
    if (window.Toast) Toast.error(error.message || 'Failed to load opportunities');
  } finally {
    if (window.Loading) Loading.hide();
  }
}

function renderAnalyticsList(containerId, rows, formatter) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!rows || !rows.length) {
    container.innerHTML = '<small>No data available</small>';
    return;
  }
  container.innerHTML = `
    <div class="analytics-list">
      ${rows.map((row) => formatter(row)).join('')}
    </div>
  `;
}

async function loadAnalytics() {
  try {
    const data = await StaffAPI.getAnalytics();
    renderAnalyticsList('topSearchesContainer', data.topSearches, (row) => `
      <div class="analytics-row">
        <span>${staffEscapeHtml(row.keyword)} (${staffEscapeHtml(row.searchType)})</span>
        <strong>${staffEscapeHtml(row.searches)}</strong>
      </div>
    `);
    renderAnalyticsList('popularCoursesContainer', data.popularCourses, (row) => `
      <div class="analytics-row">
        <span>${staffEscapeHtml(row.title)}</span>
        <strong>${staffEscapeHtml(row.wishlistCount)}</strong>
      </div>
    `);
    renderAnalyticsList('placementTrendsContainer', data.placementTrends, (row) => `
      <div class="analytics-row">
        <span>${staffEscapeHtml(row.department)}</span>
        <strong>${staffEscapeHtml(row.placementRate)}%</strong>
      </div>
    `);
  } catch (error) {
    ['topSearchesContainer', 'popularCoursesContainer', 'placementTrendsContainer'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<small>Failed to load</small>';
    });
  }
}

function approvalActionButton(type, id, label, status, className) {
  return `<button class="btn ${className} btn-sm" onclick="updateApprovalWorkflow('${type}', ${id}, '${status}')">${label}</button>`;
}

async function loadApprovalQueue() {
  const status = getStaffFilterValue('approvalStatusFilter') || 'review';
  const type = getStaffFilterValue('approvalTypeFilter') || 'all';
  const container = document.getElementById('approvalQueueContainer');
  if (!container) return;

  try {
    const rows = await StaffAPI.getApprovals({ status, type });
    if (!rows || rows.length === 0) {
      container.innerHTML = '<small>No approvals in this view.</small>';
      return;
    }

    container.innerHTML = `
      <div class="table-container">
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
            ${rows.map((row) => `
              <tr>
                <td><span class="badge badge-info">${staffEscapeHtml(row.type)}</span></td>
                <td>${staffEscapeHtml(row.title)}</td>
                <td>${staffEscapeHtml(row.companyName || '-')}</td>
                <td>${staffEscapeHtml(row.department || '-')}</td>
                <td><span class="badge badge-primary">${staffEscapeHtml(row.workflowStatus)}</span></td>
                <td>${staffEscapeHtml(row.reviewNotes || '-')}</td>
                <td>
                  <div class="approval-actions">
                    ${approvalActionButton(row.type, row.id, 'Review', 'review', 'btn-outline')}
                    ${approvalActionButton(row.type, row.id, 'Publish', 'published', 'btn-success')}
                    ${approvalActionButton(row.type, row.id, 'Reject', 'rejected', 'btn-danger')}
                    ${approvalActionButton(row.type, row.id, 'Draft', 'draft', 'btn-outline')}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    container.innerHTML = '<small>Failed to load approval queue</small>';
  }
}

async function updateApprovalWorkflow(type, id, status) {
  const reviewNotes = window.prompt(`Optional note for ${type} #${id}:`) || '';
  try {
    await StaffAPI.updateApprovalStatus(type, id, { status, reviewNotes });
    if (window.Toast) Toast.success(`Updated to ${status}`);
    await Promise.all([loadApprovalQueue(), loadOpportunities(), loadAnalytics()]);
  } catch (error) {
    if (window.Toast) Toast.error(error.message || 'Failed to update workflow');
  }
}

function bindStaffAdvancedEvents() {
  document.getElementById('refreshAnalyticsBtn')?.addEventListener('click', loadAnalytics);
  document.getElementById('refreshApprovalsBtn')?.addEventListener('click', loadApprovalQueue);
  document.getElementById('approvalStatusFilter')?.addEventListener('change', loadApprovalQueue);
  document.getElementById('approvalTypeFilter')?.addEventListener('change', loadApprovalQueue);
  document.getElementById('staffOpportunityStatus')?.addEventListener('change', loadOpportunities);
  document.getElementById('staffOpportunitySort')?.addEventListener('change', loadOpportunities);

  const searchInput = document.getElementById('staffOpportunitySearch');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      if (staffAdvancedState.searchDebounce) clearTimeout(staffAdvancedState.searchDebounce);
      staffAdvancedState.searchDebounce = setTimeout(loadOpportunities, 250);
    });
  }
}

window.updateApprovalWorkflow = updateApprovalWorkflow;

document.addEventListener('DOMContentLoaded', async () => {
  bindStaffAdvancedEvents();
  await Promise.all([loadOpportunities(), loadAnalytics(), loadApprovalQueue()]);
});
