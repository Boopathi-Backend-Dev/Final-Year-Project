let wishlistRows = [];

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await StudentPortal.initShell();
    document.getElementById("refreshWishlistBtn").addEventListener("click", loadWishlist);
    await loadWishlist();
  } catch (error) {
    if (error.message !== "Unauthenticated") {
      Toast.error("Failed to load wishlist page");
    }
  }
});

async function loadWishlist() {
  try {
    const response = await StudentPortal.api.wishlist.list();
    wishlistRows = StudentPortal.normalizeItems(response);
    renderWishlist();
  } catch (error) {
    console.error(error);
    Toast.error(error.message || "Could not load wishlist");
  }
}

function renderWishlist() {
  const body = document.getElementById("wishlistTableBody");
  const empty = document.getElementById("wishlistEmptyState");
  const wrap = document.getElementById("wishlistTableWrap");

  if (!wishlistRows.length) {
    body.innerHTML = "";
    wrap.classList.add("hidden");
    empty.classList.remove("hidden");
    return;
  }

  wrap.classList.remove("hidden");
  empty.classList.add("hidden");

  body.innerHTML = wishlistRows.map((row) => `
    <tr>
      <td>${StudentPortal.helpers.escapeHtml(row.title || "-")}</td>
      <td>${StudentPortal.helpers.escapeHtml(row.companyName || "-")}</td>
      <td>${StudentPortal.helpers.escapeHtml(row.department || "-")}</td>
      <td>
        <button class="btn btn-danger btn-sm" type="button" onclick="removeWishlist(${row.courseId})">
          Remove
        </button>
      </td>
    </tr>
  `).join("");
}

async function removeWishlist(courseId) {
  if (!window.confirm("Remove this course from wishlist?")) return;

  try {
    await StudentPortal.api.wishlist.remove(courseId);
    Toast.success("Removed from wishlist");
    await loadWishlist();
  } catch (error) {
    console.error(error);
    Toast.error(error.message || "Failed to remove");
  }
}
