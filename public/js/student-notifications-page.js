let notificationRows = [];

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await StudentPortal.initShell();
    bindNotificationEvents();
    await loadNotifications();
  } catch (error) {
    if (error.message !== "Unauthenticated") {
      Toast.error("Failed to load notifications page");
    }
  }
});

function bindNotificationEvents() {
  document.getElementById("refreshNotificationsBtn").addEventListener("click", loadNotifications);
  document.getElementById("markAllReadBtn").addEventListener("click", markAllRead);
}

async function loadNotifications() {
  try {
    const response = await StudentPortal.api.notifications.list();
    notificationRows = StudentPortal.normalizeItems(response);
    renderNotifications();
  } catch (error) {
    console.error(error);
    Toast.error(error.message || "Failed to load notifications");
  }
}

function renderNotifications() {
  const container = document.getElementById("notificationsContainer");
  const empty = document.getElementById("notificationsEmptyState");

  if (!notificationRows.length) {
    container.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");
  container.innerHTML = notificationRows.map((row) => {
    const title = StudentPortal.helpers.escapeHtml(row.title || "Notification");
    const message = StudentPortal.helpers.escapeHtml(row.message || "");
    const date = StudentPortal.helpers.escapeHtml(new Date(row.createdAt).toLocaleString());
    const unread = !row.isRead;
    const notificationId = row.id || row.ID || row.notificationId;

    return `
      <div class="notification-item ${unread ? "unread" : "status-read"}">
        <div style="display:flex; justify-content:space-between; gap:0.6rem; align-items:flex-start;">
          <div style="flex: 1;">
            <div style="font-weight:700; margin-bottom:0.25rem;">${title}</div>
            <div style="font-size:0.9rem;">${message}</div>
            <small style="color:#5a677c;">${date}</small>
          </div>
          <div style="display:flex; gap:0.5rem; flex-shrink:0;">
            ${unread ? `<button class="btn btn-outline btn-sm" type="button" onclick="markNotificationRead(${notificationId})">Mark Read</button>` : ""}
            <button class="btn btn-danger btn-sm" type="button" onclick="deleteNotification(${notificationId})">🗑 Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

async function markNotificationRead(id) {
  try {
    await StudentPortal.api.notifications.markRead(id);
    await loadNotifications();
  } catch (error) {
    console.error(error);
    Toast.error(error.message || "Failed to mark notification");
  }
}

async function markAllRead() {
  try {
    await StudentPortal.api.notifications.markAllRead();
    Toast.success("All notifications marked as read");
    await loadNotifications();
  } catch (error) {
    console.error(error);
    Toast.error(error.message || "Failed to mark all notifications");
  }
}

async function deleteNotification(id) {
  if (!confirm("Are you sure you want to delete this notification?")) return;
  
  try {
    Loading.show();
    console.log("Deleting notification with ID:", id);
    const response = await StudentPortal.api.notifications.delete(id);
    console.log("Delete response:", response);
    Loading.hide();
    Toast.success("Notification deleted successfully");
    await loadNotifications();
  } catch (error) {
    Loading.hide();
    console.error("Delete notification error:", error);
    Toast.error(error.message || "Failed to delete notification");
  }
}

// Expose functions globally for onclick handlers
window.deleteNotification = deleteNotification;
window.markNotificationRead = markNotificationRead;
