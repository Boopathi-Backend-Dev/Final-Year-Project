let dashboardWishlistIds = new Set();
let recommendationsState = { jobs: [], courses: [], internships: [] };

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await StudentPortal.initShell();
    bindDashboardEvents();
    await Promise.all([loadDashboardStats(), loadProfileStrength(), loadRecommendations()]);
  } catch (error) {
    if (error.message !== "Unauthenticated") {
      Toast.error("Failed to load dashboard");
    }
  }
});

function bindDashboardEvents() {
  const refreshBtn = document.getElementById("refreshRecommendationsBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => loadRecommendations(true));
  }

  const recContainer = document.getElementById("recommendationsGrid");
  if (recContainer) {
    recContainer.addEventListener("click", async (event) => {
      const applyBtn = event.target.closest("[data-apply-id]");
      if (applyBtn) {
        const targetType = applyBtn.getAttribute("data-apply-type");
        const targetId = Number(applyBtn.getAttribute("data-apply-id"));
        await handleApply(targetType, targetId);
        return;
      }

      const wishlistBtn = event.target.closest("[data-wishlist-id]");
      if (wishlistBtn) {
        const courseId = Number(wishlistBtn.getAttribute("data-wishlist-id"));
        await handleWishlistToggle(courseId);
      }
    });
  }
}

async function loadDashboardStats() {
  try {
    const apps = await StudentPortal.api.applications.list();
    const list = StudentPortal.normalizeItems(apps);

    const total = list.length;
    const approved = list.filter((item) => ["approved", "selected"].includes(String(item.status || "").toLowerCase())).length;
    const pending = list.filter((item) => ["applied", "pending"].includes(String(item.status || "").toLowerCase())).length;

    const totalEl = document.getElementById("totalApplications");
    const approvedEl = document.getElementById("approvedApplications");
    const pendingEl = document.getElementById("pendingApplications");

    if (window.animateCounter) {
      window.animateCounter(totalEl, total);
      window.animateCounter(approvedEl, approved);
      window.animateCounter(pendingEl, pending);
    } else {
      totalEl.textContent = String(total);
      approvedEl.textContent = String(approved);
      pendingEl.textContent = String(pending);
    }
  } catch (error) {
    console.error(error);
    Toast.error(error.message || "Could not load summary");
  }
}

async function loadProfileStrength() {
  try {
    const profile = await StudentPortal.api.profile.get();
    const result = computeProfileCompleteness(profile);
    updateProfileStrengthUI(result);
  } catch (error) {
    console.error(error);
  }
}

function computeProfileCompleteness(profile) {
  const fields = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "registerNumber", label: "Register Number" },
    { key: "department", label: "Department" },
    { key: "yearOfStudy", label: "Year of Study" },
    { key: "phone", label: "Phone" },
    { key: "address", label: "Address" },
    { key: "dateOfBirth", label: "Date of Birth" },
    { key: "gender", label: "Gender" },
    { key: "skills", label: "Skills" },
    { key: "cgpa", label: "CGPA" },
    { key: "resumePath", label: "Resume" },
    { key: "photoPath", label: "Photo" },
  ];

  const missing = fields.filter((field) => {
    const value = profile?.[field.key];
    if (value === null || value === undefined) return true;
    if (typeof value === "number") return Number.isNaN(value);
    return String(value).trim().length === 0;
  });

  const total = fields.length || 1;
  const completed = total - missing.length;
  const percent = Math.round((completed / total) * 100);

  return { percent, missing, completed, total };
}

function updateProfileStrengthUI(result) {
  const fill = document.getElementById("profileProgressFill");
  const label = document.getElementById("profileProgressLabel");
  const count = document.getElementById("profileMissingCount");
  const list = document.getElementById("profileMissingList");

  if (fill) fill.style.width = `${result.percent}%`;
  if (label) label.textContent = `${result.percent}% complete`;
  if (count) count.textContent = `${result.missing.length} missing`;

  if (!list) return;
  if (result.missing.length === 0) {
    list.innerHTML = `<li class="tag tag-success">All set!</li>`;
    return;
  }

  list.innerHTML = result.missing
    .slice(0, 6)
    .map((field) => `<li class="tag">${field.label}</li>`)
    .join("");
}

async function loadRecommendations(force = false) {
  try {
    const [recs, wishlist] = await Promise.all([
      StudentPortal.api.recommendations.get(),
      StudentPortal.api.wishlist.list()
    ]);

    recommendationsState = {
      jobs: Array.isArray(recs?.jobs) ? recs.jobs : [],
      courses: Array.isArray(recs?.courses) ? recs.courses : [],
      internships: Array.isArray(recs?.internships) ? recs.internships : [],
    };

    const list = StudentPortal.normalizeItems(wishlist);
    dashboardWishlistIds = new Set(list.map((item) => Number(item.courseId)));
    renderRecommendations();

    if (force) Toast.success("Recommendations refreshed");
  } catch (error) {
    console.error(error);
    if (force) Toast.error(error.message || "Failed to refresh recommendations");
  }
}

function renderRecommendations() {
  const container = document.getElementById("recommendationsGrid");
  if (!container) return;

  const groups = [
    {
      key: "jobs",
      label: "Jobs",
      type: "job",
      link: "/student/opportunities.html?type=job"
    },
    {
      key: "courses",
      label: "Courses",
      type: "course",
      link: "/student/opportunities.html?type=course"
    },
    {
      key: "internships",
      label: "Internships",
      type: "internship",
      link: "/student/opportunities.html?type=internship"
    }
  ];

  container.innerHTML = groups
    .map((group) => {
      const items = recommendationsState[group.key] || [];
      const itemsMarkup = items.length
        ? items
            .slice(0, 3)
            .map((item) => buildRecommendationItem(item, group.type))
            .join("")
        : `<div class="recommendation-empty">No recommendations yet.</div>`;

      return `
        <div class="recommendation-group">
          <div class="recommendation-header">
            <div>
              <h4>${group.label}</h4>
              <span class="recommendation-meta">${items.length} suggestion${items.length === 1 ? "" : "s"}</span>
            </div>
            <a class="btn btn-outline btn-sm" href="${group.link}">View all</a>
          </div>
          <div class="recommendation-list">
            ${itemsMarkup}
          </div>
        </div>
      `;
    })
    .join("");
}

function buildRecommendationItem(item, type) {
  const safeTitle = StudentPortal.helpers.escapeHtml(item.title || "-");
  const safeCompany = StudentPortal.helpers.escapeHtml(item.companyName || "Company");
  const safeDepartment = StudentPortal.helpers.escapeHtml(item.department || "Any");
  const safeSkills = StudentPortal.helpers.escapeHtml(item.requiredSkills || "Flexible");

  const wishlistBtn =
    type === "course"
      ? `<button class="btn btn-outline btn-sm" type="button" data-wishlist-id="${item.id}">
          ${dashboardWishlistIds.has(Number(item.id)) ? "Remove Wishlist" : "Add Wishlist"}
        </button>`
      : "";

  return `
    <div class="recommendation-item">
      <div class="recommendation-title">${safeTitle}</div>
      <div class="recommendation-meta">${safeCompany} | ${safeDepartment}</div>
      <div class="recommendation-tags">${safeSkills}</div>
      <div class="recommendation-actions">
        <button class="btn btn-primary btn-sm" type="button" data-apply-type="${type}" data-apply-id="${item.id}">
          Apply
        </button>
        ${wishlistBtn}
      </div>
    </div>
  `;
}

async function handleApply(targetType, targetId) {
  try {
    await StudentPortal.api.opportunities.apply(targetType, targetId);
    Toast.success("Application submitted");
  } catch (error) {
    console.error(error);
    Toast.error(error.message || "Application failed");
  }
}

async function handleWishlistToggle(courseId) {
  try {
    if (dashboardWishlistIds.has(courseId)) {
      await StudentPortal.api.wishlist.remove(courseId);
      dashboardWishlistIds.delete(courseId);
      Toast.info("Removed from wishlist");
    } else {
      await StudentPortal.api.wishlist.add(courseId);
      dashboardWishlistIds.add(courseId);
      Toast.success("Added to wishlist");
    }
    renderRecommendations();
  } catch (error) {
    console.error(error);
    Toast.error(error.message || "Wishlist update failed");
  }
}
