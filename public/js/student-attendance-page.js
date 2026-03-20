let attendanceData = null;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await StudentPortal.initShell();
    document.getElementById("refreshAttendanceBtn").addEventListener("click", loadAttendance);
    await loadAttendance();
  } catch (error) {
    if (error.message !== "Unauthenticated") {
      Toast.error("Failed to load attendance page");
    }
  }
});

async function loadAttendance() {
  try {
    attendanceData = await StudentPortal.api.attendance.list();
    renderAttendanceSummary();
    renderInternshipProgress();
    renderAttendanceTable();
  } catch (error) {
    console.error(error);
    Toast.error(error.message || "Failed to load attendance");
  }
}

function renderAttendanceSummary() {
  const summary = attendanceData?.summary || {};
  document.getElementById("attendanceTotal").textContent = String(summary.totalDays || 0);
  document.getElementById("attendancePresent").textContent = String(summary.presentDays || 0);
  document.getElementById("attendancePercent").textContent = `${summary.attendancePercentage || 0}%`;
}

function renderInternshipProgress() {
  const container = document.getElementById("internshipProgressContainer");
  const records = StudentPortal.normalizeItems(attendanceData?.records);

  if (!records.length) {
    container.innerHTML = "<p>No internship progress data yet.</p>";
    return;
  }

  const grouped = records.reduce((acc, record) => {
    const key = record.internshipId;
    if (!acc[key]) {
      acc[key] = {
        internshipTitle: record.internshipTitle || "-",
        companyName: record.companyName || "-",
        total: 0,
        present: 0,
      };
    }
    acc[key].total += 1;
    if (record.present) acc[key].present += 1;
    return acc;
  }, {});

  const cards = Object.values(grouped).map((entry) => {
    const pct = entry.total ? Math.round((entry.present / entry.total) * 100) : 0;
    return `
      <div class="kpi-card">
        <div style="font-weight:700;">${StudentPortal.helpers.escapeHtml(entry.internshipTitle)}</div>
        <div style="font-size:0.88rem; color:#5a677c; margin-bottom:0.4rem;">${StudentPortal.helpers.escapeHtml(entry.companyName)}</div>
        <div style="margin-bottom:0.4rem;">${entry.present}/${entry.total} days present</div>
        <div style="width:100%; height:10px; background:#e2e8f0; border-radius:999px; overflow:hidden;">
          <div style="height:100%; width:${pct}%; background:#0f766e;"></div>
        </div>
        <small>${pct}% progress</small>
      </div>
    `;
  }).join("");

  container.innerHTML = `<div class="split-grid">${cards}</div>`;
}

function renderAttendanceTable() {
  const body = document.getElementById("attendanceTableBody");
  const wrap = document.getElementById("attendanceTableWrap");
  const empty = document.getElementById("attendanceEmptyState");
  const records = StudentPortal.normalizeItems(attendanceData?.records);

  if (!records.length) {
    body.innerHTML = "";
    wrap.classList.add("hidden");
    empty.classList.remove("hidden");
    return;
  }

  wrap.classList.remove("hidden");
  empty.classList.add("hidden");

  body.innerHTML = records.map((record) => {
    const status = record.present ? "Present" : "Absent";
    const badgeClass = record.present ? "status-approved" : "status-rejected";

    return `
      <tr>
        <td>${StudentPortal.helpers.formatDate(record.attendanceDate)}</td>
        <td>${StudentPortal.helpers.escapeHtml(record.internshipTitle || "-")}</td>
        <td>${StudentPortal.helpers.escapeHtml(record.companyName || "-")}</td>
        <td><span class="status-badge ${badgeClass}">${status}</span></td>
        <td>${StudentPortal.helpers.escapeHtml(record.presentedByCompany || "-")}</td>
        <td>${StudentPortal.helpers.escapeHtml(record.notes || "-")}</td>
      </tr>
    `;
  }).join("");
}
