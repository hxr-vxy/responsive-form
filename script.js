const form = document.getElementById("registrationForm");
const successMessage = document.getElementById("successMessage");
const dobInput = document.getElementById("dob");

// Attribute manipulation #1: block future birth dates by setting the "max" attribute to today.
dobInput.setAttribute("max", new Date().toISOString().split("T")[0]);

// ---------- Patterns ----------
const patterns = {
  studentId: /^\d{5}$/,                                   // exactly 5 digits
  fullName: /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]+$/,             // letters, spaces, . ' -
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  phone: /^(09|\+639)\d{9}$/                              // 09XXXXXXXXX or +639XXXXXXXXX
};

// ---------- Helpers ----------
function getEl(key) {
  // Gender and agreement errors highlight their wrapper; other fields highlight the input itself.
  if (key === "gender") return document.getElementById("genderField");
  if (key === "agreement") return document.getElementById("agreementField");
  return document.getElementById(key);
}

function setError(key, message) {
  const el = getEl(key);
  el.classList.add("error");                                    // classList.add()
  document.getElementById(key + "Error").textContent = message;
  if (el.tagName !== "DIV") el.setAttribute("aria-invalid", "true");
}

function clearError(key) {
  const el = getEl(key);
  el.classList.remove("error");                                 // classList.remove()
  document.getElementById(key + "Error").textContent = "";
  if (el.tagName !== "DIV") el.removeAttribute("aria-invalid");
}

function getValue(key) {
  if (key === "gender") {
    const checked = form.querySelector('input[name="gender"]:checked');
    return checked ? checked.value : "";
  }
  if (key === "agreement") return document.getElementById("agreement").checked;
  const el = document.getElementById(key);
  // Passwords are not trimmed so users keep exactly what they typed.
  return key === "password" || key === "confirmPassword" ? el.value : el.value.trim();
}

// ---------- Validators: return an error message, or "" when valid ----------
const validators = {
  studentId(v, el) {
    if (!v) return `${el.dataset.label} is required.`;
    if (!patterns.studentId.test(v)) return `Invalid ${el.dataset.label}. ${el.dataset.hint}`;
    return "";
  },
  fullName(v, el) {
    if (!v) return `${el.dataset.label} is required.`;
    if (v.length < 2 || !patterns.fullName.test(v)) return `Invalid ${el.dataset.label}. ${el.dataset.hint}`;
    return "";
  },
  email(v, el) {
    if (!v) return `${el.dataset.label} is required.`;
    if (!patterns.email.test(v)) return el.dataset.hint;
    return "";
  },
  phone(v, el) {
    if (!v) return `${el.dataset.label} is required.`;
    if (!patterns.phone.test(v)) return `Invalid Philippine number. ${el.dataset.hint}`;
    return "";
  },
  dob(v, el) {
    if (!v) return `${el.dataset.label} is required.`;
    const date = new Date(v);
    if (date > new Date()) return "Date of birth cannot be in the future.";
    if (date.getFullYear() < 1900) return "Please enter a valid date of birth.";
    return "";
  },
  gender(v) {
    return v ? "" : "Please select a gender.";
  },
  program(v) {
    return v ? "" : "Please select a program.";
  },
  yearLevel(v) {
    return v ? "" : "Please select a year level.";
  },
  password(v, el) {
    if (!v) return `${el.dataset.label} is required.`;
    if (v.length < 8 || !/[A-Za-z]/.test(v) || !/\d/.test(v)) return el.dataset.hint;
    return "";
  },
  confirmPassword(v, el) {
    if (!v) return "Please confirm your password.";
    if (v !== getValue("password")) return "Passwords do not match.";
    return "";
  },
  address(v, el) {
    if (!v) return `${el.dataset.label} is required.`;
    if (v.length < 10) return `${el.dataset.label} is too short. ${el.dataset.hint}`;
    return "";
  },
  agreement(v) {
    return v ? "" : "You must agree to the terms before registering.";
  }
};

function validateField(key) {
  const message = validators[key](getValue(key), getEl(key));
  if (message) setError(key, message);
  else clearError(key);
  return !message;
}

// ---------- Submit ----------
form.addEventListener("submit", function (event) {
  event.preventDefault();                  // stop the form from submitting
  successMessage.classList.add("hidden");

  // Remove unnecessary spaces from text fields with trim()
  ["studentId", "fullName", "email", "phone", "address"].forEach(function (key) {
    const input = document.getElementById(key);
    input.value = input.value.trim();
  });

  let isValid = true;
  let firstInvalid = null;

  Object.keys(validators).forEach(function (key) {
    if (!validateField(key)) {
      isValid = false;
      if (!firstInvalid) firstInvalid = key;
    }
  });

  if (!isValid) {
    const target = getEl(firstInvalid);
    (target.tagName === "DIV" ? target.querySelector("input") : target).focus();
    return;
  }

  // All valid: errors were already cleared field by field. Show success.
  successMessage.classList.remove("hidden");
  successMessage.scrollIntoView({ behavior: "smooth", block: "start" });
});

// ---------- Live feedback: remove the error as soon as the input is corrected ----------
function handleEdit(event) {
  const target = event.target;                       // Event object: which field changed?
  const key = target.name;
  if (!key || !validators[key]) return;

  if (getEl(key).classList.contains("error")) validateField(key);

  // If the password changes, re-check the confirmation too.
  if (key === "password" && document.getElementById("confirmPassword").value) {
    validateField("confirmPassword");
  }
}
form.addEventListener("input", handleEdit);
form.addEventListener("change", handleEdit);

// ---------- Show / Hide password (classList.toggle + attribute manipulation) ----------
document.querySelectorAll(".toggle-btn").forEach(function (button) {
  button.addEventListener("click", function () {
    const input = document.getElementById(button.dataset.target);   // data-target via dataset
    const isShowing = button.classList.toggle("active");            // classList.toggle()

    // Attribute manipulation #2: switch the input type so the password becomes readable.
    input.setAttribute("type", isShowing ? "text" : "password");
    button.setAttribute("aria-pressed", String(isShowing));
    button.textContent = isShowing ? "Hide" : "Show";
  });
});

// ---------- Reset ----------
form.addEventListener("reset", function () {
  Object.keys(validators).forEach(clearError);
  successMessage.classList.add("hidden");

  // Return password fields and toggle buttons to their original state.
  document.querySelectorAll(".toggle-btn").forEach(function (button) {
    button.classList.remove("active");
    button.setAttribute("aria-pressed", "false");
    button.textContent = "Show";
    document.getElementById(button.dataset.target).setAttribute("type", "password");
  });
});