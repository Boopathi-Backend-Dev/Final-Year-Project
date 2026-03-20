let extraCourses = [];

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await StudentPortal.initShell();
    bindExtraCourseEvents();
    await loadExtraCourses();
  } catch (error) {
    if (error.message !== "Unauthenticated") {
      Toast.error("Failed to load extra courses");
    }
  }
});

function bindExtraCourseEvents() {
  document.getElementById("addCourseBtn").addEventListener("click", () => openExtraCourseForm());
  document.getElementById("refreshExtraCoursesBtn").addEventListener("click", loadExtraCourses);
  document.getElementById("cancelExtraCourseFormBtn").addEventListener("click", closeExtraCourseForm);
  document.getElementById("extraCourseForm").addEventListener("submit", submitExtraCourseForm);
}

async function loadExtraCourses() {
  try {
    const response = await StudentPortal.api.extraCourses.list();
    extraCourses = StudentPortal.normalizeItems(response);
    renderExtraCourses();
  } catch (error) {
    console.error(error);
    Toast.error(error.message || "Could not load extra courses");
  }
}

function renderExtraCourses() {
  const body = document.getElementById("extraCoursesTableBody");
  const empty = document.getElementById("extraCoursesEmptyState");

  if (!extraCourses.length) {
    body.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");
  body.innerHTML = extraCourses.map((course) => {
    const safeName = StudentPortal.helpers.escapeHtml(course.courseName || "-");
    const safePlatform = StudentPortal.helpers.escapeHtml(course.platform || "-");
    const safeCredits = StudentPortal.helpers.escapeHtml(course.credits ?? 0);
    const safeStatus = StudentPortal.helpers.escapeHtml(StudentPortal.helpers.statusLabel(course.status || "in_progress"));
    const safeGrade = StudentPortal.helpers.escapeHtml(course.grade || "-");
    const safeDate = StudentPortal.helpers.formatDate(course.completionDate);
    const safeCertificateUrl = StudentPortal.helpers.escapeHtml(course.certificateUrl || "");
    const certificateLink = course.certificateUrl
      ? `<a href="${safeCertificateUrl}" target="_blank" rel="noopener">View</a>`
      : "-";

    return `
      <tr>
        <td>${safeName}</td>
        <td>${safePlatform}</td>
        <td>${safeCredits}</td>
        <td>${safeStatus}</td>
        <td>${safeGrade}</td>
        <td>${safeDate}</td>
        <td>${certificateLink}</td>
        <td>
          <div class="toolbar">
            <button class="btn btn-outline btn-sm" type="button" onclick="editExtraCourse(${course.id})">Edit</button>
            <button class="btn btn-danger btn-sm" type="button" onclick="deleteExtraCourse(${course.id})">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function openExtraCourseForm(course = null) {
  const card = document.getElementById("extraCourseFormCard");
  const formTitle = document.getElementById("extraCourseFormTitle");

  card.classList.remove("hidden");
  formTitle.textContent = course ? "Edit Course" : "Add Course";

  document.getElementById("extraCourseId").value = course?.id || "";
  document.getElementById("courseName").value = course?.courseName || "";
  document.getElementById("platform").value = course?.platform || "";
  document.getElementById("credits").value = course?.credits ?? 0;
  document.getElementById("status").value = course?.status || "in_progress";
  document.getElementById("grade").value = course?.grade || "";
  document.getElementById("completionDate").value = normalizeDateInput(course?.completionDate);
  document.getElementById("certificateUrl").value = course?.certificateUrl || "";
  document.getElementById("category").value = course?.category || "";
}

function closeExtraCourseForm() {
  document.getElementById("extraCourseFormCard").classList.add("hidden");
  document.getElementById("extraCourseForm").reset();
  document.getElementById("extraCourseId").value = "";
}

function normalizeDateInput(value) {
  if (!value) return "";
  return String(value).split("T")[0];
}

function readExtraCoursePayload() {
  return {
    courseName: document.getElementById("courseName").value.trim(),
    platform: document.getElementById("platform").value.trim(),
    credits: Number(document.getElementById("credits").value || 0),
    status: document.getElementById("status").value,
    grade: document.getElementById("grade").value.trim(),
    completionDate: document.getElementById("completionDate").value || null,
    certificateUrl: document.getElementById("certificateUrl").value.trim() || null,
    category: document.getElementById("category").value.trim(),
  };
}

async function submitExtraCourseForm(event) {
  event.preventDefault();
  const id = document.getElementById("extraCourseId").value;
  const payload = readExtraCoursePayload();

  if (!payload.courseName) {
    Toast.warning("Course name is required");
    return;
  }

  try {
    if (id) {
      await StudentPortal.api.extraCourses.update(id, payload);
      Toast.success("Course updated");
    } else {
      await StudentPortal.api.extraCourses.create(payload);
      Toast.success("Course added");
    }

    closeExtraCourseForm();
    await loadExtraCourses();
  } catch (error) {
    console.error(error);
    Toast.error(error.message || "Failed to save course");
  }
}

function editExtraCourse(id) {
  const course = extraCourses.find((item) => item.id === id);
  if (!course) {
    Toast.warning("Course not found");
    return;
  }
  openExtraCourseForm(course);
}

async function deleteExtraCourse(id) {
  if (!window.confirm("Delete this course?")) return;

  try {
    await StudentPortal.api.extraCourses.remove(id);
    Toast.success("Course deleted");
    await loadExtraCourses();
  } catch (error) {
    console.error(error);
    Toast.error(error.message || "Failed to delete course");
  }
}
