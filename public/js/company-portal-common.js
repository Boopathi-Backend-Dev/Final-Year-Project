(function companyPortalCommon() {
  if (typeof window === "undefined") return;

  const CompanyPortal = {
    api: {
      profile: {
        get: () => API.get("/api/company/profile"),
        update: (data) => API.post("/api/company/profile", data),
      },
      jobs: {
        create: (data) => API.post("/api/company/jobs", data),
        list: () => API.get("/api/company/jobs"),
      },
      courses: {
        create: (data) => API.post("/api/company/courses", data),
        list: () => API.get("/api/company/courses"),
      },
      internships: {
        create: (data) => API.post("/api/company/internships", data),
        list: () => API.get("/api/company/internships"),
        getAttendance: (internshipId) => API.get(`/api/company/internships/${internshipId}/attendance`),
      },
      applications: {
        get: (targetType, targetId) => API.get(`/api/company/applications?targetType=${targetType}&targetId=${targetId}`),
        updateStatus: (applicationId, status) => API.put(`/api/company/applications/${applicationId}`, { status }),
      },
      students: {
        getProfile: (studentId) => API.get(`/api/company/student-profile/${studentId}`),
      },
      attendance: {
        mark: (data) => API.post("/api/company/attendance", data),
      },
      queries: {
        list: (params = {}) => {
          const query = new URLSearchParams(params);
          return API.get(`/api/company/queries${query.toString() ? `?${query.toString()}` : ""}`);
        },
        update: (id, payload) => API.put(`/api/company/queries/${id}`, payload),
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
      await this.loadCompanyIdentity();
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

    async loadCompanyIdentity() {
      try {
        const profile = await this.api.profile.get();
        const displayName = profile?.name || "Company Admin";
        const nameTargets = document.querySelectorAll("[data-company-name]");
        nameTargets.forEach((el) => {
          el.textContent = displayName;
        });
      } catch (error) {
        console.error("Failed to load company identity", error);
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

  window.CompanyPortal = CompanyPortal;
  window.logout = () => CompanyPortal.logout();
})();
