# BRAINSTORM — CLAIM Group 3 Registration Portal

A full-stack event registration and management system for the **BRAINSTORM** competitive MCQ challenge (Aptitude, Analytical Reasoning & Logical Reasoning) powered by **Node.js, Express, and MongoDB Atlas**.

---

## Features

- **Event Landing & Registration (`index.html`)**: Neo-brutalist responsive design with live MongoDB seat availability indicator, form validation, instant `BS-XXXXXX` reference ID generation, and ticket summary receipt.
- **Participant Verification & Ticket Pass (`status.html`)**: Search with Registration ID, Email, or Phone number to view, download, and print official digital event entry passes with simulated barcode stub.
- **Organizer Admin Dashboard (`admin.html`)**:
  - Live metric counters (Total registrations, Slot 1 morning count, Slot 2 afternoon count, Fee collection ₹).
  - Search & multi-parameter filtering (Slot, Year, College, Name, Email, UTR).
  - Real-time MongoDB online status indicator.
  - One-click CSV Export for Excel / Google Sheets.
  - Delete and status update actions.
- **MongoDB Atlas Integration**:
  - Validated schema for participants with unique indexes.
  - Duplicate registration protection (prevents duplicate UTR transaction numbers or duplicate emails).
  - High availability with automatic reconnection logic.

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Verify your `.env` file contains your MongoDB connection string and server port:
```env
PORT=5000
MONGODB_URI=mongodb+srv://taruntej947:qXwyBVdljaYy4Kmq@cluster0.hcdp4.mongodb.net/brainstorm_registrations?retryWrites=true&w=majority&appName=Cluster0
NODE_ENV=development
```

### 3. Start the Full-Stack Server
```bash
# Start server
npm start

# Or with live reload
npm run dev
```

### 4. Access the Web Pages
- **Registration & Landing**: [http://localhost:5000](http://localhost:5000)
- **Find Ticket / Entry Pass**: [http://localhost:5000/status.html](http://localhost:5000/status.html)
- **Admin Dashboard**: [http://localhost:5000/admin.html](http://localhost:5000/admin.html)
- **API Health & DB Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/register` | Register a new participant in MongoDB |
| `GET` | `/api/registrations` | Fetch all registered participants (supports `?search=`, `?slot=`, `?year=`) |
| `GET` | `/api/registration/:id` | Lookup registration by ID (`BS-XXXXXX`), Email, or Phone |
| `GET` | `/api/stats` | Event statistics (total count, slot breakdown, fee revenue) |
| `GET` | `/api/export` | Download complete registrations list as `.csv` file |
| `PATCH`| `/api/registration/:id/status` | Update registration status (`confirmed`, `verified`, `cancelled`) |
| `DELETE`| `/api/registration/:id` | Delete a participant record |
| `GET` | `/api/health` | Server and MongoDB Atlas connection status |
