const TOKEN_KEY = "pp_admin_token";
const loginView = document.getElementById("loginView");
const dashboardView = document.getElementById("dashboardView");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminPassword = document.getElementById("adminPassword");
const loginStatus = document.getElementById("loginStatus");
const dashStatus = document.getElementById("dashStatus");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userCount = document.getElementById("userCount");
const verifyCount = document.getElementById("verifyCount");
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

  userCount.textContent = data.counts.users;
  verifyCount.textContent = data.counts.verifications;

  userBody.innerHTML = data.users.length
    ? data.users
        .map(
          (u) => `<tr>
            <td>${u.id}</td>
            <td>${u.phone}</td>
            <td>${formatDate(u.created_at)}</td>
            <td>${formatDate(u.last_login_at)}</td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="4">No users yet</td></tr>`;

  verifyBody.innerHTML = data.verifications.length
    ? data.verifications
        .map(
          (v) => `<tr>
            <td>${v.id}</td>
            <td>${v.phone}</td>
            <td>${v.full_name}</td>
            <td>${PROBLEM_LABELS[v.problem] || v.problem}</td>
            <td>${EXPERIENCE_LABELS[v.experience] || v.experience}</td>
            <td>${formatDate(v.created_at)}</td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="6">No verifications yet</td></tr>`;

  setStatus(dashStatus, "", "info");
}

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
