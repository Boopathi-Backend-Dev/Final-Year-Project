/* ============================================
   UTILITY FUNCTIONS & TOAST NOTIFICATIONS
   ============================================ */

// Toast notification system
const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 5000) {
    this.init();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    }[type] || 'ℹ';

    toast.innerHTML = `
      <span style="font-size: 1.25rem;">${icon}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    this.container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        if (toast.parentElement) {
          toast.style.animation = 'slideIn 0.3s ease-out reverse';
          setTimeout(() => toast.remove(), 300);
        }
      }, duration);
    }

    return toast;
  },

  success(message, duration) {
    return this.show(message, 'success', duration);
  },

  error(message, duration) {
    return this.show(message, 'error', duration);
  },

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  },

  info(message, duration) {
    return this.show(message, 'info', duration);
  }
};

// Loading overlay
const Loading = {
  overlay: null,

  show() {
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.className = 'loading-overlay';
      this.overlay.innerHTML = '<div class="spinner"></div>';
      document.body.appendChild(this.overlay);
    }
    this.overlay.style.display = 'flex';
  },

  hide() {
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
  }
};

// API helper with error handling
const API = {
  baseURL: '',

  token() {
    return localStorage.getItem('token');
  },

  setToken(t) {
    if (t) {
      localStorage.setItem('token', t);
    } else {
      localStorage.removeItem('token');
    }
  },

  headers(includeAuth = true) {
    const h = { 'Content-Type': 'application/json' };
    const token = API.token();
    if (includeAuth && token) {
      h.Authorization = `Bearer ${token}`;
    }
    return h;
  },

  async request(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...API.headers(options.includeAuth !== false),
          ...(options.headers || {})
        }
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          API.setToken(null);
          if (window.location.pathname !== '/') {
            Toast.error('Session expired. Please login again.');
            setTimeout(() => window.location.href = '/', 2000);
          }
        }
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async get(url) {
    return API.request(url, { method: 'GET' });
  },

  async post(url, body) {
    return API.request(url, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  async put(url, body) {
    return API.request(url, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  async delete(url) {
    return API.request(url, { method: 'DELETE' });
  },

  async upload(url, formData) {
    const token = API.token();
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Upload failed');
    }

    return response.json();
  }
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Format currency (if needed)
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Debounce function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Check authentication
const checkAuth = () => {
  // Check for token in URL params (for OAuth redirects)
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');
  if (tokenFromUrl) {
    API.setToken(tokenFromUrl);
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const token = API.token();
  if (!token && window.location.pathname !== '/') {
    Toast.warning('Please login to continue');
    setTimeout(() => window.location.href = '/', 1500);
    return false;
  }
  return !!token;
};

// Animated counter helper
const animateCounter = (el, target, options = {}) => {
  if (!el) return;
  const duration = Number(options.duration || 900);
  const startValue = Number(options.from ?? 0);
  const endValue = Number(target ?? 0);
  const startTime = performance.now();

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const tick = (now) => {
    const elapsed = Math.min((now - startTime) / duration, 1);
    const value = Math.round(startValue + (endValue - startValue) * easeOutCubic(elapsed));
    el.textContent = value.toLocaleString();
    if (elapsed < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
};

let rippleBound = false;
const initRippleEffects = () => {
  if (rippleBound || typeof document === "undefined") return;
  rippleBound = true;
  document.addEventListener("click", (event) => {
    const target = event.target.closest(".btn, [data-ripple]");
    if (!target || target.disabled) return;

    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    target.appendChild(ripple);

    ripple.addEventListener("animationend", () => ripple.remove());
  });
};

const PortalUI = {
  initialized: false,

  isPortalPage() {
    if (typeof document === "undefined") return false;
    const body = document.body;
    if (!body) return false;
    return (
      body.classList.contains("student-portal-page") ||
      body.classList.contains("staff-portal-page") ||
      body.classList.contains("company-portal-page")
    );
  },

  safeGetTheme() {
    try {
      return localStorage.getItem("portal-theme");
    } catch (e) {
      return null;
    }
  },

  safeSetTheme(value) {
    try {
      localStorage.setItem("portal-theme", value);
    } catch (e) {
      // ignore
    }
  },

  applyTheme(theme) {
    if (!this.isPortalPage()) return "light";
    const preferred =
      theme ||
      this.safeGetTheme() ||
      (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.body.setAttribute("data-theme", preferred);
    this.updateThemeToggle(preferred);
    return preferred;
  },

  toggleTheme() {
    const current = document.body.getAttribute("data-theme") || "light";
    const next = current === "dark" ? "light" : "dark";
    this.safeSetTheme(next);
    this.applyTheme(next);
    document.dispatchEvent(new CustomEvent("portal-theme-change", { detail: { theme: next } }));
  },

  injectThemeToggle() {
    const header = document.querySelector(".portal-header-right");
    if (!header || header.querySelector("[data-theme-toggle]")) return;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "theme-toggle";
    toggle.setAttribute("data-theme-toggle", "");
    toggle.setAttribute("aria-pressed", "false");
    toggle.innerHTML = `
      <span class="toggle-track" aria-hidden="true">
        <span class="toggle-thumb"></span>
      </span>
      <span class="toggle-label" data-theme-label>Light</span>
    `;

    toggle.addEventListener("click", () => this.toggleTheme());
    header.insertBefore(toggle, header.firstChild);
    this.updateThemeToggle(document.body.getAttribute("data-theme") || "light");
  },

  updateThemeToggle(theme) {
    const label = document.querySelector("[data-theme-label]");
    const toggle = document.querySelector("[data-theme-toggle]");
    if (toggle) toggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    if (label) label.textContent = theme === "dark" ? "Dark" : "Light";
  },

  injectFab() {
    if (document.querySelector(".portal-fab") || !this.isPortalPage()) return;
    const links = Array.from(document.querySelectorAll(".portal-nav a")).slice(0, 4);
    if (!links.length) return;

    const fab = document.createElement("button");
    fab.type = "button";
    fab.className = "portal-fab";
    fab.setAttribute("aria-label", "Quick actions");
    fab.textContent = "+";

    const menu = document.createElement("div");
    menu.className = "portal-fab-menu";
    menu.innerHTML = links
      .map((link) => `<a href="${link.getAttribute("href")}">${link.textContent.trim()}</a>`)
      .join("");

    const closeMenu = () => menu.classList.remove("is-open");

    fab.addEventListener("click", (event) => {
      event.stopPropagation();
      menu.classList.toggle("is-open");
    });

    document.addEventListener("click", (event) => {
      if (!menu.classList.contains("is-open")) return;
      if (!menu.contains(event.target) && !fab.contains(event.target)) closeMenu();
    });

    document.body.appendChild(fab);
    document.body.appendChild(menu);
  },

  init() {
    if (this.initialized || !this.isPortalPage()) return;
    this.initialized = true;
    this.applyTheme();
    this.injectThemeToggle();
    this.injectFab();
  },
};

// Expose utilities for scripts that look up globals on window (non-module scripts)
if (typeof window !== 'undefined') {
  window.Toast = Toast;
  window.Loading = Loading;
  window.API = API;
  window.formatDate = formatDate;
  window.formatCurrency = formatCurrency;
  window.debounce = debounce;
  window.checkAuth = checkAuth;
  window.animateCounter = animateCounter;
  window.PortalUI = PortalUI;
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    initRippleEffects();
    PortalUI.init();
  });
}
