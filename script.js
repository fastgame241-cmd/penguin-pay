const form = document.getElementById("loginForm");
const phoneInput = document.getElementById("phone");
const passwordInput = document.getElementById("password");
const phoneError = document.getElementById("phoneError");
const passwordError = document.getElementById("passwordError");
const formStatus = document.getElementById("formStatus");
const submitBtn = document.getElementById("submitBtn");
const toggleBtn = document.querySelector(".toggle-password");
const eyeIcon = toggleBtn.querySelector(".icon-eye");
const eyeOffIcon = toggleBtn.querySelector(".icon-eye-off");

function showError(input, errorEl, message) {
  input.classList.add("input-invalid");
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}

function clearError(input, errorEl) {
  input.classList.remove("input-invalid");
  errorEl.classList.add("hidden");
}

function setStatus(message, type) {
  if (!message) {
    formStatus.classList.add("hidden");
    formStatus.textContent = "";
    return;
  }
  formStatus.textContent = message;
  formStatus.classList.remove("hidden", "error", "info");
  formStatus.classList.add(type);
}

function isValidPhone(phone) {
  return /^[0-9]{10}$/.test(phone);
}

function isValidPassword(password) {
  return password.length >= 6;
}

phoneInput.addEventListener("input", () => {
  phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
  if (isValidPhone(phoneInput.value)) {
    clearError(phoneInput, phoneError);
  }
});

passwordInput.addEventListener("input", () => {
  if (isValidPassword(passwordInput.value)) {
    clearError(passwordInput, passwordError);
  }
});

toggleBtn.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  eyeIcon.classList.toggle("hidden", !isPassword);
  eyeOffIcon.classList.toggle("hidden", isPassword);
  toggleBtn.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const phone = phoneInput.value.trim();
  const password = passwordInput.value;
  let isValid = true;

  if (!isValidPhone(phone)) {
    showError(phoneInput, phoneError, "Phone number must be exactly 10 digits");
    isValid = false;
  } else {
    clearError(phoneInput, phoneError);
  }

  if (!isValidPassword(password)) {
    showError(passwordInput, passwordError, "Password must be at least 6 characters");
    isValid = false;
  } else {
    clearError(passwordInput, passwordError);
  }

  if (!isValid) return;

  submitBtn.disabled = true;
  setStatus("Signing in...", "info");

  try {
    const res = await fetch("/.netlify/functions/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || "Sign in failed", "error");
      submitBtn.disabled = false;
      return;
    }
    sessionStorage.setItem("pp_phone", data.phone);
    window.location.href = "verification.html";
  } catch {
    setStatus("Network error. Is the app running on Netlify?", "error");
    submitBtn.disabled = false;
  }
});
