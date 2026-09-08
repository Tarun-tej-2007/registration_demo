/*
  BRAINSTORM registration frontend.
  Directly connected to Node.js/Express + MongoDB Atlas Backend.
*/

const form = document.getElementById("registrationForm");
const successPanel = document.getElementById("successPanel");
const referenceEl = document.getElementById("registrationReference");
const newRegistrationBtn = document.getElementById("newRegistration");
const formAlert = document.getElementById("formAlert");
const statTotalCount = document.getElementById("statTotalCount");
const liveStatusText = document.getElementById("liveStatusText");

const ticketName = document.getElementById("ticketName");
const ticketEmail = document.getElementById("ticketEmail");
const ticketUtr = document.getElementById("ticketUtr");

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

// Fetch live event stats & DB status on page load
async function fetchLiveStats() {
  try {
    const healthRes = await fetch('/api/health');
    const healthData = await healthRes.json();
    if (liveStatusText && healthData.database && healthData.database.connected) {
      liveStatusText.textContent = "MongoDB Connected • Registrations Live";
    }

    const statsRes = await fetch('/api/stats');
    const statsData = await statsRes.json();
    if (statsData.success && statTotalCount) {
      statTotalCount.textContent = statsData.stats.total;
    }
  } catch (err) {
    console.warn("Backend server or MongoDB health check unreachable:", err);
    if (liveStatusText) {
      liveStatusText.textContent = "Offline Mode • Start server on port 5000";
    }
  }
}

function formToObject(formElement) {
  const data = new FormData(formElement);
  return Object.fromEntries(data.entries());
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearAlert();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const submitButton = form.querySelector(".submit-btn");
  const originalText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = "<span>Registering in MongoDB…</span><span>↻</span>";

  const payload = formToObject(form);

  // Validate phone number format
  if (!/^[0-9]{10}$/.test(payload.phone)) {
    showAlert("Please enter a valid 10-digit mobile number.", "error");
    submitButton.disabled = false;
    submitButton.innerHTML = originalText;
    return;
  }

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

    const ticketQrImage = document.getElementById("ticketQrImage");
    if (ticketQrImage) {
      ticketQrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=4&data=${encodeURIComponent(reg.registrationId)}`;
    }

    const viewFullPassLink = document.getElementById("viewFullPassLink");
    if (viewFullPassLink) {
      viewFullPassLink.href = `status.html?id=${encodeURIComponent(reg.registrationId)}`;
    }

    // Transition view
    form.closest(".register-section").hidden = true;
    successPanel.hidden = false;
    successPanel.scrollIntoView({ behavior: "smooth", block: "start" });

    // Update live counter badge
    fetchLiveStats();

  } catch (error) {
    console.error("Submission Error:", error);
    showAlert("Could not connect to backend server. Make sure the Node.js server is running on http://localhost:5000.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = originalText;
  }
});

newRegistrationBtn?.addEventListener("click", () => {
  form.reset();
  clearAlert();
  successPanel.hidden = true;
  form.closest(".register-section").hidden = false;
  document.getElementById("register").scrollIntoView({ behavior: "smooth" });
});

// Run live stats query on mount
document.addEventListener("DOMContentLoaded", fetchLiveStats);
