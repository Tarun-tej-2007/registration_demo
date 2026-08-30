# BRAINSTORM — CLAIM Group 3 Registration Website

A responsive registration website based on the supplied event poster.

## Included

- `index.html` — complete registration page
- `styles.css` — responsive visual design
- `script.js` — form validation, registration ID generation, submission logic
- `apps-script.gs` — optional Google Sheets backend
- `event-poster.png` — supplied event poster

## Event information used

- Event: CLAIM — Group 3 — BRAINSTORM
- Date: 19 September 2026
- Venue: 9312 A & B
- Fee: ₹100
- Slot 1: 9 AM – 12 PM
- Slot 2: 2 PM – 5 PM
- MCQ areas: Aptitude, Analytical Reasoning, Logical Reasoning

## Run locally

Open `index.html` in a browser.

For a proper local server, use VS Code Live Server or run:

    python -m http.server 8000

Then open:

    http://localhost:8000

## Make registrations actually save

The frontend starts in demo mode and stores registrations in the browser's localStorage.

For real registrations:

1. Create a Google Sheet.
2. Open Extensions → Apps Script.
3. Paste `apps-script.gs`.
4. Deploy it as a Web App.
5. Copy its `/exec` URL.
6. Open `script.js`.
7. Set:

    const APPS_SCRIPT_URL = "YOUR_EXEC_URL";

The backend appends each registration to the `Registrations` sheet.

Google Apps Script can write submitted values into a spreadsheet; the included backend follows that pattern.
