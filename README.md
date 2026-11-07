# Osutua Wines and Spirits – Point of Sale (POS) & Inventory System

A production-grade, fast, and resilient Point of Sale and Real-Time Inventory Control system designed for alcoholic beverage retail and wholesale operations in Kenya.

---

## Key Features

- **Granular Role-Based Access Control (RBAC)**:
  - 4 distinct user roles: `Administrator`, `Store Manager`, `Cashier`, `Stock Controller`.
  - 17 permission keys securing Dashboard, pricing modifications, catalog management, purchase approvals, and inventory adjustments.
  - Interactive 1-click Role Testing Simulator in Staff Accounts.
- **Real-Time Inventory Tracking & Stock Depletion**:
  - Automatically calculates physical depletion across single bottles, packs, crates, and cartons.
  - Delivery verification and goods receiving notes (GRN).
- **Automated Low-Stock Email Alerts**:
  - Computed safety thresholds (out-of-stock, critical, low-stock).
  - One-click and automated reorder email dispatches to `shariadoo190@gmail.com`.
  - Audited historical dispatch logs with unique tracking IDs (`EML-xxxxxx`).
- **AI Store & Inventory Co-Pilot**:
  - Powered by Gemini 3.8 Flash via `@google/genai` with Google Search grounding.
  - Real-time stock queries, supplier PO drafting, and margin advisory.
- **Offline & Multi-Till LAN Support**:
  - Queue sales locally when internet drops; automatic LAN sync upon reconnection.
- **Thermal Receipt Printing**:
  - Native 58mm and 80mm ESC/POS formatting with KRA tax compliance.

---

## Quick Start

### 1. Installation
```bash
# Install dependencies
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env and supply GEMINI_API_KEY and ALERT_EMAIL
```

### 3. Start Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your web browser.

### 4. Build for Production
```bash
npm run build
npm start
```

### 5. Detailed Backend Setup
For systemd service, Nginx reverse proxy, Docker containers, multi-till LAN setup, and SMTP configuration, see `BACKEND_SETUP_GUIDE.md`.
