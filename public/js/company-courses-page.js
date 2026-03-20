(async function companyCoursesPage() {
  if (typeof window === "undefined") return;

  function displayCourses(courses) {
    const container = document.getElementById("coursesContainer");
    const coursesList = CompanyPortal.normalizeItems(courses);

    if (!coursesList || coursesList.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📚</div>
          <h3>No courses posted yet</h3>
          <p>Post a course to get started</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Department</th>
              <th>Fees</th>
              <th>Duration</th>
              <th>Mode</th>
              <th>Posted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${coursesList
              .map(
                (course) => `
              <tr>
                <td><strong>${CompanyPortal.helpers.escapeHtml(course.title || "N/A")}</strong></td>
                <td>${CompanyPortal.helpers.escapeHtml(course.department || "-")}</td>
                <td>${course.fees ? "₹" + course.fees : "Free"}</td>
                <td>${CompanyPortal.helpers.escapeHtml(course.duration || "-")}</td>
                <td>${CompanyPortal.helpers.escapeHtml(course.mode || "-")}</td>
                <td>${CompanyPortal.helpers.formatDate(course.createdAt)}</td>
                <td>
                  <a href="/company/applicants.html?type=course&id=${course.id}" class="btn btn-info btn-sm">View Applicants</a>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  async function loadCourses() {
    try {
      Loading.show();
      const courses = await CompanyPortal.api.courses.list();
      Loading.hide();
      displayCourses(courses);
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to load courses");
    }
  }

  async function createCourse(formData) {
    try {
      Loading.show();
      const payload = Object.fromEntries(formData);
      await CompanyPortal.api.courses.create(payload);
      Loading.hide();
      Toast.success("Course posted successfully!");
      document.getElementById("courseForm").reset();
      await loadCourses();
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to post course");
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (!checkAuth()) {
      window.location.href = "/";
      return;
    }

    await CompanyPortal.initShell();
    await loadCourses();

    document.getElementById("refreshCourses").addEventListener("click", loadCourses);

    const courseForm = document.getElementById("courseForm");
    if (courseForm) {
      courseForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(courseForm);
        await createCourse(formData);
      });
    }
  });
})();
