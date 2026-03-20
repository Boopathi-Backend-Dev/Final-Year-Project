(async function companyProfilePage() {
  if (typeof window === "undefined") return;

  async function loadProfile() {
    try {
      Loading.show();
      const profile = await CompanyPortal.api.profile.get();
      Loading.hide();

      if (profile) {
        // Generate dynamic HTML for profile view with colors
        const profileViewHTML = `
          <div style="display: grid; gap: 2rem;">
            <!-- Company Header Section -->
            <div style="display: flex; align-items: center; gap: 1.5rem; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 2rem; border-radius: 12px; color: #0f172a; border: 1px solid #e2e8f0;">
              <div id="companyLogoContainer" style="width: 100px; height: 100px; border-radius: 12px; background: rgba(15, 23, 42, 0.05); display: grid; place-items: center; font-size: 3rem; flex-shrink: 0;">
                <div id="companyLogoPlaceholder">${(profile.name || "C").charAt(0).toUpperCase()}</div>
                <img id="companyLogo" src="${profile.logoPath || profile.logoUrl ? (profile.logoPath || profile.logoUrl).startsWith("/") ? (profile.logoPath || profile.logoUrl) : "/uploads/" + (profile.logoPath || profile.logoUrl) : ""}" alt="Company Logo" style="display: ${profile.logoPath || profile.logoUrl ? "block" : "none"}; width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">
              </div>
              <div>
                <h2 style="margin: 0 0 0.5rem; font-size: 1.8rem;">${CompanyPortal.helpers.escapeHtml(profile.name || "Company Name")}</h2>
                <span style="background: rgba(15, 23, 42, 0.05); padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.9rem; font-weight: 600; color: #1f2937; border: 1px solid #e2e8f0;">✅ Active</span>
              </div>
            </div>

            <!-- Contact Information Section -->
            <div>
              <h3 style="margin: 0 0 1.5rem; font-size: 1.2rem; color: #1f2937;">📧 Contact Information</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
                <div style="background: linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%); padding: 1.5rem; border-radius: 12px; color: #1f2937; border: 1px solid #fecdd3; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);">
                  <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 0.5rem;">Email</div>
                  <div style="font-size: 1rem; font-weight: 700; word-break: break-all;">${CompanyPortal.helpers.escapeHtml(profile.email || "-")}</div>
                </div>
                <div style="background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%); padding: 1.5rem; border-radius: 12px; color: #1f2937; border: 1px solid #bae6fd; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);">
                  <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 0.5rem;">Phone</div>
                  <div style="font-size: 1.2rem; font-weight: 700;">${CompanyPortal.helpers.escapeHtml(profile.phone || "-")}</div>
                </div>
                <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 1.5rem; border-radius: 12px; color: #14532d; border: 1px solid #bbf7d0; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);">
                  <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 0.5rem;">Website</div>
                  <div style="font-size: 1rem; font-weight: 700; word-break: break-all;">${profile.website ? `<a href="${profile.website}" target="_blank" rel="noopener noreferrer" style="color: #1f2937; text-decoration: underline;">${CompanyPortal.helpers.escapeHtml(profile.website)}</a>` : "-"}</div>
                </div>
              </div>
            </div>

            <!-- Company Information Section -->
            <div>
              <h3 style="margin: 0 0 1.5rem; font-size: 1.2rem; color: #1f2937;">🏢 Company Information</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
                <div style="background: linear-gradient(135deg, #fef9c3 0%, #fde68a 100%); padding: 1.5rem; border-radius: 12px; color: #713f12; border: 1px solid #fde68a; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);">
                  <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 0.5rem;">Industry</div>
                  <div style="font-size: 1.3rem; font-weight: 700;">${CompanyPortal.helpers.escapeHtml(profile.industry || "-")}</div>
                </div>
                <div style="background: linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%); padding: 1.5rem; border-radius: 12px; color: #7c2d12; border: 1px solid #fed7aa; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);">
                  <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 0.5rem;">Company Size</div>
                  <div style="font-size: 1.2rem; font-weight: 700;">${CompanyPortal.helpers.escapeHtml(profile.companySize || "-")}</div>
                </div>
                <div style="background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); padding: 1.5rem; border-radius: 12px; color: #1e1b4b; border: 1px solid #c7d2fe; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);">
                  <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 0.5rem;">Founded Year</div>
                  <div style="font-size: 1.3rem; font-weight: 700;">${CompanyPortal.helpers.escapeHtml(profile.foundedYear || "-")}</div>
                </div>
              </div>
            </div>

            <!-- Description Section -->
            ${profile.description ? `
              <div>
                <h3 style="margin: 0 0 1.5rem; font-size: 1.2rem; color: #1f2937;">📝 Description</h3>
                <div style="background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%); padding: 2rem; border-radius: 12px; color: #1f2937; border: 1px solid #bae6fd; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);">
                  <div style="font-size: 1rem; line-height: 1.6; white-space: pre-wrap;">${CompanyPortal.helpers.escapeHtml(profile.description || "-")}</div>
                </div>
              </div>
            ` : ""}

            <!-- Address Section -->
            ${profile.address ? `
              <div>
                <h3 style="margin: 0 0 1.5rem; font-size: 1.2rem; color: #1f2937;">📍 Address</h3>
                <div style="background: linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%); padding: 2rem; border-radius: 12px; color: #1f2937; border: 1px solid #fecdd3; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);">
                  <div style="font-size: 1rem; line-height: 1.6; white-space: pre-wrap;">${CompanyPortal.helpers.escapeHtml(profile.address || "-")}</div>
                </div>
              </div>
            ` : ""}
          </div>
        `;

        const profileViewDiv = document.getElementById("profileView");
        profileViewDiv.innerHTML = profileViewHTML;
        profileViewDiv.style.display = "block";

        // Populate form fields for editing
        document.getElementById("name").value = profile.name || "";
        document.getElementById("description").value = profile.description || "";
        document.getElementById("industry").value = profile.industry || "";
        document.getElementById("email").value = profile.email || "";
        document.getElementById("phone").value = profile.phone || "";
        document.getElementById("website").value = profile.website || "";
        document.getElementById("foundedYear").value = profile.foundedYear || "";
        document.getElementById("companySize").value = profile.companySize || "";
        document.getElementById("companyType").value = profile.companyType || "";
        document.getElementById("address").value = profile.address || "";

        document.getElementById("profileForm").style.display = "none";
        document.getElementById("editProfileBtn").style.display = "inline-flex";
        document.getElementById("cancelEditBtn").style.display = "none";
      } else {
        // Show form if no profile
        document.getElementById("profileView").style.display = "none";
        document.getElementById("profileForm").style.display = "block";
        document.getElementById("editProfileBtn").style.display = "none";
        document.getElementById("cancelEditBtn").style.display = "none";
      }
    } catch (error) {
      Loading.hide();
      console.error("Failed to load profile:", error);
      // Show form on error
      document.getElementById("profileView").style.display = "none";
      document.getElementById("profileForm").style.display = "block";
      document.getElementById("editProfileBtn").style.display = "none";
      document.getElementById("cancelEditBtn").style.display = "none";
    }
  }

  async function saveProfile(formData) {
    try {
      Loading.show();
      const payload = Object.fromEntries(formData);
      await CompanyPortal.api.profile.update(payload);
      Loading.hide();
      Toast.success("Profile updated successfully!");
      await loadProfile();
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to update profile");
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (!checkAuth()) {
      window.location.href = "/";
      return;
    }

    await CompanyPortal.initShell();
    await loadProfile();

    // Profile form handler
    const profileForm = document.getElementById("profileForm");
    if (profileForm) {
      profileForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(profileForm);
        await saveProfile(formData);
      });
    }

    // Edit/Cancel buttons
    document.getElementById("editProfileBtn").addEventListener("click", () => {
      document.getElementById("profileView").style.display = "none";
      document.getElementById("profileForm").style.display = "block";
      document.getElementById("editProfileBtn").style.display = "none";
      document.getElementById("cancelEditBtn").style.display = "inline-flex";
    });

    document.getElementById("cancelEditBtn").addEventListener("click", () => {
      document.getElementById("profileView").style.display = "block";
      document.getElementById("profileForm").style.display = "none";
      document.getElementById("editProfileBtn").style.display = "inline-flex";
      document.getElementById("cancelEditBtn").style.display = "none";
      loadProfile(); // Reload to reset form
    });
  });
})();

