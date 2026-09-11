/*
  TECH APTI EXPLORE 2.0 Registration Frontend
  2-Step Guided Flow:
  Step 1: Participant Info
  Step 2: Bank UPI QR Payment & Mandatory Screenshot Proof Upload
  Connected to Node.js/Express + MongoDB Atlas Backend
*/

const form = document.getElementById("registrationForm");
const successPanel = document.getElementById("successPanel");
const referenceEl = document.getElementById("registrationReference");
const newRegistrationBtn = document.getElementById("newRegistration");
const formAlert = document.getElementById("formAlert");

// Step elements
const step1Pane = document.getElementById("step1Pane");
const step2Pane = document.getElementById("step2Pane");
const step1Indicator = document.getElementById("step1Indicator");
const step2Indicator = document.getElementById("step2Indicator");
const stepConnector = document.getElementById("stepConnector");
const goToStep2Btn = document.getElementById("goToStep2Btn");
const backToStep1Btn = document.getElementById("backToStep1Btn");
const submitBtn = document.getElementById("submitBtn");

// Form inputs
const regNoInput = document.getElementById("registrationNumber");
const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const departmentInput = document.getElementById("department");
const yearInput = document.getElementById("year");
const paymentRefInput = document.getElementById("paymentRef");
const consentCheck = document.getElementById("consentCheck");

// Screenshot Upload Elements
const screenshotDropzone = document.getElementById("screenshotDropzone");
const screenshotInput = document.getElementById("screenshotInput");
const dropzoneEmpty = document.getElementById("dropzoneEmpty");
const screenshotPreviewCard = document.getElementById("screenshotPreviewCard");
const previewImage = document.getElementById("previewImage");
const previewFileName = document.getElementById("previewFileName");
const previewFileSize = document.getElementById("previewFileSize");
const removeScreenshotBtn = document.getElementById("removeScreenshotBtn");

// Copy UPI Button
const copyUpiBtn = document.getElementById("copyUpiBtn");
const upiIdText = document.getElementById("upiIdText");

// Ticket Elements
const ticketName = document.getElementById("ticketName");
const ticketEmail = document.getElementById("ticketEmail");
const ticketUtr = document.getElementById("ticketUtr");
const ticketQrImage = document.getElementById("ticketQrImage");
const viewFullPassLink = document.getElementById("viewFullPassLink");

// State
let currentScreenshotBase64 = "";

// Helper to show alert in form
function showAlert(message, type = 'error') {
  if (!formAlert) return;
  formAlert.className = `form-alert ${type}`;
  formAlert.textContent = message;
  formAlert.hidden = false;
  formAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearAlert() {
  if (formAlert) {
    formAlert.hidden = true;
    formAlert.textContent = '';
  }
}

// -------------------------------------------------------------
// Step 1 -> Step 2 Validation & Navigation
// -------------------------------------------------------------
function validateStep1() {
  clearAlert();

  const regNo = (regNoInput?.value || "").trim();
  const fullName = (fullNameInput?.value || "").trim();
  const email = (emailInput?.value || "").trim();
  const phone = (phoneInput?.value || "").trim();
  const department = (departmentInput?.value || "").trim();
  const year = (yearInput?.value || "").trim();

  if (!regNo) {
    showAlert("Please enter your Registration Number / Roll No.", "error");
    regNoInput?.focus();
    return false;
  }

  if (!fullName) {
    showAlert("Please enter your Full Name.", "error");
    fullNameInput?.focus();
    return false;
  }

  if (!email || !/^[a-zA-Z0-9._%+-]+@klu\.ac\.in$/i.test(email)) {
    showAlert("Please enter your official university email ending with @klu.ac.in (e.g. 9922004123@klu.ac.in).", "error");
    emailInput?.focus();
    return false;
  }

  if (!phone || !/^[0-9]{10}$/.test(phone)) {
    showAlert("Please enter a valid 10-digit Mobile Number.", "error");
    phoneInput?.focus();
    return false;
  }

  if (!department) {
    showAlert("Please enter your Department (e.g. CSE, IT, ECE).", "error");
    departmentInput?.focus();
    return false;
  }

  if (!year) {
    showAlert("Please select your Year of Study.", "error");
    yearInput?.focus();
    return false;
  }

  return true;
}

goToStep2Btn?.addEventListener("click", () => {
  if (!validateStep1()) return;

  // Move to Step 2
  step1Pane.classList.remove("active");
  step2Pane.classList.add("active");

  step1Indicator.classList.remove("active");
  step1Indicator.classList.add("completed");
  step1Indicator.querySelector(".step-bubble").textContent = "✓";

  step2Indicator.classList.add("active");
  stepConnector.classList.add("completed");

  clearAlert();
  document.getElementById("register").scrollIntoView({ behavior: "smooth", block: "start" });
  paymentRefInput?.focus();
});

backToStep1Btn?.addEventListener("click", () => {
  step2Pane.classList.remove("active");
  step1Pane.classList.add("active");

  step1Indicator.classList.add("active");
  step1Indicator.classList.remove("completed");
  step1Indicator.querySelector(".step-bubble").textContent = "1";

  step2Indicator.classList.remove("active");
  stepConnector.classList.remove("completed");

  clearAlert();
});

// -------------------------------------------------------------
// Copy UPI ID Action
// -------------------------------------------------------------
copyUpiBtn?.addEventListener("click", async () => {
  const upiId = upiIdText ? upiIdText.textContent.trim() : "69097701@ubin";
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(upiId);
    } else {
      const ta = document.createElement("textarea");
      ta.value = upiId;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    const orig = copyUpiBtn.innerHTML;
    copyUpiBtn.innerHTML = "✓ Copied!";
    copyUpiBtn.style.background = "var(--green)";
    copyUpiBtn.style.color = "var(--ink)";
    setTimeout(() => {
      copyUpiBtn.innerHTML = orig;
      copyUpiBtn.style.background = "";
      copyUpiBtn.style.color = "";
    }, 2000);
  } catch (err) {
    console.warn("Clipboard copy failed:", err);
  }
});

// -------------------------------------------------------------
// Screenshot Upload & Client-Side Image Compression to Base64
// -------------------------------------------------------------
screenshotDropzone?.addEventListener("click", () => {
  screenshotInput.click();
});

screenshotDropzone?.addEventListener("dragover", (e) => {
  e.preventDefault();
  screenshotDropzone.classList.add("dragover");
});

screenshotDropzone?.addEventListener("dragleave", () => {
  screenshotDropzone.classList.remove("dragover");
});

screenshotDropzone?.addEventListener("drop", (e) => {
  e.preventDefault();
  screenshotDropzone.classList.remove("dragover");
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    processImageFile(e.dataTransfer.files[0]);
  }
});

screenshotInput?.addEventListener("change", (e) => {
  if (e.target.files && e.target.files.length > 0) {
    processImageFile(e.target.files[0]);
  }
});

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function processImageFile(file) {
  if (!file.type.startsWith("image/")) {
    showAlert("Please upload a valid image file (PNG, JPG, JPEG, WEBP).", "error");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showAlert("Image file size is too large (max 10MB). Please select a smaller screenshot.", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(evt) {
    const rawDataUrl = evt.target.result;
    
    // Compress image using HTML5 Canvas for optimal storage & speed
    compressImage(rawDataUrl, 1200, 0.82, function(compressedBase64) {
      currentScreenshotBase64 = compressedBase64;
      previewImage.src = compressedBase64;
      previewFileName.textContent = file.name;
      previewFileSize.textContent = formatFileSize(Math.round(compressedBase64.length * 0.75));

      screenshotDropzone.hidden = true;
      screenshotPreviewCard.hidden = false;
      clearAlert();
    });
  };
  reader.readAsDataURL(file);
}

function compressImage(base64Str, maxDimension, quality, callback) {
  const img = new Image();
  img.onload = function() {
    let width = img.width;
    let height = img.height;

    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    const compressed = canvas.toDataURL("image/jpeg", quality);
    callback(compressed);
  };
  img.src = base64Str;
}

removeScreenshotBtn?.addEventListener("click", () => {
  currentScreenshotBase64 = "";
  screenshotInput.value = "";
  previewImage.src = "";
  screenshotPreviewCard.hidden = true;
  screenshotDropzone.hidden = false;
});

// -------------------------------------------------------------
// Form Final Submission (Step 1 + Step 2)
// -------------------------------------------------------------
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearAlert();

  // Validate Step 1
  if (!validateStep1()) {
    backToStep1Btn?.click();
    return;
  }

  // Validate Step 2
  const paymentRef = (paymentRefInput?.value || "").trim();
  if (!paymentRef) {
    showAlert("Please enter your 12-Digit Payment UTR Number.", "error");
    paymentRefInput?.focus();
    return;
  }

  if (!currentScreenshotBase64) {
    showAlert("Payment screenshot upload is mandatory. Please attach your payment receipt screenshot.", "error");
    screenshotDropzone?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  if (!consentCheck?.checked) {
    showAlert("Please confirm that you have paid ₹100, entered the correct UTR number, and attached the payment screenshot.", "error");
    consentCheck?.focus();
    return;
  }

  const originalBtnContent = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = "<span>Submitting &amp; Verifying…</span> <span>↻</span>";

  const payload = {
    registrationNumber: (regNoInput.value || "").trim().toUpperCase(),
    fullName: (fullNameInput.value || "").trim(),
    email: (emailInput.value || "").trim().toLowerCase(),
    phone: (phoneInput.value || "").trim(),
    department: (departmentInput.value || "").trim(),
    year: (yearInput.value || "").trim(),
    paymentRef: paymentRef,
    paymentScreenshot: currentScreenshotBase64
  };

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      const errorMsg = result.message || "Failed to submit registration. Please check your details.";
      showAlert(errorMsg, "error");
      return;
    }

    // Success response from MongoDB
    const reg = result.registration;
    referenceEl.textContent = reg.registrationId;

    if (ticketName) ticketName.textContent = reg.fullName;
    if (ticketEmail) ticketEmail.textContent = reg.email;
    if (ticketUtr) ticketUtr.textContent = reg.paymentRef;

    if (ticketQrImage) {
      ticketQrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=4&data=${encodeURIComponent(reg.registrationId)}`;
    }

    if (viewFullPassLink) {
      viewFullPassLink.href = `status.html?id=${encodeURIComponent(reg.registrationId)}`;
    }

    // Transition view to Success Panel
    form.closest(".register-section").hidden = true;
    successPanel.hidden = false;
    successPanel.scrollIntoView({ behavior: "smooth", block: "start" });

  } catch (error) {
    console.error("Submission Error:", error);
    showAlert("Could not connect to backend server. Make sure the Node.js server is running on http://localhost:5000.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnContent;
  }
});

newRegistrationBtn?.addEventListener("click", () => {
  form.reset();
  currentScreenshotBase64 = "";
  if (screenshotPreviewCard) screenshotPreviewCard.hidden = true;
  if (screenshotDropzone) screenshotDropzone.hidden = false;
  clearAlert();

  // Reset to Step 1
  step2Pane.classList.remove("active");
  step1Pane.classList.add("active");
  step1Indicator.classList.add("active");
  step1Indicator.classList.remove("completed");
  step1Indicator.querySelector(".step-bubble").textContent = "1";
  step2Indicator.classList.remove("active");
  stepConnector.classList.remove("completed");

  successPanel.hidden = true;
  form.closest(".register-section").hidden = false;
  document.getElementById("register").scrollIntoView({ behavior: "smooth" });
});

// Check capacity on page load
async function checkCapacity() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    if (data.success && data.stats && data.stats.isFull) {
      showAlert(`⚠️ Registration Closed: All ${data.stats.maxLimit || 140} seats have been filled.`, "error");
      if (goToStep2Btn) {
        goToStep2Btn.disabled = true;
        goToStep2Btn.innerHTML = `<span>Registration Closed (${data.stats.total}/${data.stats.maxLimit || 140} Full)</span>`;
      }
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "<span>Registration Closed</span>";
      }
    }
  } catch (e) {
    // Non-blocking
  }
}

document.addEventListener("DOMContentLoaded", checkCapacity);
