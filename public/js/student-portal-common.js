(function studentPortalCommon() {
  if (typeof window === "undefined") return;

  const StudentPortal = {
    api: {
      profile: {
        get: () => API.get("/api/student/profile"),
        update: (formData) => API.upload("/api/student/profile", formData),
      },
      companies: {
        list: () => API.get("/api/student/companies"),
      },
      applications: {
        list: () => API.get("/api/student/applications"),
        remove: (id) => API.delete(`/api/student/applications/${id}`),
      },
      opportunities: {
        jobs: (params = {}) => {
          const query = new URLSearchParams(params);
          return API.get(`/api/student/jobs${query.toString() ? `?${query.toString()}` : ""}`);
        },
        courses: (params = {}) => {
          const query = new URLSearchParams(params);
          return API.get(`/api/student/courses${query.toString() ? `?${query.toString()}` : ""}`);
        },
        internships: (params = {}) => {
          const query = new URLSearchParams(params);
          return API.get(`/api/student/internships${query.toString() ? `?${query.toString()}` : ""}`);
        },
        apply: (targetType, targetId) => API.post("/api/student/apply", { targetType, targetId }),
      },
      recommendations: {
        get: () => API.get("/api/student/recommendations"),
      },
      savedSearches: {
        list: () => API.get("/api/student/saved-searches"),
        create: (payload) => API.post("/api/student/saved-searches", payload),
        remove: (id) => API.delete(`/api/student/saved-searches/${id}`),
      },
      extraCourses: {
        list: () => API.get("/api/student/extra-courses"),
        create: (payload) => API.post("/api/student/extra-courses", payload),
        update: (id, payload) => API.put(`/api/student/extra-courses/${id}`, payload),
        remove: (id) => API.delete(`/api/student/extra-courses/${id}`),
      },
      wishlist: {
        list: () => API.get("/api/student/wishlist"),
        add: (courseId) => API.post("/api/student/wishlist", { courseId }),
        remove: (courseId) => API.delete(`/api/student/wishlist/${courseId}`),
      },
      notifications: {
        list: () => API.get("/api/student/notifications"),
        markRead: (id) => API.put(`/api/student/notifications/${id}/read`, {}),
        markAllRead: () => API.put("/api/student/notifications/read-all", {}),
        delete: (id) => API.delete(`/api/student/notifications/${id}`),
      },
      attendance: {
        list: () => API.get("/api/student/attendance"),
      },
      queries: {
        list: () => API.get("/api/student/queries"),
        create: (payload) => API.post("/api/student/queries", payload),
      },
      ai: {
        send: (message, context = {}) => API.post("/api/student/ai-chat", { message, context }),
        history: () => API.get("/api/student/ai-chat/history"),
        clear: () => API.delete("/api/student/ai-chat/history"),
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
      await this.loadStudentIdentity();
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

    async loadStudentIdentity() {
      try {
        const profile = await this.api.profile.get();
        const displayName = profile?.name || "Student";
        const nameTargets = document.querySelectorAll("[data-student-name]");
        nameTargets.forEach((el) => {
          el.textContent = displayName;
        });
      } catch (error) {
        console.error("Failed to load student identity", error);
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

  window.StudentPortal = StudentPortal;
  window.logout = () => StudentPortal.logout();
})();
