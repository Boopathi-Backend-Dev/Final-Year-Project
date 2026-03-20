const PAGE_LIMIT = 9;

const SORT_OPTIONS = {
  job: [
    { value: "latest", label: "Latest" },
    { value: "az", label: "A-Z" },
    { value: "relevance", label: "Relevance" },
  ],
  internship: [
    { value: "latest", label: "Latest" },
    { value: "az", label: "A-Z" },
    { value: "relevance", label: "Relevance" },
  ],
  course: [
    { value: "latest", label: "Latest" },
    { value: "az", label: "A-Z" },
    { value: "relevance", label: "Relevance" },
    { value: "fees_low", label: "Fees: Low to High" },
    { value: "fees_high", label: "Fees: High to Low" },
  ],
};

let currentType = "job";
let currentItems = [];
let wishlistIds = new Set();
let currentPage = 1;
let pageMeta = null;
let savedSearches = [];

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await StudentPortal.initShell();
    bindOpportunityEvents();
    await preloadWishlistIds();
    await loadSavedSearches();
    const initialType = getInitialType();
    updateTypeControls(initialType);
    await loadOpportunities(initialType, 1);
  } catch (error) {
    if (error.message !== "Unauthenticated") {
      Toast.error("Failed to load opportunities");
    }
  }
});

function getInitialType() {
  const params = new URLSearchParams(window.location.search);
  const typeParam = params.get("type");
  if (typeParam && ["job", "course", "internship"].includes(typeParam)) {
    return typeParam;
  }
  return "job";
}

function bindOpportunityEvents() {
  const typeSelect = document.getElementById("filterType");
  const categorySelect = document.getElementById("filterCategory");
  const departmentSelect = document.getElementById("filterDepartment");
  const searchInput = document.getElementById("filterSearch");
  const sortSelect = document.getElementById("filterSort");
  const platformSelect = document.getElementById("filterPlatform");
  const feesMinInput = document.getElementById("filterFeesMin");
  const feesMaxInput = document.getElementById("filterFeesMax");

  document.getElementById("loadJobsBtn").addEventListener("click", () => {
    typeSelect.value = "job";
    updateTypeControls("job");
    loadOpportunities("job", 1);
  });

  document.getElementById("loadCoursesBtn").addEventListener("click", () => {
    typeSelect.value = "course";
    updateTypeControls("course");
    loadOpportunities("course", 1);
  });

  document.getElementById("loadInternshipsBtn").addEventListener("click", () => {
    typeSelect.value = "internship";
    updateTypeControls("internship");
    loadOpportunities("internship", 1);
  });

  document.getElementById("refreshOpportunitiesBtn").addEventListener("click", () => {
    loadOpportunities(typeSelect.value || currentType, 1);
  });

  typeSelect.addEventListener("change", () => {
    const nextType = typeSelect.value || "job";
    updateTypeControls(nextType);
    loadOpportunities(nextType, 1);
  });

  categorySelect.addEventListener("change", () => loadOpportunities(typeSelect.value || currentType, 1));
  departmentSelect.addEventListener("change", () => loadOpportunities(typeSelect.value || currentType, 1));
  sortSelect.addEventListener("change", () => loadOpportunities(typeSelect.value || currentType, 1));
  platformSelect.addEventListener("change", () => loadOpportunities(typeSelect.value || currentType, 1));
  feesMinInput.addEventListener("input", debounce(() => loadOpportunities(typeSelect.value || currentType, 1), 350));
  feesMaxInput.addEventListener("input", debounce(() => loadOpportunities(typeSelect.value || currentType, 1), 350));
  searchInput.addEventListener("input", debounce(() => loadOpportunities(typeSelect.value || currentType, 1), 350));

  const clearBtn = document.getElementById("clearFiltersBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      resetFilters();
      loadOpportunities(typeSelect.value || currentType, 1);
    });
  }

  const saveBtn = document.getElementById("saveSearchBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => saveCurrentSearch());
  }

  const prevBtn = document.getElementById("prevPageBtn");
  const nextBtn = document.getElementById("nextPageBtn");
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (pageMeta?.page > 1) {
        loadOpportunities(currentType, pageMeta.page - 1);
      }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (pageMeta?.page < pageMeta?.totalPages) {
        loadOpportunities(currentType, pageMeta.page + 1);
      }
    });
  }

  const savedList = document.getElementById("savedSearchList");
  if (savedList) {
    savedList.addEventListener("click", async (event) => {
      const applyBtn = event.target.closest("[data-saved-apply]");
      if (applyBtn) {
        const id = Number(applyBtn.getAttribute("data-saved-apply"));
        const saved = savedSearches.find((item) => item.id === id);
        if (saved) applySavedSearch(saved);
        return;
      }

      const deleteBtn = event.target.closest("[data-saved-delete]");
      if (deleteBtn) {
        const id = Number(deleteBtn.getAttribute("data-saved-delete"));
        await deleteSavedSearch(id);
      }
    });
  }
}

function updateTypeControls(type) {
  currentType = type;
  const typeSelect = document.getElementById("filterType");
  if (typeSelect) typeSelect.value = type;
  updateSortOptions(type);
  toggleCourseFilters(type === "course");
}

function updateSortOptions(type) {
  const sortSelect = document.getElementById("filterSort");
  if (!sortSelect) return;
  const options = SORT_OPTIONS[type] || SORT_OPTIONS.job;
  const current = sortSelect.value || "latest";
  sortSelect.innerHTML = options
    .map((opt) => `<option value="${opt.value}">${opt.label}</option>`)
    .join("");
  if (options.some((opt) => opt.value === current)) {
    sortSelect.value = current;
  } else {
    sortSelect.value = "latest";
  }
}

function toggleCourseFilters(show) {
  document.querySelectorAll(".filter-course-only").forEach((el) => {
    el.classList.toggle("hidden", !show);
  });
}

function resetFilters() {
  const categorySelect = document.getElementById("filterCategory");
  const departmentSelect = document.getElementById("filterDepartment");
  const searchInput = document.getElementById("filterSearch");
  const sortSelect = document.getElementById("filterSort");
  const platformSelect = document.getElementById("filterPlatform");
  const feesMinInput = document.getElementById("filterFeesMin");
  const feesMaxInput = document.getElementById("filterFeesMax");

  if (categorySelect) categorySelect.value = "";
  if (departmentSelect) departmentSelect.value = "";
  if (searchInput) searchInput.value = "";
  if (sortSelect) sortSelect.value = "latest";
  if (platformSelect) platformSelect.value = "";
  if (feesMinInput) feesMinInput.value = "";
  if (feesMaxInput) feesMaxInput.value = "";
}

function readFilters() {
  const type = document.getElementById("filterType").value || "job";
  const category = document.getElementById("filterCategory").value.trim();
  const department = document.getElementById("filterDepartment").value.trim();
  const search = document.getElementById("filterSearch").value.trim();
  const sort = document.getElementById("filterSort").value || "latest";
  const platform = document.getElementById("filterPlatform").value.trim();
  const feesMin = document.getElementById("filterFeesMin").value.trim();
  const feesMax = document.getElementById("filterFeesMax").value.trim();

  return { type, category, department, search, sort, platform, feesMin, feesMax };
}

async function preloadWishlistIds() {
  try {
    const wishlist = await StudentPortal.api.wishlist.list();
    const list = StudentPortal.normalizeItems(wishlist);
    wishlistIds = new Set(list.map((item) => Number(item.courseId)));
  } catch (error) {
    console.error("Wishlist preload failed", error);
  }
}

async function loadSavedSearches() {
  try {
    const response = await StudentPortal.api.savedSearches.list();
    savedSearches = Array.isArray(response) ? response : [];
    renderSavedSearches();
  } catch (error) {
    console.error("Saved searches fetch failed", error);
    renderSavedSearches();
  }
}

function renderSavedSearches() {
  const container = document.getElementById("savedSearchList");
  if (!container) return;

  if (!savedSearches.length) {
    container.innerHTML = `<div class="saved-search-empty">No saved searches yet.</div>`;
    return;
  }

  container.innerHTML = savedSearches
    .map((saved) => {
      const meta = formatSavedSearchMeta(saved);
      return `
        <div class="saved-search-card">
          <div>
            <div class="saved-search-title">${StudentPortal.helpers.escapeHtml(saved.name)}</div>
            <div class="saved-search-meta">${meta}</div>
          </div>
          <div class="saved-search-actions">
            <button class="btn btn-outline btn-sm" type="button" data-saved-apply="${saved.id}">Use</button>
            <button class="btn btn-danger btn-sm" type="button" data-saved-delete="${saved.id}">Delete</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function formatSavedSearchMeta(saved) {
  const params = saved.searchParams || {};
  const labelMap = { jobs: "Job", courses: "Course", internships: "Internship", all: "Any" };
  const parts = [labelMap[saved.searchType] || "Any"];

  if (params.department) parts.push(params.department);
  if (params.category) parts.push(params.category);
  if (params.platform) parts.push(params.platform);
  if (params.search) parts.push(`Search: ${params.search}`);
  if (params.feesMin || params.feesMax) {
    parts.push(`Fees: ${params.feesMin || 0}-${params.feesMax || "Max"}`);
  }
  if (params.sort) parts.push(`Sort: ${params.sort}`);

  return parts.map((item) => StudentPortal.helpers.escapeHtml(item)).join(" | ");
}

async function saveCurrentSearch() {
  try {
    const nameInput = document.getElementById("savedSearchName");
    const name = nameInput?.value.trim();
    if (!name) {
      Toast.warning("Enter a name for this search");
      return;
    }

    const filters = readFilters();
    const typeMap = { job: "jobs", course: "courses", internship: "internships" };
    const payload = {
      name,
      searchType: typeMap[filters.type] || "all",
      searchParams: {
        department: filters.department || "",
        category: filters.category || "",
        platform: filters.platform || "",
        feesMin: filters.feesMin || "",
        feesMax: filters.feesMax || "",
        search: filters.search || "",
        sort: filters.sort || "latest",
      },
    };

    await StudentPortal.api.savedSearches.create(payload);
    if (nameInput) nameInput.value = "";
    Toast.success("Saved search created");
    await loadSavedSearches();
  } catch (error) {
    console.error(error);
    Toast.error(error.message || "Could not save search");
  }
}

async function deleteSavedSearch(id) {
  try {
    await StudentPortal.api.savedSearches.remove(id);
    Toast.info("Saved search removed");
    await loadSavedSearches();
  } catch (error) {
    console.error(error);
    Toast.error(error.message || "Could not delete search");
  }
}

function applySavedSearch(saved) {
  const params = saved.searchParams || {};
  const typeMap = { jobs: "job", courses: "course", internships: "internship" };
  const nextType = typeMap[saved.searchType] || currentType;

  document.getElementById("filterType").value = nextType;
  updateTypeControls(nextType);

  document.getElementById("filterDepartment").value = params.department || "";
  document.getElementById("filterCategory").value = params.category || "";
  document.getElementById("filterPlatform").value = params.platform || "";
  document.getElementById("filterFeesMin").value = params.feesMin || "";
  document.getElementById("filterFeesMax").value = params.feesMax || "";
  document.getElementById("filterSearch").value = params.search || "";

  if (params.sort) {
    const sortSelect = document.getElementById("filterSort");
    sortSelect.value = params.sort;
  }

  loadOpportunities(nextType, 1);
}

async function loadOpportunities(type, page = 1) {
  currentType = type;
  currentPage = page;
  const filters = readFilters();

  const params = {
    page,
    limit: PAGE_LIMIT,
    withMeta: 1,
    sort: filters.sort || "latest",
  };

  if (filters.department) params.department = filters.department;
  if (filters.search) params.search = filters.search;

  if (type === "course") {
    if (filters.category) params.category = filters.category;
    if (filters.platform) params.platform = filters.platform;
    if (filters.feesMin) params.feesMin = filters.feesMin;
    if (filters.feesMax) params.feesMax = filters.feesMax;
  }

  try {
    let response;
    if (type === "course") {
      response = await StudentPortal.api.opportunities.courses(params);
    } else if (type === "internship") {
      response = await StudentPortal.api.opportunities.internships(params);
    } else {
      response = await StudentPortal.api.opportunities.jobs(params);
    }

    if (response && Array.isArray(response.items)) {
      currentItems = response.items;
      pageMeta = response.pagination || null;
    } else {
      currentItems = StudentPortal.normalizeItems(response);
      pageMeta = null;
    }

    renderOpportunityList();
  } catch (error) {
    console.error(error);
    Toast.error(error.message || "Failed to load opportunities");
  }
}

function renderOpportunityList() {
  const titleMap = {
    job: "Loaded Jobs",
    course: "Loaded Courses",
    internship: "Loaded Internships",
  };
  document.getElementById("opportunitySectionTitle").textContent = titleMap[currentType] || "Loaded Opportunities";

  const container = document.getElementById("opportunitiesContainer");
  if (!currentItems.length) {
    container.innerHTML = "<p>No opportunities found for selected filters.</p>";
    renderPagination();
    renderOpportunityMeta();
    return;
  }

  container.innerHTML = `
    <div class="split-grid">
      ${currentItems
        .map((item) => {
          const safeTitle = StudentPortal.helpers.escapeHtml(item.title || "-");
          const safeCompany = StudentPortal.helpers.escapeHtml(item.companyName || "-");
          const safeDepartment = StudentPortal.helpers.escapeHtml(item.department || "-");
          const safeDescription = StudentPortal.helpers.escapeHtml(item.description || "No description");
          const safeCategory = StudentPortal.helpers.escapeHtml(item.category || "-");
          const safePlatform = StudentPortal.helpers.escapeHtml(item.platform || "-");
          const safeSkills = StudentPortal.helpers.escapeHtml(item.requiredSkills || "-");

          const typeLabel = currentType.charAt(0).toUpperCase() + currentType.slice(1);
          const applyType = currentType === "job" ? "job" : currentType === "course" ? "course" : "internship";

          const extraRows = buildOpportunityDetails(item);

          return `
            <div class="kpi-card">
              <div class="kpi-label">${typeLabel}</div>
              <div style="font-weight:700; margin-bottom: 0.25rem;">${safeTitle}</div>
              <div style="font-size:0.88rem; color:#5a677c; margin-bottom:0.5rem;">${safeCompany}</div>
              <div style="font-size:0.85rem; margin-bottom:0.2rem;"><strong>Department:</strong> ${safeDepartment}</div>
              ${currentType === "course" ? `<div style="font-size:0.85rem; margin-bottom:0.2rem;"><strong>Category:</strong> ${safeCategory}</div>` : ""}
              ${currentType === "course" ? `<div style="font-size:0.85rem; margin-bottom:0.2rem;"><strong>Platform:</strong> ${safePlatform}</div>` : ""}
              <div style="font-size:0.85rem; margin-bottom:0.2rem;"><strong>Skills:</strong> ${safeSkills}</div>
              ${extraRows}
              <div style="font-size:0.85rem; margin-bottom:0.7rem;">${safeDescription}</div>
              <div class="toolbar">
                <button class="btn btn-primary btn-sm" type="button" onclick="applyOpportunity('${applyType}', ${item.id})">Apply</button>
                ${currentType === "course"
                  ? `<button class="btn btn-outline btn-sm" type="button" onclick="toggleWishlist(${item.id})">${wishlistIds.has(item.id) ? "Remove Wishlist" : "Add Wishlist"}</button>`
                  : ""}
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;

  renderOpportunityMeta();
  renderPagination();
}

function buildOpportunityDetails(item) {
  const details = [];

  if (currentType === "course") {
    if (item.duration) details.push(`<div style="font-size:0.85rem; margin-bottom:0.2rem;"><strong>Duration:</strong> ${StudentPortal.helpers.escapeHtml(item.duration)}</div>`);
    if (item.mode) details.push(`<div style="font-size:0.85rem; margin-bottom:0.2rem;"><strong>Mode:</strong> ${StudentPortal.helpers.escapeHtml(item.mode)}</div>`);
    if (item.fees !== null && item.fees !== undefined && item.fees !== "") {
      const feesLabel = Number(item.fees) === 0 ? "Free" : formatCurrency(Number(item.fees));
      details.push(`<div style="font-size:0.85rem; margin-bottom:0.2rem;"><strong>Fees:</strong> ${feesLabel}</div>`);
    }
  } else if (currentType === "internship") {
    if (item.duration) details.push(`<div style="font-size:0.85rem; margin-bottom:0.2rem;"><strong>Duration:</strong> ${StudentPortal.helpers.escapeHtml(item.duration)}</div>`);
    if (item.stipend) details.push(`<div style="font-size:0.85rem; margin-bottom:0.2rem;"><strong>Stipend:</strong> ${StudentPortal.helpers.escapeHtml(item.stipend)}</div>`);
    if (item.location) details.push(`<div style="font-size:0.85rem; margin-bottom:0.2rem;"><strong>Location:</strong> ${StudentPortal.helpers.escapeHtml(item.location)}</div>`);
    if (item.applicationDeadline) details.push(`<div style="font-size:0.85rem; margin-bottom:0.2rem;"><strong>Deadline:</strong> ${formatDate(item.applicationDeadline)}</div>`);
  } else {
    if (item.createdAt) details.push(`<div style="font-size:0.85rem; margin-bottom:0.2rem;"><strong>Posted:</strong> ${formatDate(item.createdAt)}</div>`);
  }

  return details.join("");
}

function renderPagination() {
  const pagination = document.getElementById("opportunitiesPagination");
  const label = document.getElementById("paginationLabel");
  const prevBtn = document.getElementById("prevPageBtn");
  const nextBtn = document.getElementById("nextPageBtn");

  if (!pagination || !label || !prevBtn || !nextBtn) return;

  if (!pageMeta || pageMeta.totalPages <= 1) {
    pagination.classList.add("hidden");
    return;
  }

  pagination.classList.remove("hidden");
  label.textContent = `Page ${pageMeta.page} of ${pageMeta.totalPages}`;
  prevBtn.disabled = pageMeta.page <= 1;
  nextBtn.disabled = pageMeta.page >= pageMeta.totalPages;
}

function renderOpportunityMeta() {
  const meta = document.getElementById("opportunityMeta");
  if (!meta) return;

  if (!pageMeta) {
    meta.textContent = currentItems.length ? `Showing ${currentItems.length} result(s)` : "";
    return;
  }

  if (!pageMeta.total) {
    meta.textContent = "No results found.";
    return;
  }

  const start = (pageMeta.page - 1) * pageMeta.limit + 1;
  const end = Math.min(pageMeta.page * pageMeta.limit, pageMeta.total);
  meta.textContent = `Showing ${start}-${end} of ${pageMeta.total} results`;
}

async function applyOpportunity(targetType, targetId) {
  try {
    await StudentPortal.api.opportunities.apply(targetType, targetId);
    Toast.success("Application submitted");
  } catch (error) {
    console.error(error);
    Toast.error(error.message || "Application failed");
  }
}

async function toggleWishlist(courseId) {
  try {
    if (wishlistIds.has(courseId)) {
      await StudentPortal.api.wishlist.remove(courseId);
      wishlistIds.delete(courseId);
      Toast.info("Removed from wishlist");
    } else {
      await StudentPortal.api.wishlist.add(courseId);
      wishlistIds.add(courseId);
      Toast.success("Added to wishlist");
    }
    renderOpportunityList();
  } catch (error) {
    console.error(error);
    Toast.error(error.message || "Wishlist update failed");
  }
}
