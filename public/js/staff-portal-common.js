(function staffPortalCommon() {
  if (typeof window === "undefined") return;

  const StaffPortal = {
    api: {
      stats: {
        get: () => API.get("/api/staff/stats"),
      },
      students: {
        list: (params = {}) => {
          const query = new URLSearchParams(params);
          return API.get(`/api/staff/students${query.toString() ? `?${query.toString()}` : ""}`);
        },
        get: (id) => API.get(`/api/staff/students/${id}`),
        update: (id, data) => API.put(`/api/staff/students/${id}`, data),
        delete: (id) => API.delete(`/api/staff/students/${id}`),
        approve: (id) => API.put(`/api/staff/students/${id}/approve`, {}),
        getProfile: (id) => API.get(`/api/staff/students/${id}/profile`),
        getCourses: (id) => API.get(`/api/staff/students/${id}/courses`),
        getCart: (id) => API.get(`/api/staff/students/${id}/cart`),
        getAttendance: (id) => API.get(`/api/staff/students/${id}/attendance`),
      },
      applications: {
        list: () => API.get("/api/staff/applications"),
      },
      queries: {
        list: () => API.get("/api/staff/queries"),
        create: (payload) => API.post("/api/staff/queries", payload),
      },
      opportunities: {
        get: (params = {}) => {
          const query = new URLSearchParams(params);
          return API.get(`/api/staff/opportunities${query.toString() ? `?${query.toString()}` : ""}`);
        },
        assign: (payload) => API.post("/api/staff/assign", payload),
      },
      courses: {
        get: (params = {}) => {
          const query = new URLSearchParams(params);
          return API.get(`/api/staff/courses${query.toString() ? `?${query.toString()}` : ""}`);
        },
      },
      analytics: {
        get: () => API.get("/api/staff/analytics"),
        deleteKeyword: (keyword, searchType) =>
          API.delete(`/api/staff/analytics/search-keyword/${encodeURIComponent(keyword)}/${encodeURIComponent(searchType)}`),
      },
      approvals: {
        list: (params = {}) => {
          const query = new URLSearchParams(params);
          return API.get(`/api/staff/approvals${query.toString() ? `?${query.toString()}` : ""}`);
        },
        update: (type, id, payload) => API.put(`/api/staff/approvals/${type}/${id}`, payload),
      },
      companies: {
        list: () => API.get("/api/staff/companies"),
      },
    },

    helpers: {
      escapeHtml(value) {
        return String(value ?? "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      },

      statusClass(status) {
        const normalized = String(status || "").toLowerCase();
        if (normalized === "approved" || normalized === "selected") return "status-approved";
        if (normalized === "applied" || normalized === "pending") return "status-applied";
        if (normalized === "rejected") return "status-rejected";
        return "status-pending";
      },

      statusLabel(status) {
        if (!status) return "Pending";
        return status.charAt(0).toUpperCase() + status.slice(1);
      },

      formatDate(value) {
        if (!value) return "-";
        return formatDate(value);
      },
    },

    normalizeItems(response) {
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.items)) return response.items;
      if (response && Array.isArray(response.value)) return response.value;
      return [];
    },

    async initShell() {
      if (!checkAuth()) {
        throw new Error("Unauthenticated");
      }

      this.markActiveNav();
      this.bindLogout();
      await this.loadStaffIdentity();
    },

    markActiveNav() {
      const pageKey = document.body.getAttribute("data-page");
      if (!pageKey) return;

      document.querySelectorAll(".portal-nav a[data-nav]").forEach((link) => {
        const key = link.getAttribute("data-nav");
        link.classList.toggle("is-active", key === pageKey);
      });
    },

    bindLogout() {
      document.querySelectorAll("[data-action='logout']").forEach((el) => {
        el.addEventListener("click", () => this.logout());
      });
    },

    async loadStaffIdentity() {
      try {
        const stats = await this.api.stats.get();
        const displayName = "Staff Admin";
        const nameTargets = document.querySelectorAll("[data-staff-name]");
        nameTargets.forEach((el) => {
          el.textContent = displayName;
        });
      } catch (error) {
        console.error("Failed to load staff identity", error);
      }
    },

    logout() {
      API.setToken(null);
      Toast.info("Logged out");
      setTimeout(() => {
        window.location.href = "/";
      }, 600);
    },
  };

  window.StaffPortal = StaffPortal;
  window.logout = () => StaffPortal.logout();
})();
