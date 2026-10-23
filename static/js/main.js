/**
 * main.js — SnapLink URL Shortener
 * Handles: URL shortening form, copy to clipboard,
 *          dashboard table rendering, link deletion, toast notifications.
 */

"use strict";

// ─────────────────────────────────────────────────────────────
// Toast Notification
// ─────────────────────────────────────────────────────────────

/**
 * Show a toast message at the bottom of the screen.
 * @param {string} message - Text to display
 * @param {"success"|"error"|""} type - Visual style
 * @param {number} duration - Time in ms before it hides (default 3000)
 */
function showToast(message, type = "", duration = 3000) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.className = "toast"; // reset classes
  if (type) toast.classList.add(type);

  // Trigger show animation
  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  // Auto-hide
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

// ─────────────────────────────────────────────────────────────
// Home Page — URL Shortening Form
// ─────────────────────────────────────────────────────────────

const shortenBtn       = document.getElementById("shorten-btn");
const urlInput         = document.getElementById("url-input");
const btnText          = document.getElementById("btn-text");
const btnSpinner       = document.getElementById("btn-spinner");
const inputError       = document.getElementById("input-error");
const resultCard       = document.getElementById("result-card");
const shortUrlLink     = document.getElementById("short-url-link");
const originalUrlDisplay = document.getElementById("original-url-display");
const copyBtn          = document.getElementById("copy-btn");
const copyIcon         = document.getElementById("copy-icon");
const shortenAnotherBtn = document.getElementById("shorten-another-btn");

/** Show or hide an inline error message below the input */
function showInputError(message) {
  if (!inputError) return;
  inputError.textContent = message;
  inputError.classList.remove("hidden");
  urlInput.focus();
}

function clearInputError() {
  if (!inputError) return;
  inputError.textContent = "";
  inputError.classList.add("hidden");
}

/** Toggle the button between loading and idle state */
function setLoading(isLoading) {
  if (!shortenBtn) return;
  shortenBtn.disabled = isLoading;
  btnText.classList.toggle("hidden", isLoading);
  btnSpinner.classList.toggle("hidden", !isLoading);
}

/** Display the result card with the new short URL */
function showResult(data) {
  if (!resultCard) return;

  shortUrlLink.href        = data.short_url;
  shortUrlLink.textContent = data.short_url;
  originalUrlDisplay.textContent = data.original_url;

  resultCard.classList.remove("hidden");
  resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/** Validate the URL before sending to the API */
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Main shorten handler — called on button click or Enter key */
async function handleShorten() {
  const rawUrl = urlInput ? urlInput.value.trim() : "";
  clearInputError();

  // Client-side validation
  if (!rawUrl) {
    showInputError("Please enter a URL.");
    return;
  }
  if (!isValidUrl(rawUrl)) {
    showInputError("Please enter a valid URL starting with http:// or https://");
    return;
  }

  setLoading(true);

  try {
    const response = await fetch("/api/shorten", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: rawUrl }),
    });

    const data = await response.json();

    if (!response.ok) {
      showInputError(data.error || "Something went wrong. Please try again.");
      return;
    }

    showResult(data);
    urlInput.value = ""; // clear the input after success

  } catch (err) {
    showInputError("Network error. Please check your connection.");
    console.error("Shorten error:", err);
  } finally {
    setLoading(false);
  }
}

// Attach shorten button click
if (shortenBtn) {
  shortenBtn.addEventListener("click", handleShorten);
}

// Allow pressing Enter in the input field
if (urlInput) {
  urlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleShorten();
  });
}

// ── Copy to Clipboard ──────────────────────────────────────────
if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    const shortUrl = shortUrlLink ? shortUrlLink.href : "";
    if (!shortUrl) return;

    try {
      await navigator.clipboard.writeText(shortUrl);
      copyIcon.textContent = "✅";
      copyBtn.querySelector("span:last-child") &&
        (copyBtn.lastChild.textContent = " Copied!");
      showToast("Short URL copied to clipboard!", "success");

      // Reset after 2 seconds
      setTimeout(() => {
        copyIcon.textContent = "📋";
      }, 2000);

    } catch {
      // Fallback for browsers that block clipboard API
      const tmp = document.createElement("input");
      tmp.value = shortUrl;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand("copy");
      document.body.removeChild(tmp);
      showToast("Short URL copied!", "success");
    }
  });
}

// ── Shorten Another Button ─────────────────────────────────────
if (shortenAnotherBtn) {
  shortenAnotherBtn.addEventListener("click", () => {
    if (resultCard) resultCard.classList.add("hidden");
    if (urlInput)   { urlInput.value = ""; urlInput.focus(); }
    clearInputError();
  });
}

// ─────────────────────────────────────────────────────────────
// Dashboard Page — Load and Render Links
// ─────────────────────────────────────────────────────────────

const loadingState      = document.getElementById("loading-state");
const emptyState        = document.getElementById("empty-state");
const linksTableWrapper = document.getElementById("links-table-wrapper");
const linksTbody        = document.getElementById("links-tbody");
const statTotal         = document.getElementById("stat-total");
const statClicks        = document.getElementById("stat-clicks");
const statTop           = document.getElementById("stat-top");

/** Format a date string into a readable format: "23 Oct 2026" */
function formatDate(dateString) {
  const date = new Date(dateString);
  if (isNaN(date)) return dateString;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Truncate a URL for display in the table */
function truncateUrl(url, maxLength = 55) {
  return url.length > maxLength ? url.substring(0, maxLength) + "…" : url;
}

/** Update the stats bar at the top of the dashboard */
function updateStats(links) {
  if (!statTotal) return;
  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);
  const topLink = links.reduce(
    (top, l) => (l.clicks > (top?.clicks ?? -1) ? l : top),
    null
  );

  statTotal.textContent  = links.length;
  statClicks.textContent = totalClicks;
  statTop.textContent    = topLink ? topLink.clicks : 0;
}

/**
 * Render a single row in the links table.
 * Returns an <tr> element with a delete button wired up.
 */
function createTableRow(link, index) {
  const tr = document.createElement("tr");
  tr.id = `row-${link.id}`;

  tr.innerHTML = `
    <td style="color:var(--clr-text-dim); font-weight:600;">${index + 1}</td>
    <td>
      <a
        href="${link.short_url}"
        target="_blank"
        rel="noopener noreferrer"
        class="table-short-link"
        title="${link.short_url}"
      >/${link.short_code}</a>
    </td>
    <td>
      <a
        href="${link.original_url}"
        target="_blank"
        rel="noopener noreferrer"
        class="table-original-url"
        title="${link.original_url}"
      >${truncateUrl(link.original_url)}</a>
    </td>
    <td>
      <span class="click-badge">🖱 ${link.clicks}</span>
    </td>
    <td>
      <span class="date-text">${formatDate(link.created_at)}</span>
    </td>
    <td>
      <button
        class="btn btn-delete"
        data-id="${link.id}"
        aria-label="Delete link ${link.short_code}"
        id="delete-btn-${link.id}"
      >Delete</button>
    </td>
  `;

  // Wire up delete button
  tr.querySelector(".btn-delete").addEventListener("click", () => {
    deleteLink(link.id, tr);
  });

  return tr;
}

/** Fetch all links from the API and render them */
async function loadDashboard() {
  if (!linksTbody) return; // not on the dashboard page

  try {
    const response = await fetch("/api/links");
    const links    = await response.json();

    // Hide loading spinner
    if (loadingState) loadingState.classList.add("hidden");

    if (!links || links.length === 0) {
      if (emptyState) emptyState.classList.remove("hidden");
      return;
    }

    // Render rows
    linksTbody.innerHTML = "";
    links.forEach((link, index) => {
      linksTbody.appendChild(createTableRow(link, index));
    });

    // Show table
    if (linksTableWrapper) linksTableWrapper.classList.remove("hidden");

    // Update stats bar
    updateStats(links);

  } catch (err) {
    if (loadingState) loadingState.classList.add("hidden");
    if (emptyState)   emptyState.classList.remove("hidden");
    console.error("Dashboard load error:", err);
  }
}

/**
 * Delete a link by ID.
 * Animates the row out before removing it from the DOM.
 */
async function deleteLink(id, rowElement) {
  const btn = document.getElementById(`delete-btn-${id}`);
  if (btn) { btn.disabled = true; btn.textContent = "…"; }

  try {
    const response = await fetch(`/api/links/${id}`, { method: "DELETE" });
    const data     = await response.json();

    if (!response.ok) {
      showToast(data.error || "Could not delete link.", "error");
      if (btn) { btn.disabled = false; btn.textContent = "Delete"; }
      return;
    }

    // Animate row removal
    rowElement.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    rowElement.style.opacity    = "0";
    rowElement.style.transform  = "translateX(-10px)";

    setTimeout(() => {
      rowElement.remove();

      // Check if table is now empty
      const remainingRows = linksTbody.querySelectorAll("tr");
      if (remainingRows.length === 0) {
        if (linksTableWrapper) linksTableWrapper.classList.add("hidden");
        if (emptyState) emptyState.classList.remove("hidden");
        // Reset stats
        if (statTotal)  statTotal.textContent  = "0";
        if (statClicks) statClicks.textContent = "0";
        if (statTop)    statTop.textContent    = "0";
      } else {
        // Renumber the # column
        remainingRows.forEach((row, i) => {
          row.cells[0].textContent = i + 1;
        });
        // Recalculate stats from remaining rows
        const clickBadges = linksTbody.querySelectorAll(".click-badge");
        let total = 0;
        let max   = 0;
        clickBadges.forEach(b => {
          const n = parseInt(b.textContent.replace(/\D/g, ""), 10) || 0;
          total += n;
          if (n > max) max = n;
        });
        if (statTotal)  statTotal.textContent  = remainingRows.length;
        if (statClicks) statClicks.textContent = total;
        if (statTop)    statTop.textContent    = max;
      }
    }, 300);

    showToast("Link deleted successfully.", "success");

  } catch (err) {
    showToast("Network error. Could not delete link.", "error");
    if (btn) { btn.disabled = false; btn.textContent = "Delete"; }
    console.error("Delete error:", err);
  }
}

// ─────────────────────────────────────────────────────────────
// Init — run on page load
// ─────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadDashboard(); // safe to call on every page; exits early if not on dashboard
});
