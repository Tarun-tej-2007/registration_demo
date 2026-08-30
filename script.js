/*
  BRAINSTORM registration frontend.

  PRODUCTION:
  1. Create a Google Sheet with columns:
     Timestamp, Registration ID, Full Name, Email, Phone, College,
     Department, Year, Slot, Payment Reference
  2. Create an Apps Script project and paste apps-script.gs into it.
  3. Deploy it as a Web App.
  4. Copy the /exec URL into APPS_SCRIPT_URL below.
*/

const APPS_SCRIPT_URL = ""; // Paste your deployed Apps Script /exec URL here.

const form = document.getElementById("registrationForm");
const successPanel = document.getElementById("successPanel");
const referenceEl = document.getElementById("registrationReference");
const newRegistrationBtn = document.getElementById("newRegistration");

function makeRegistrationId() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `BS-${random}`;
}

function formToObject(formElement) {
  const data = new FormData(formElement);
  return Object.fromEntries(data.entries());
}

async function submitToGoogleSheets(payload) {
  // Google Apps Script web apps accept POST form data.
  const body = new URLSearchParams(payload);
  const response = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body
  });
  if (!response.ok) throw new Error("Registration server returned an error.");
  return response.json().catch(() => ({ ok: true }));
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const submitButton = form.querySelector(".submit-btn");
  const originalText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = "<span>Submitting…</span><span>↻</span>";

  const payload = formToObject(form);
  const registrationId = makeRegistrationId();
  payload.registrationId = registrationId;

  try {
    if (APPS_SCRIPT_URL.trim()) {
      await submitToGoogleSheets(payload);
    } else {
      // Demo mode: keep the registration locally in the browser.
      const saved = JSON.parse(localStorage.getItem("brainstormRegistrations") || "[]");
      saved.push({ ...payload, createdAt: new Date().toISOString() });
      localStorage.setItem("brainstormRegistrations", JSON.stringify(saved));
    }

    referenceEl.textContent = registrationId;
    form.closest(".register-section").hidden = true;
    successPanel.hidden = false;
    successPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    alert("We could not submit the registration. Please check your internet connection or the Apps Script URL.");
    console.error(error);
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = originalText;
  }
});

newRegistrationBtn.addEventListener("click", () => {
  form.reset();
  successPanel.hidden = true;
  form.closest(".register-section").hidden = false;
  document.getElementById("register").scrollIntoView({ behavior: "smooth" });
});
