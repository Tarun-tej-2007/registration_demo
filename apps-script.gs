/*
  Google Apps Script backend for BRAINSTORM registration.

  SETUP
  -----
  1. Create a Google Sheet.
  2. Open Extensions -> Apps Script.
  3. Replace the default code with this file.
  4. Set SHEET_NAME if your sheet tab has a different name.
  5. Deploy -> New deployment -> Web app.
     Execute as: Me
     Who has access: Anyone
  6. Copy the /exec URL and paste it into APPS_SCRIPT_URL in script.js.

  The sheet will automatically receive one row per registration.
*/

const SHEET_NAME = "Registrations";

function setup() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)
    || SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Timestamp",
      "Registration ID",
      "Full Name",
      "Email",
      "Phone",
      "College",
      "Department",
      "Year",
      "Slot",
      "Payment Reference"
    ]);
  }
}

function doPost(e) {
  try {
    setup();

    const p = e.parameter || {};
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    sheet.appendRow([
      new Date(),
      p.registrationId || "",
      p.fullName || "",
      p.email || "",
      p.phone || "",
      p.college || "",
      p.department || "",
      p.year || "",
      p.slot || "",
      p.paymentRef || ""
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, registrationId: p.registrationId || "" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: "BRAINSTORM registration" }))
    .setMimeType(ContentService.MimeType.JSON);
}
