(async function staffAnalyticsPage() {
  if (typeof window === "undefined") return;

  let charts = {
    searches: null,
    courses: null,
    placements: null,
  };

  let lastAnalytics = null;

  function renderAnalyticsList(containerId, rows, formatter) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!rows || !rows.length) {
      container.innerHTML = '<div class="empty-state"><p>No data available</p></div>';
      return;
    }
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        ${rows.map((row) => formatter(row)).join("")}
      </div>
    `;
  }

  function colorWithAlpha(color, alpha) {
    if (!color) return `rgba(56, 189, 248, ${alpha})`;
    const value = color.trim();
    if (value.startsWith("rgb(")) {
      return value.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
    }
    if (value.startsWith("rgba(")) {
      return value.replace(/rgba\(([^)]+),\s*[\d.]+\)/, `rgba($1, ${alpha})`);
    }
    if (value.startsWith("#")) {
      const hex = value.replace("#", "");
      const bigint = parseInt(hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return value;
  }

  function getChartTheme() {
    const styles = getComputedStyle(document.body);
    return {
      text: styles.getPropertyValue("--portal-text").trim() || "#0f172a",
      grid: styles.getPropertyValue("--portal-border").trim() || "rgba(148, 163, 184, 0.3)",
      accent: styles.getPropertyValue("--portal-accent").trim() || "#38bdf8",
      accent2: styles.getPropertyValue("--portal-accent-2").trim() || "#a855f7",
    };
  }

  function toggleEmptyState(canvasId, emptyId, hasData) {
    const canvas = document.getElementById(canvasId);
    const empty = document.getElementById(emptyId);
    if (!canvas || !empty) return;
    canvas.style.display = hasData ? "block" : "none";
    empty.style.display = hasData ? "none" : "flex";
  }

  function createBarChart(canvasId, chartRef, labels, values, label, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return null;
    const ctx = canvas.getContext("2d");
    const theme = getChartTheme();

    Chart.defaults.color = theme.text;
    Chart.defaults.borderColor = theme.grid;

    if (chartRef) chartRef.destroy();

    return new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label,
            data: values,
            backgroundColor: colorWithAlpha(color, 0.6),
            borderColor: color,
            borderWidth: 1,
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { mode: "index", intersect: false },
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, grid: { color: theme.grid } },
        },
      },
    });
  }

  function createLineChart(canvasId, chartRef, labels, values, label, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return null;
    const ctx = canvas.getContext("2d");
    const theme = getChartTheme();

    Chart.defaults.color = theme.text;
    Chart.defaults.borderColor = theme.grid;

    if (chartRef) chartRef.destroy();

    return new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label,
            data: values,
            borderColor: color,
            backgroundColor: colorWithAlpha(color, 0.2),
            tension: 0.35,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: color,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { mode: "index", intersect: false },
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, grid: { color: theme.grid } },
        },
      },
    });
  }

  function renderCharts(data) {
    if (!window.Chart) return;
    lastAnalytics = data;
    const theme = getChartTheme();

    const searchRows = (data.topSearches || []).slice(0, 6);
    const searchLabels = searchRows.map((row) => row.keyword);
    const searchValues = searchRows.map((row) => Number(row.searches || 0));
    toggleEmptyState("searchKeywordsChart", "searchKeywordsEmpty", searchRows.length > 0);
    if (searchRows.length) {
      charts.searches = createBarChart(
        "searchKeywordsChart",
        charts.searches,
        searchLabels,
        searchValues,
        "Searches",
        theme.accent
      );
    }

    const courseRows = (data.popularCourses || []).slice(0, 6);
    const courseLabels = courseRows.map((row) => row.title);
    const courseValues = courseRows.map((row) => Number(row.wishlistCount || 0));
    toggleEmptyState("popularCoursesChart", "popularCoursesEmpty", courseRows.length > 0);
    if (courseRows.length) {
      charts.courses = createBarChart(
        "popularCoursesChart",
        charts.courses,
        courseLabels,
        courseValues,
        "Wishlist",
        theme.accent2
      );
    }

    const placementRows = (data.placementTrends || []).slice(0, 8);
    const placementLabels = placementRows.map((row) => row.department);
    const placementValues = placementRows.map((row) => Number(row.placementRate || 0));
    toggleEmptyState("placementTrendsChart", "placementTrendsEmpty", placementRows.length > 0);
    if (placementRows.length) {
      charts.placements = createLineChart(
        "placementTrendsChart",
        charts.placements,
        placementLabels,
        placementValues,
        "Placement %",
        theme.accent
      );
    }
  }

  async function deleteSearchKeyword(keyword, searchType) {
    if (!confirm(`Are you sure you want to delete the search keyword "${keyword}"?`)) return;
    
    try {
      Loading.show();
      await StaffPortal.api.analytics.deleteKeyword(keyword, searchType);
      Loading.hide();
      Toast.success("Search keyword deleted successfully!");
      await loadAnalytics();
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to delete search keyword");
    }
  }

  async function loadAnalytics() {
    try {
      Loading.show();
      const data = await StaffPortal.api.analytics.get();
      Loading.hide();

      renderAnalyticsList(
        "topSearchesContainer",
        data.topSearches,
        (row) => `
          <div class="content-card" style="padding: 0.75rem; margin-bottom: 0.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
              <span>${StaffPortal.helpers.escapeHtml(row.keyword)} (${StaffPortal.helpers.escapeHtml(row.searchType)})</span>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <strong>${StaffPortal.helpers.escapeHtml(row.searches)}</strong>
                <button class="btn btn-danger btn-sm" onclick="deleteSearchKeyword(decodeURIComponent('${encodeURIComponent(row.keyword || "")}'), decodeURIComponent('${encodeURIComponent(row.searchType || "")}'))">🗑 Delete</button>
              </div>
            </div>
          </div>
        `
      );

      renderAnalyticsList(
        "popularCoursesContainer",
        data.popularCourses,
        (row) => `
          <div class="content-card" style="padding: 0.75rem; margin-bottom: 0.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>${StaffPortal.helpers.escapeHtml(row.title)}</span>
              <strong>${StaffPortal.helpers.escapeHtml(row.wishlistCount)}</strong>
            </div>
          </div>
        `
      );

      renderAnalyticsList(
        "placementTrendsContainer",
        data.placementTrends,
        (row) => `
          <div class="content-card" style="padding: 0.75rem; margin-bottom: 0.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>${StaffPortal.helpers.escapeHtml(row.department)}</span>
              <strong>${StaffPortal.helpers.escapeHtml(row.placementRate)}%</strong>
            </div>
          </div>
        `
      );

      renderCharts(data);
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to load analytics");
      ["topSearchesContainer", "popularCoursesContainer", "placementTrendsContainer"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<div class="empty-state"><p>Failed to load</p></div>';
      });
      toggleEmptyState("searchKeywordsChart", "searchKeywordsEmpty", false);
      toggleEmptyState("popularCoursesChart", "popularCoursesEmpty", false);
      toggleEmptyState("placementTrendsChart", "placementTrendsEmpty", false);
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (!checkAuth()) {
      window.location.href = "/";
      return;
    }

    await StaffPortal.initShell();
    await loadAnalytics();

    document.getElementById("refreshAnalytics").addEventListener("click", loadAnalytics);
  });

  // Expose function to global scope for onclick handlers
  window.deleteSearchKeyword = deleteSearchKeyword;

  document.addEventListener("portal-theme-change", () => {
    if (lastAnalytics) {
      renderCharts(lastAnalytics);
    }
  });
})();
