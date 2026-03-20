(async function staffStudentsPage() {
  if (typeof window === "undefined") return;

  let allStudents = [];
  let filteredStudents = [];
  let currentPage = 1;
  const pageSize = 6;

  function displayStudents(students) {
    const container = document.getElementById("studentsContainer");

    if (!students || students.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">👥</div>
          <h3>No students found</h3>
          <p>No students match the current filter</p>
        </div>
      `;
      return;
    }

    // Group students by department
    const grouped = students.reduce((acc, student) => {
      const dept = student.department || "No Department";
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(student);
      return acc;
    }, {});

    container.innerHTML = Object.keys(grouped)
      .map(
        (dept) => `
      <div class="department-section" style="margin-bottom: 2rem;">
        <h3 class="department-title" style="margin-bottom: 1rem; font-size: 1.1rem; color: var(--dark);">${StaffPortal.helpers.escapeHtml(dept)}</h3>
        <div class="students-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">
          ${grouped[dept]
            .map(
              (student) => `
            <div class="content-card" style="padding: 1rem;">
              <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                ${student.photoPath ? `<img src="${student.photoPath.startsWith('/') ? student.photoPath : '/uploads/' + student.photoPath}" alt="Photo" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">` : '<div style="width: 50px; height: 50px; border-radius: 50%; background: #e5e7eb; display: grid; place-items: center; font-size: 1.5rem;">👤</div>'}
                <div style="flex: 1;">
                  <h4 style="margin: 0; font-size: 1rem;">${StaffPortal.helpers.escapeHtml(student.name || "N/A")}</h4>
                  <span class="status-badge ${student.approved ? "status-approved" : "status-pending"}">
                    ${student.approved ? "Approved" : "Pending"}
                  </span>
                </div>
              </div>
              <div style="font-size: 0.9rem; color: var(--shell-text-muted); margin-bottom: 0.75rem;">
                <div><strong>Register Number:</strong> ${StaffPortal.helpers.escapeHtml(student.registerNumber || "N/A")}</div>
                <div><strong>Year:</strong> ${student.yearOfStudy ? `${student.yearOfStudy} Year` : "N/A"}</div>
                <div><strong>Email:</strong> ${StaffPortal.helpers.escapeHtml(student.email || "N/A")}</div>
                <div><strong>CGPA:</strong> ${StaffPortal.helpers.escapeHtml(student.cgpa || "N/A")}</div>
              </div>
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                ${!student.approved ? `<button class="btn btn-success btn-sm" onclick="approveStudent(${student.id})">✓ Approve</button>` : ""}
                <button class="btn btn-outline btn-sm" onclick="viewStudentDetails(${student.id})">👁 View Details</button>
                <button class="btn btn-danger btn-sm" onclick="deleteStudent(${student.id})">🗑 Delete</button>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `
      )
      .join("");
  }

  function updateCount(filteredCount) {
    const badge = document.getElementById("studentsCount");
    if (!badge) return;
    const total = allStudents.length;
    badge.textContent = `${filteredCount} of ${total} students`;
  }

  function getSearchQuery() {
    const input = document.getElementById("searchStudents");
    return input ? input.value.trim().toLowerCase() : "";
  }

  function matchesSearch(student, query) {
    if (!query) return true;
    const values = [
      student.name,
      student.email,
      student.registerNumber,
      student.department,
      student.yearOfStudy,
      student.cgpa,
    ]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase());
    return values.some((value) => value.includes(query));
  }

  function renderPagination(totalPages) {
    const pagination = document.getElementById("studentsPagination");
    if (!pagination) return;
    if (totalPages <= 1) {
      pagination.innerHTML = "";
      return;
    }

    const maxButtons = 5;
    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1);
    }

    const buttons = [];

    buttons.push(
      `<button type="button" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""}>Prev</button>`
    );

    for (let page = start; page <= end; page += 1) {
      buttons.push(
        `<button type="button" data-page="${page}" class="${page === currentPage ? "is-active" : ""}">${page}</button>`
      );
    }

    buttons.push(
      `<button type="button" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""}>Next</button>`
    );

    pagination.innerHTML = buttons.join("");
    pagination.querySelectorAll("button[data-page]").forEach((button) => {
      button.addEventListener("click", () => {
        const page = Number(button.getAttribute("data-page"));
        if (!page || page < 1 || page > totalPages) return;
        renderPage(page);
      });
    });
  }

  function animateContainer() {
    const container = document.getElementById("studentsContainer");
    if (!container) return;
    container.classList.remove("page-animate");
    void container.offsetWidth;
    container.classList.add("page-animate");
  }

  function renderPage(page = 1) {
    const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
    currentPage = Math.min(Math.max(page, 1), totalPages);

    const start = (currentPage - 1) * pageSize;
    const pageItems = filteredStudents.slice(start, start + pageSize);

    displayStudents(pageItems);
    updateCount(filteredStudents.length);
    renderPagination(totalPages);
    animateContainer();
  }

  function applyFilters() {
    const dept = document.getElementById("filterDept").value;
    const query = getSearchQuery();
    filteredStudents = allStudents.filter((student) => {
      const matchesDept = dept ? student.department === dept : true;
      const matchesQuery = matchesSearch(student, query);
      return matchesDept && matchesQuery;
    });
    renderPage(1);
  }

  async function loadStudents() {
    try {
      Loading.show();
      const students = await StaffPortal.api.students.list();
      Loading.hide();

      allStudents = StaffPortal.normalizeItems(students);
      applyFilters();
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to load students");
    }
  }

  async function approveStudent(id) {
    if (!confirm("Are you sure you want to approve this student?")) return;

    try {
      Loading.show();
      await StaffPortal.api.students.approve(id);
      Loading.hide();
      Toast.success("Student approved successfully!");
      await loadStudents();
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to approve student");
    }
  }

  async function deleteStudent(id) {
    if (!confirm("Are you sure you want to delete this student? This action cannot be undone.")) return;

    try {
      Loading.show();
      await StaffPortal.api.students.delete(id);
      Loading.hide();
      Toast.success("Student deleted successfully!");
      await loadStudents();
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to delete student");
    }
  }

  async function viewStudentDetails(id) {
    try {
      Loading.show();
      const profileData = await StaffPortal.api.students.getProfile(id);
      Loading.hide();
      showStudentProfileModal(profileData);
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to load student profile");
    }
  }

  function showStudentProfileModal(data) {
    const { student, extraCourses, applications } = data;
    const modal = document.getElementById("studentProfileModal");
    const title = document.getElementById("studentProfileTitle");
    const content = document.getElementById("studentProfileContent");

    title.textContent = `${student.name} - Complete Profile`;

    content.innerHTML = `
      <div style="display: grid; gap: 1.5rem;">
        <div class="content-card">
          <h4>📋 Basic Information</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
            <div><strong>Full Name:</strong> ${StaffPortal.helpers.escapeHtml(student.name || "N/A")}</div>
            <div><strong>Email:</strong> ${StaffPortal.helpers.escapeHtml(student.email || "N/A")}</div>
            <div><strong>Register Number:</strong> ${StaffPortal.helpers.escapeHtml(student.registerNumber || "N/A")}</div>
            <div><strong>Department:</strong> ${StaffPortal.helpers.escapeHtml(student.department || "N/A")}</div>
            <div><strong>Year of Study:</strong> ${student.yearOfStudy ? student.yearOfStudy + " Year" : "N/A"}</div>
            <div><strong>CGPA:</strong> ${StaffPortal.helpers.escapeHtml(student.cgpa || "N/A")}</div>
            <div><strong>Phone:</strong> ${StaffPortal.helpers.escapeHtml(student.phone || "N/A")}</div>
            <div><strong>Gender:</strong> ${StaffPortal.helpers.escapeHtml(student.gender || "N/A")}</div>
            <div><strong>Date of Birth:</strong> ${student.dateOfBirth ? StaffPortal.helpers.formatDate(student.dateOfBirth) : "N/A"}</div>
            <div><strong>Joined:</strong> ${StaffPortal.helpers.formatDate(student.joinedDate)}</div>
            <div><strong>Approval Status:</strong> <span class="status-badge ${student.approved ? "status-approved" : "status-pending"}">${student.approved ? "Approved" : "Pending Approval"}</span></div>
            <div><strong>College Code:</strong> ${StaffPortal.helpers.escapeHtml(student.collegeCode || "N/A")}</div>
          </div>
          ${student.skills ? `<div style="margin-top: 1rem;"><strong>Skills:</strong> ${StaffPortal.helpers.escapeHtml(student.skills)}</div>` : ""}
          ${student.address ? `<div style="margin-top: 1rem;"><strong>Address:</strong> ${StaffPortal.helpers.escapeHtml(student.address)}</div>` : ""}
        </div>

        ${extraCourses && extraCourses.length > 0 ? `
          <div class="content-card">
            <h4>📚 Additional Courses & Certifications</h4>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Course Name</th>
                    <th>Platform</th>
                    <th>Category</th>
                    <th>Credits</th>
                    <th>Status</th>
                    <th>Grade</th>
                    <th>Certificate</th>
                    <th>Completion Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${extraCourses
                    .map(
                      (course) => `
                    <tr>
                      <td>${StaffPortal.helpers.escapeHtml(course.courseName)}</td>
                      <td>${StaffPortal.helpers.escapeHtml(course.platform || "-")}</td>
                      <td><span class="status-badge">${StaffPortal.helpers.escapeHtml(course.category || "-")}</span></td>
                      <td>${course.credits || 0}</td>
                      <td><span class="status-badge ${course.status === "completed" ? "status-approved" : "status-pending"}">${course.status === "in_progress" ? "In Progress" : course.status || "In Progress"}</span></td>
                      <td>${StaffPortal.helpers.escapeHtml(course.grade || "-")}</td>
                      <td>${course.certificateUrl ? `<a href="${StaffPortal.helpers.escapeHtml(course.certificateUrl)}" target="_blank" rel="noopener">View</a>` : "-"}</td>
                      <td>${course.completionDate ? StaffPortal.helpers.formatDate(course.completionDate) : "-"}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>
        ` : ""}

        ${applications && applications.length > 0 ? `
          <div class="content-card">
            <h4>📋 Complete Application History</h4>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Opportunity</th>
                    <th>Company</th>
                    <th>Industry</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Applied Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${applications
                    .map(
                      (app) => `
                    <tr>
                      <td><span class="status-badge">${app.targetType === "job" ? "Job" : app.targetType === "course" ? "Course" : "Internship"}</span></td>
                      <td>${StaffPortal.helpers.escapeHtml(app.opportunityTitle || "N/A")}</td>
                      <td>${StaffPortal.helpers.escapeHtml(app.companyName || "N/A")}</td>
                      <td>${StaffPortal.helpers.escapeHtml(app.companyIndustry || "N/A")}</td>
                      <td>${StaffPortal.helpers.escapeHtml(app.opportunityDepartment || "N/A")}</td>
                      <td><span class="status-badge ${StaffPortal.helpers.statusClass(app.status)}">${StaffPortal.helpers.statusLabel(app.status)}</span></td>
                      <td>${StaffPortal.helpers.formatDate(app.createdAt)}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>
        ` : ""}

        <div class="content-card">
          <h4>👨‍💼 Staff Actions</h4>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            ${!student.approved ? `<button class="btn btn-success" onclick="approveStudentFromProfile(${student.id})">✅ Approve Student</button>` : `<span class="status-badge status-approved">✅ Student Already Approved</span>`}
          </div>
        </div>
      </div>
    `;

    modal.style.display = "flex";
  }

  async function approveStudentFromProfile(studentId) {
    if (!confirm("Are you sure you want to approve this student?")) return;

    try {
      Loading.show();
      await StaffPortal.api.students.approve(studentId);
      Loading.hide();
      Toast.success("Student approved successfully!");
      hideStudentProfileModal();
      await loadStudents();
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to approve student");
    }
  }

  function hideStudentProfileModal() {
    document.getElementById("studentProfileModal").style.display = "none";
  }

  async function viewStudentCourses(id) {
    try {
      Loading.show();
      const [student, courseData] = await Promise.all([StaffPortal.api.students.get(id), StaffPortal.api.students.getCourses(id)]);
      Loading.hide();
      displayStudentCourseModal(student, courseData);
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to load student courses");
    }
  }

  function displayStudentCourseModal(student, courseData) {
    const modal = document.getElementById("courseModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("courseModalBody");

    modalTitle.textContent = `${student.name || "Student"} - Course Details`;

    const studentData = courseData.student || {};
    const enrollments = courseData.enrollments || [];

    modalBody.innerHTML = `
      <div class="content-card">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
          <div><strong>Total Credits Earned:</strong> ${studentData.totalCreditsEarned || 0}</div>
          <div><strong>Credits Pending:</strong> ${studentData.creditsPending || 0}</div>
          <div><strong>Completion %:</strong> ${studentData.completionPercentage || 0}%</div>
          <div><strong>Academic Standing:</strong> ${StaffPortal.helpers.escapeHtml(studentData.academicStanding || "Good")}</div>
        </div>
      </div>

      <div class="content-card">
        <h4>Course Enrollments</h4>
        ${enrollments.length === 0 ? "<p>No course enrollments found.</p>" : `
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Category</th>
                  <th>Credits</th>
                  <th>Platform</th>
                  <th>Status</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                ${enrollments
                  .map(
                    (enrollment) => `
                  <tr>
                    <td>${StaffPortal.helpers.escapeHtml(enrollment.title || "N/A")}</td>
                    <td><span class="status-badge">${StaffPortal.helpers.escapeHtml(enrollment.category || "N/A")}</span></td>
                    <td>${enrollment.credits || 0}</td>
                    <td>${StaffPortal.helpers.escapeHtml(enrollment.platform || "N/A")}</td>
                    <td><span class="status-badge ${enrollment.status === "completed" ? "status-approved" : "status-pending"}">${enrollment.status || "enrolled"}</span></td>
                    <td>${enrollment.progress || 0}%</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;

    modal.style.display = "flex";
  }

  async function viewStudentCart(id) {
    try {
      Loading.show();
      const [student, cartData] = await Promise.all([StaffPortal.api.students.get(id), StaffPortal.api.students.getCart(id)]);
      Loading.hide();
      displayStudentCartModal(student, cartData);
    } catch (error) {
      Loading.hide();
      Toast.error(error.message || "Failed to load student cart");
    }
  }

  function displayStudentCartModal(student, cartData) {
    const modal = document.getElementById("courseModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("courseModalBody");

    modalTitle.textContent = `${student.name || "Student"} - Cart Items`;

    const summary = cartData.summary || {};
    const cartItems = cartData.cartItems || [];

    modalBody.innerHTML = `
      <div class="content-card">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div><strong>Total Items in Cart:</strong> ${summary.totalItems || 0}</div>
          <div><strong>Total Credits:</strong> ${summary.totalCredits || 0}</div>
        </div>
      </div>

      <div class="content-card">
        <h4>Cart Items</h4>
        ${cartItems.length === 0 ? "<p>No items in cart.</p>" : `
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Company</th>
                  <th>Category</th>
                  <th>Credits</th>
                  <th>Platform</th>
                  <th>Duration</th>
                  <th>Fees</th>
                  <th>Added On</th>
                </tr>
              </thead>
              <tbody>
                ${cartItems
                  .map(
                    (item) => `
                  <tr>
                    <td>${StaffPortal.helpers.escapeHtml(item.title || "N/A")}</td>
                    <td>${StaffPortal.helpers.escapeHtml(item.companyName || "N/A")}</td>
                    <td><span class="status-badge">${StaffPortal.helpers.escapeHtml(item.category || "N/A")}</span></td>
                    <td>${item.credits || 0}</td>
                    <td>${StaffPortal.helpers.escapeHtml(item.platform || "N/A")}</td>
                    <td>${StaffPortal.helpers.escapeHtml(item.duration || "N/A")}</td>
                    <td>${item.fees ? "₹" + item.fees : "Free"}</td>
                    <td>${StaffPortal.helpers.formatDate(item.addedAt)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;

    modal.style.display = "flex";
  }

  function closeCourseModal() {
    document.getElementById("courseModal").style.display = "none";
  }

  // Expose functions globally
  window.approveStudent = approveStudent;
  window.deleteStudent = deleteStudent;
  window.viewStudentDetails = viewStudentDetails;
  window.viewStudentCourses = viewStudentCourses;
  window.viewStudentCart = viewStudentCart;
  window.approveStudentFromProfile = approveStudentFromProfile;
  window.closeCourseModal = closeCourseModal;

  document.addEventListener("DOMContentLoaded", async () => {
    if (!checkAuth()) {
      window.location.href = "/";
      return;
    }

    await StaffPortal.initShell();
    await loadStudents();

    document.getElementById("refreshStudents").addEventListener("click", loadStudents);
    document.getElementById("filterDept").addEventListener("change", applyFilters);
    const searchInput = document.getElementById("searchStudents");
    if (searchInput) {
      searchInput.addEventListener("input", debounce(applyFilters, 200));
    }
    document.getElementById("closeStudentProfileModal").addEventListener("click", hideStudentProfileModal);
  });
})();
