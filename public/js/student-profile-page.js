let currentProfile = null;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await StudentPortal.initShell();
    bindProfileEvents();
    await loadProfile();
  } catch (error) {
    if (error.message !== "Unauthenticated") {
      Toast.error("Failed to load profile page");
    }
  }
});

function bindProfileEvents() {
  document.getElementById("editProfileBtn").addEventListener("click", () => showEditMode(true));
  document.getElementById("cancelEditProfileBtn").addEventListener("click", () => showEditMode(false));
  document.getElementById("profileForm").addEventListener("submit", submitProfileForm);
}

async function loadProfile() {
  try {
    currentProfile = await StudentPortal.api.profile.get();
    populateProfileView(currentProfile);
    populateProfileForm(currentProfile);
    showEditMode(false);
  } catch (error) {
    console.error(error);
    Toast.warning(error.message || "Profile data not available yet");
    showEditMode(true);
  }
}

function populateProfileView(profile) {
  if (!profile) return;

  const profileViewCard = document.getElementById("profileViewCard");
  profileViewCard.innerHTML = `
    <div style="display: grid; gap: 2rem;">
      <!-- Basic Information Section -->
      <div>
        <h3 style="margin: 0 0 1.5rem; font-size: 1.2rem; color: #1f2937;">👤 Basic Information</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
          <div style="background: linear-gradient(135deg, #f5f3ff 0%, #e0e7ff 100%); padding: 1.5rem; border-radius: 12px; color: #1f2937; border: 1px solid #e2e8f0; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);">
            <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 0.5rem;">Name</div>
            <div style="font-size: 1.3rem; font-weight: 700;">${StudentPortal.helpers.escapeHtml(profile.name || "-")}</div>
          </div>
          <div style="background: linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%); padding: 1.5rem; border-radius: 12px; color: #1f2937; border: 1px solid #fbcfe8; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);">
            <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 0.5rem;">Email</div>
            <div style="font-size: 1rem; font-weight: 700; word-break: break-all;">${StudentPortal.helpers.escapeHtml(profile.email || "-")}</div>
          </div>
          <div style="background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%); padding: 1.5rem; border-radius: 12px; color: #1f2937; border: 1px solid #bae6fd; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);">
            <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 0.5rem;">Register Number</div>
            <div style="font-size: 1.3rem; font-weight: 700;">${StudentPortal.helpers.escapeHtml(profile.registerNumber || "-")}</div>
          </div>
        </div>
      </div>

      <!-- Academic Information Section -->
      <div>
        <h3 style="margin: 0 0 1.5rem; font-size: 1.2rem; color: #1f2937;">🎓 Academic Information</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
          <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 1.5rem; border-radius: 12px; color: #14532d; border: 1px solid #bbf7d0; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);">
            <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 0.5rem;">Department</div>
            <div style="font-size: 1.3rem; font-weight: 700;">${StudentPortal.helpers.escapeHtml(profile.department || "-")}</div>
          </div>
          <div style="background: linear-gradient(135deg, #fef9c3 0%, #fde68a 100%); padding: 1.5rem; border-radius: 12px; color: #713f12; border: 1px solid #fde68a; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);">
            <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 0.5rem;">Year of Study</div>
            <div style="font-size: 1.3rem; font-weight: 700;">${profile.yearOfStudy ? `${profile.yearOfStudy} Year` : "-"}</div>
          </div>
          <div style="background: linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%); padding: 1.5rem; border-radius: 12px; color: #7c2d12; border: 1px solid #fed7aa; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);">
            <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 0.5rem;">CGPA</div>
            <div style="font-size: 1.3rem; font-weight: 700;">${StudentPortal.helpers.escapeHtml(profile.cgpa || "-")}</div>
          </div>
        </div>
      </div>

      <!-- Personal Information Section -->
      <div>
        <h3 style="margin: 0 0 1.5rem; font-size: 1.2rem; color: #1f2937;">👤 Personal Information</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
          <div style="background: linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%); padding: 1.5rem; border-radius: 12px; color: #134e4a; border: 1px solid #99f6e4; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);">
            <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 0.5rem; color: #333;">Phone</div>
            <div style="font-size: 1.2rem; font-weight: 700; color: #333;">${StudentPortal.helpers.escapeHtml(profile.phone || "-")}</div>
          </div>
          <div style="background: linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%); padding: 1.5rem; border-radius: 12px; color: #7f1d1d; border: 1px solid #fecdd3; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);">
            <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 0.5rem;">Gender</div>
            <div style="font-size: 1.2rem; font-weight: 700;">${StudentPortal.helpers.escapeHtml(profile.gender || "-")}</div>
          </div>
          <div style="background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); padding: 1.5rem; border-radius: 12px; color: #1e1b4b; border: 1px solid #c7d2fe; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);">
            <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 0.5rem;">Date of Birth</div>
            <div style="font-size: 1.1rem; font-weight: 700;">${profile.dateOfBirth ? StudentPortal.helpers.formatDate(profile.dateOfBirth) : "-"}</div>
          </div>
        </div>
      </div>

      <!-- Skills Section -->
      ${profile.skills ? `
        <div>
          <h3 style="margin: 0 0 1.5rem; font-size: 1.2rem; color: #1f2937;">💡 Skills</h3>
          <div style="background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%); padding: 2rem; border-radius: 12px; color: #1f2937; border: 1px solid #bae6fd; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);">
            <div style="font-size: 1.1rem; line-height: 1.6;">${StudentPortal.helpers.escapeHtml(profile.skills || "-")}</div>
          </div>
        </div>
      ` : ""}

      <!-- Address Section -->
      ${profile.address ? `
        <div>
          <h3 style="margin: 0 0 1.5rem; font-size: 1.2rem; color: #1f2937;">📍 Address</h3>
          <div style="background: linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%); padding: 2rem; border-radius: 12px; color: #1f2937; border: 1px solid #fecdd3; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);">
            <div style="font-size: 1rem; line-height: 1.6; white-space: pre-wrap;">${StudentPortal.helpers.escapeHtml(profile.address || "-")}</div>
          </div>
        </div>
      ` : ""}

      <!-- Status Section -->
      <div>
        <h3 style="margin: 0 0 1.5rem; font-size: 1.2rem; color: #1f2937;">✅ Status</h3>
        <div style="background: ${profile.approved ? "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)" : "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)"}; padding: 1.5rem; border-radius: 12px; color: #1f2937; border: 1px solid #e2e8f0; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);">
          <div style="font-size: 1.1rem; font-weight: 700;">${profile.approved ? "✅ Approved" : "⏳ Pending Approval"}</div>
        </div>
      </div>

      <!-- Resume Section -->
      ${profile.resumePath ? `
        <div>
          <h3 style="margin: 0 0 1.5rem; font-size: 1.2rem; color: #1f2937;">📄 Resume</h3>
          <a href="${profile.resumePath}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: linear-gradient(135deg, #f5f3ff 0%, #e0e7ff 100%); padding: 1rem 2rem; border-radius: 12px; color: #1f2937; text-decoration: none; font-weight: 700; border: 1px solid #e2e8f0; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08); transition: transform 0.2s;">
            📥 Download Resume
          </a>
        </div>
      ` : ""}
    </div>
  `;
}

function setText(id, value) {
  // This function is no longer used - profile view is now rendered dynamically
}

function populateProfileForm(profile) {
  if (!profile) return;
  document.getElementById("registerNumber").value = profile.registerNumber || "";
  document.getElementById("department").value = profile.department || "";
  document.getElementById("yearOfStudy").value = profile.yearOfStudy || "";
  document.getElementById("phone").value = profile.phone || "";
  document.getElementById("cgpa").value = profile.cgpa || "";
  document.getElementById("gender").value = profile.gender || "";
  document.getElementById("dateOfBirth").value = normalizeDateInput(profile.dateOfBirth);
  document.getElementById("skills").value = profile.skills || "";
  document.getElementById("address").value = profile.address || "";
}

function normalizeDateInput(value) {
  if (!value) return "";
  return String(value).split("T")[0];
}

function showEditMode(edit) {
  document.getElementById("profileViewCard").classList.toggle("hidden", edit);
  document.getElementById("profileForm").classList.toggle("hidden", !edit);
  document.getElementById("editProfileBtn").classList.toggle("hidden", edit);
  document.getElementById("cancelEditProfileBtn").classList.toggle("hidden", !edit);
}

async function submitProfileForm(event) {
  event.preventDefault();
  const form = event.target;
  const payload = new FormData(form);

  try {
    await StudentPortal.api.profile.update(payload);
    Toast.success("Profile updated");
    await loadProfile();
  } catch (error) {
    console.error(error);
    Toast.error(error.message || "Failed to update profile");
  }
}
