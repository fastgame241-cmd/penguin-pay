const TOKEN_KEY = "pp_admin_token";
const loginView = document.getElementById("loginView");
const dashboardView = document.getElementById("dashboardView");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminPassword = document.getElementById("adminPassword");
const loginStatus = document.getElementById("loginStatus");
const dashStatus = document.getElementById("dashStatus");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userBody = document.getElementById("userBody");
const verifyBody = document.getElementById("verifyBody");

const PROBLEM_LABELS = {
  "id-auto-logout": "Id auto Logout",
  "slow-sell": "Slow sell",
  "quote-not-added": "Quote not added",
  "verify-account": "Verify Account",
};

const EXPERIENCE_LABELS = {
  beginner: "Beginner (0–1 years)",
  intermediate: "Intermediate (1–3 years)",
  experienced: "Experienced (3–5 years)",
  expert: "Expert (5+ years)",
};

function setStatus(el, message, type) {
  if (!message) {
    el.classList.add("hidden");
    el.textContent = "";
    return;
  }
  el.textContent = message;
  el.classList.remove("hidden", "error", "info");
  el.classList.add(type);
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[char]);
}

function showDashboard() {
  loginView.classList.add("hidden");
  dashboardView.classList.remove("hidden");
}

function showLogin() {
  dashboardView.classList.add("hidden");
  loginView.classList.remove("hidden");
}

async function loadRecords(token) {
  setStatus(dashStatus, "Loading records...", "info");
  const res = await fetch("/.netlify/functions/admin-records", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    showLogin();
    setStatus(loginStatus, "Session expired. Sign in again.", "error");
    return;
  }
  if (!res.ok) {
    setStatus(dashStatus, data.error || "Could not load records", "error");
    return;
  }

  userBody.innerHTML = data.users.length
    ? data.users
        .map(
          (u) => `<tr>
            <td>${u.id}</td>
            <td>${escapeHtml(u.phone)}</td>
            <td class="secure-value">Secured (hidden)</td>
            <td>${formatDate(u.created_at)}</td>
            <td><button type="button" class="btn-delete" data-type="user" data-id="${u.id}">Delete</button></td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="5">No users yet</td></tr>`;

  verifyBody.innerHTML = data.verifications.length
    ? data.verifications
        .map(
          (v) => `<tr>
            <td>${v.id}</td>
            <td>${escapeHtml(v.phone)}</td>
            <td>${escapeHtml(v.full_name)}</td>
            <td>${escapeHtml(PROBLEM_LABELS[v.problem] || v.problem)}</td>
            <td class="secure-value">Secured (hidden)</td>
            <td>${escapeHtml(EXPERIENCE_LABELS[v.experience] || v.experience)}</td>
            <td>${formatDate(v.created_at)}</td>
            <td><button type="button" class="btn-delete" data-type="verification" data-id="${v.id}">Delete</button></td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="8">No verifications yet</td></tr>`;

  setStatus(dashStatus, "", "info");
}

async function deleteRecord(type, id) {
  const label = type === "user" ? "user and that user's verification records" : "verification";
  if (!window.confirm(`Delete this ${label}? This cannot be undone.`)) return;

  const token = localStorage.getItem(TOKEN_KEY);
  setStatus(dashStatus, "Deleting record...", "info");
  try {
    const res = await fetch("/.netlify/functions/admin-delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type, id: Number(id) }),
    });
    const data = await res.json();
    if (res.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      showLogin();
      setStatus(loginStatus, "Session expired. Sign in again.", "error");
      return;
    }
    if (!res.ok) throw new Error(data.error || "Could not delete record");
    await loadRecords(token);
  } catch (err) {
    setStatus(dashStatus, err.message || "Could not delete record", "error");
  }
}

dashboardView.addEventListener("click", (event) => {
  const button = event.target.closest(".btn-delete");
  if (button) deleteRecord(button.dataset.type, button.dataset.id);
});

adminLoginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginBtn.disabled = true;
  setStatus(loginStatus, "Signing in...", "info");
  try {
    const res = await fetch("/.netlify/functions/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: adminPassword.value }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(loginStatus, data.error || "Login failed", "error");
      loginBtn.disabled = false;
      return;
    }
    localStorage.setItem(TOKEN_KEY, data.token);
    showDashboard();
    await loadRecords(data.token);
  } catch {
    setStatus(loginStatus, "Network error. Deploy on Netlify first.", "error");
  }
  loginBtn.disabled = false;
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(TOKEN_KEY);
  showLogin();
});

const existing = localStorage.getItem(TOKEN_KEY);
if (existing) {
  showDashboard();
  loadRecords(existing);
}
