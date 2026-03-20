/* ============================================
   STUDENT ADVANCED SEARCH + RECOMMENDATIONS
   ============================================ */

(function studentAdvanced() {
  if (typeof window === 'undefined' || !window.API) return;

  const state = {
    type: 'courses',
    page: 1,
    hasMore: false,
    limit: 6,
    items: [],
    savedSearches: [],
    wishlistIds: new Set(),
    searchDebounce: null
  };

  function apiGet(path, params = {}) {
    const query = new URLSearchParams(params);
    return API.get(`${path}${query.toString() ? `?${query.toString()}` : ''}`);
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getValue(id) {
    return document.getElementById(id)?.value?.trim() || '';
  }

  function getFilters() {
    return {
      department: getValue('filterDepartment'),
      search: getValue('opportunitySearch'),
      category: getValue('filterCategory'),
      platform: getValue('filterPlatform'),
      sort: getValue('sortOpportunities') || 'latest',
      feesMin: getValue('filterFeesMin'),
      feesMax: getValue('filterFeesMax'),
      withMeta: '1',
      limit: String(state.limit)
    };
  }

  function normalizePagedResponse(response) {
    if (Array.isArray(response)) {
      return {
        items: response,
        pagination: { page: 1, totalPages: 1, hasMore: false, total: response.length }
      };
    }
    return {
      items: response?.items || [],
      pagination: response?.pagination || { page: 1, totalPages: 1, hasMore: false, total: 0 }
    };
  }

  function getPaginationInfoText(pagination) {
    if (!pagination) return '';
    const total = pagination.total ?? 0;
    const page = pagination.page ?? 1;
    const totalPages = pagination.totalPages ?? 1;
    return `Showing page ${page} of ${totalPages} (${total} results)`;
  }

  async function fetchByType(type, page = 1) {
    const filters = getFilters();
    const params = { ...filters, page: String(page) };

    if (type !== 'courses') {
      delete params.category;
      delete params.platform;
      delete params.feesMin;
      delete params.feesMax;
      if (params.sort === 'fees_low' || params.sort === 'fees_high') {
        params.sort = 'latest';
      }
    }

    if (!params.feesMin) delete params.feesMin;
    if (!params.feesMax) delete params.feesMax;
    if (!params.search) delete params.search;
    if (!params.department) delete params.department;
    if (!params.category) delete params.category;
    if (!params.platform) delete params.platform;

    const path = type === 'jobs'
      ? '/api/student/jobs'
      : type === 'courses'
        ? '/api/student/courses'
        : '/api/student/internships';

    return apiGet(path, params);
  }

  function renderOpportunities(type, items, append = false) {
    const container = document.getElementById('opportunitiesContainer');
    if (!container) return;

    const html = items.map((opp) => {
      const wishlistButton = type === 'courses'
        ? `<button class="btn btn-outline btn-sm" onclick="toggleWishlistCourse(${opp.id})">${state.wishlistIds.has(opp.id) ? 'Remove Wishlist' : 'Add Wishlist'}</button>`
        : '';

      return `
        <div class="opportunity-card student-light">
          <h4>${escapeHtml(opp.title)}</h4>
          <div class="meta">
            <span class="meta-item">${escapeHtml(opp.companyName || 'Company')}</span>
            ${opp.department ? `<span class="meta-item">${escapeHtml(opp.department)}</span>` : ''}
            <span class="badge badge-primary">${type === 'jobs' ? 'Job' : type === 'courses' ? 'Course' : 'Internship'}</span>
          </div>
          <p class="description">${escapeHtml(opp.description || 'No description available')}</p>
          ${opp.requiredSkills ? `<p><strong>Skills:</strong> ${escapeHtml(opp.requiredSkills)}</p>` : ''}
          ${opp.category ? `<p><strong>Category:</strong> ${escapeHtml(opp.category)}</p>` : ''}
          ${opp.platform ? `<p><strong>Platform:</strong> ${escapeHtml(opp.platform)}</p>` : ''}
          ${opp.fees !== null && opp.fees !== undefined ? `<p><strong>Fees:</strong> INR ${escapeHtml(opp.fees)}</p>` : ''}
          ${opp.stipend !== null && opp.stipend !== undefined ? `<p><strong>Stipend:</strong> INR ${escapeHtml(opp.stipend)}</p>` : ''}
          ${opp.duration ? `<p><strong>Duration:</strong> ${escapeHtml(opp.duration)}</p>` : ''}
          <div class="btn-group mt-2">
            <button class="btn btn-primary btn-sm" onclick="applyForOpportunity('${type === 'jobs' ? 'job' : type === 'courses' ? 'course' : 'internship'}', ${opp.id})">Apply Now</button>
            ${wishlistButton}
          </div>
        </div>
      `;
    }).join('');

    if (!append) {
      container.innerHTML = items.length
        ? `<div class="opportunities-grid">${html}</div>`
        : `
          <div class="empty-state">
            <div class="empty-state-icon">-</div>
            <h3>No ${escapeHtml(type)} found</h3>
            <p>Try changing filters or search terms</p>
          </div>
        `;
      return;
    }

    const grid = container.querySelector('.opportunities-grid');
    if (grid) {
      grid.insertAdjacentHTML('beforeend', html);
    } else {
      container.innerHTML = `<div class="opportunities-grid">${html}</div>`;
    }
  }

  function updatePaginationUI(pagination) {
    const loadMoreBtn = document.getElementById('loadMoreOpportunitiesBtn');
    const info = document.getElementById('opportunitiesPaginationInfo');
    if (!loadMoreBtn || !info) return;

    state.hasMore = !!pagination?.hasMore;
    loadMoreBtn.style.display = state.hasMore ? 'inline-flex' : 'none';
    info.textContent = getPaginationInfoText(pagination);
  }

  async function loadType(type, page = 1, append = false) {
    state.type = type;
    state.page = page;
    try {
      if (window.Loading) Loading.show();
      const response = await fetchByType(type, page);
      const { items, pagination } = normalizePagedResponse(response);
      if (!append) state.items = items;
      else state.items = state.items.concat(items);
      renderOpportunities(type, items, append);
      updatePaginationUI(pagination);
    } catch (error) {
      if (window.Toast) Toast.error(error.message || `Failed to load ${type}`);
    } finally {
      if (window.Loading) Loading.hide();
    }
  }

  async function loadSavedSearches() {
    const container = document.getElementById('savedSearchesContainer');
    if (!container) return;

    try {
      const rows = await API.get('/api/student/saved-searches');
      state.savedSearches = Array.isArray(rows) ? rows : [];
      if (!state.savedSearches.length) {
        container.innerHTML = '<small>No saved searches yet.</small>';
        return;
      }

      container.innerHTML = state.savedSearches.map((row) => `
        <div class="saved-search-chip">
          <span onclick="applySavedSearch(${row.id})" style="cursor:pointer;">${escapeHtml(row.name)}</span>
          <button type="button" onclick="deleteSavedSearch(${row.id})">x</button>
        </div>
      `).join('');
    } catch (error) {
      container.innerHTML = '<small>Failed to load saved searches</small>';
    }
  }

  async function saveCurrentSearch() {
    const name = window.prompt('Enter a name for this search:');
    if (!name || !name.trim()) return;

    const payload = {
      name: name.trim(),
      searchType: state.type,
      searchParams: getFilters()
    };

    try {
      await API.post('/api/student/saved-searches', payload);
      if (window.Toast) Toast.success('Saved search created');
      await loadSavedSearches();
    } catch (error) {
      if (window.Toast) Toast.error(error.message || 'Failed to save search');
    }
  }

  async function deleteSavedSearch(id) {
    try {
      await API.delete(`/api/student/saved-searches/${id}`);
      if (window.Toast) Toast.success('Saved search deleted');
      await loadSavedSearches();
    } catch (error) {
      if (window.Toast) Toast.error(error.message || 'Failed to delete saved search');
    }
  }

  function applySavedSearch(id) {
    const selected = state.savedSearches.find((row) => row.id === id);
    if (!selected) return;
    const params = selected.searchParams || {};

    const setters = [
      ['filterDepartment', params.department || ''],
      ['opportunitySearch', params.search || ''],
      ['filterCategory', params.category || ''],
      ['filterPlatform', params.platform || ''],
      ['sortOpportunities', params.sort || 'latest'],
      ['filterFeesMin', params.feesMin || ''],
      ['filterFeesMax', params.feesMax || '']
    ];
    setters.forEach(([idKey, value]) => {
      const el = document.getElementById(idKey);
      if (el) el.value = value;
    });

    const type = selected.searchType && selected.searchType !== 'all' ? selected.searchType : 'courses';
    loadType(type, 1, false);
  }

  async function loadWishlist() {
    const container = document.getElementById('wishlistContainer');
    if (!container) return;
    try {
      const rows = await API.get('/api/student/wishlist');
      const list = Array.isArray(rows) ? rows : [];
      state.wishlistIds = new Set(list.map((row) => row.courseId));

      if (!list.length) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">-</div>
            <h3>No wishlist items</h3>
            <p>Add courses to wishlist from the opportunities section.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="table-container wishlist-table">
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Company</th>
                <th>Department</th>
                <th>Platform</th>
                <th>Fees</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${list.map((row) => `
                <tr>
                  <td>${escapeHtml(row.title)}</td>
                  <td>${escapeHtml(row.companyName || '-')}</td>
                  <td>${escapeHtml(row.department || '-')}</td>
                  <td>${escapeHtml(row.platform || '-')}</td>
                  <td>${row.fees !== null && row.fees !== undefined ? `INR ${escapeHtml(row.fees)}` : '-'}</td>
                  <td><button class="btn btn-danger btn-sm" onclick="toggleWishlistCourse(${row.courseId})">Remove</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (error) {
      container.innerHTML = '<small>Failed to load wishlist</small>';
    }
  }

  async function toggleWishlistCourse(courseId) {
    try {
      if (state.wishlistIds.has(courseId)) {
        await API.delete(`/api/student/wishlist/${courseId}`);
      } else {
        await API.post('/api/student/wishlist', { courseId });
      }
      await loadWishlist();
      if (state.type === 'courses' && state.items.length) {
        renderOpportunities('courses', state.items, false);
      }
    } catch (error) {
      if (window.Toast) Toast.error(error.message || 'Failed to update wishlist');
    }
  }

  async function loadNotifications() {
    const container = document.getElementById('notificationsContainer');
    if (!container) return;
    try {
      const rows = await API.get('/api/student/notifications');
      const list = Array.isArray(rows) ? rows : [];
      if (!list.length) {
        container.innerHTML = '<small>No notifications</small>';
        return;
      }

      container.innerHTML = list.map((row) => `
        <div class="notification-item ${row.isRead ? '' : 'unread'}">
          <h5>${escapeHtml(row.title)}</h5>
          <p>${escapeHtml(row.message)}</p>
          <div class="btn-group mt-1">
            ${row.isRead ? '' : `<button class="btn btn-outline btn-sm" onclick="markNotificationRead(${row.id})">Mark Read</button>`}
            <small>${escapeHtml(new Date(row.createdAt).toLocaleString())}</small>
          </div>
        </div>
      `).join('');
    } catch (error) {
      container.innerHTML = '<small>Failed to load notifications</small>';
    }
  }

  async function markNotificationRead(id) {
    try {
      await API.put(`/api/student/notifications/${id}/read`, {});
      await loadNotifications();
    } catch (error) {
      if (window.Toast) Toast.error(error.message || 'Failed to mark notification');
    }
  }

  async function markAllNotificationsRead() {
    try {
      await API.put('/api/student/notifications/read-all', {});
      await loadNotifications();
    } catch (error) {
      if (window.Toast) Toast.error(error.message || 'Failed to mark all notifications');
    }
  }

  async function loadRecommendations() {
    const container = document.getElementById('recommendationsContainer');
    if (!container) return;
    try {
      const data = await API.get('/api/student/recommendations');
      const groups = [
        { key: 'jobs', label: 'Jobs' },
        { key: 'courses', label: 'Courses' },
        { key: 'internships', label: 'Internships' }
      ];

      const cards = groups.map((group) => {
        const items = data[group.key] || [];
        if (!items.length) return '';
        return items.slice(0, 4).map((opp) => `
          <div class="opportunity-card student-light">
            <h4>${escapeHtml(opp.title)}</h4>
            <div class="meta">
              <span class="meta-item">${escapeHtml(opp.companyName || 'Company')}</span>
              <span class="badge badge-primary">${group.label.slice(0, -1)}</span>
            </div>
            <p class="description">${escapeHtml(opp.description || 'Recommended based on your profile')}</p>
            <p><strong>Score:</strong> ${escapeHtml(opp.recommendationScore ?? 0)}</p>
            <button class="btn btn-primary btn-sm" onclick="applyForOpportunity('${group.key === 'jobs' ? 'job' : group.key === 'courses' ? 'course' : 'internship'}', ${opp.id})">Apply</button>
          </div>
        `).join('');
      }).join('');

      container.innerHTML = cards || '<small>No recommendations yet. Complete your profile and apply to opportunities.</small>';
    } catch (error) {
      container.innerHTML = '<small>Failed to load recommendations</small>';
    }
  }

  function bindAdvancedFilters() {
    const ids = [
      'filterCategory',
      'filterPlatform',
      'sortOpportunities',
      'filterFeesMin',
      'filterFeesMax'
    ];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const eventName = el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(eventName, () => {
        if (state.searchDebounce) clearTimeout(state.searchDebounce);
        state.searchDebounce = setTimeout(() => loadType(state.type, 1, false), 250);
      });
    });
  }

  function bindButtons() {
    document.getElementById('loadMoreOpportunitiesBtn')?.addEventListener('click', () => {
      if (!state.hasMore) return;
      loadType(state.type, state.page + 1, true);
    });
    document.getElementById('saveCurrentSearchBtn')?.addEventListener('click', saveCurrentSearch);
    document.getElementById('refreshSavedSearchesBtn')?.addEventListener('click', loadSavedSearches);
    document.getElementById('refreshRecommendationsBtn')?.addEventListener('click', loadRecommendations);
    document.getElementById('refreshWishlistBtn')?.addEventListener('click', loadWishlist);
    document.getElementById('refreshNotificationsBtn')?.addEventListener('click', loadNotifications);
    document.getElementById('markAllNotificationsReadBtn')?.addEventListener('click', markAllNotificationsRead);
  }

  // Override dashboard loaders with advanced smart search + pagination
  window.loadJobs = () => loadType('jobs', 1, false);
  window.loadCourses = () => loadType('courses', 1, false);
  window.loadInternships = () => loadType('internships', 1, false);
  window.reloadCurrentOpportunityList = () => loadType(state.type, 1, false);

  // Export actions for inline buttons
  window.applySavedSearch = applySavedSearch;
  window.deleteSavedSearch = deleteSavedSearch;
  window.toggleWishlistCourse = toggleWishlistCourse;
  window.markNotificationRead = markNotificationRead;

  document.addEventListener('DOMContentLoaded', async () => {
    bindAdvancedFilters();
    bindButtons();
    await Promise.all([
      loadSavedSearches(),
      loadWishlist(),
      loadRecommendations(),
      loadNotifications()
    ]);
  });
})();
