# OSUTUA WINES AND SPIRITS – POS & INVENTORY SYSTEM
## BACKEND ARCHITECTURE & PRODUCTION DEPLOYMENT GUIDE

This document provides complete instructions for configuring, deploying, and maintaining the backend server for **OSUTUA WINES AND SPIRITS POS**.

---

### TABLE OF CONTENTS
1. [System Overview & Architecture](#1-system-overview--architecture)
2. [Prerequisites & System Requirements](#2-prerequisites--system-requirements)
3. [Environment Configuration (`.env`)](#3-environment-configuration-env)
4. [Local & LAN Development Setup](#4-local--lan-development-setup)
5. [Multi-Terminal LAN Setup (Counter Tills)](#5-multi-terminal-lan-setup-counter-tills)
6. [Production Deployment Options](#6-production-deployment-options)
   - Option A: Linux Systemd & Nginx (Ubuntu/Debian)
   - Option B: PM2 Process Manager
   - Option C: Docker & Docker Compose
   - Option D: Cloud Run / VPS / DigitalOcean
7. [Automated Low-Stock Email Dispatcher Setup](#7-automated-low-stock-email-dispatcher-setup)
8. [Database & Persistence Upgrades](#8-database--persistence-upgrades)
9. [Thermal Receipt Printing & Hardware Integration](#9-thermal-receipt-printing--hardware-integration)
10. [Role-Based Access Control (RBAC) Maintenance](#10-role-based-access-control-rbac-maintenance)
11. [Troubleshooting & Health Diagnostics](#11-troubleshooting--health-diagnostics)

---

### 1. SYSTEM OVERVIEW & ARCHITECTURE

The application uses an integrated full-stack Node.js + Express + Vite + React architecture:
- **Frontend SPA**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, tabular figures for currency accounting.
- **Backend API**: Express server (`server.ts`) hosting REST endpoints, LAN sync broker, email notification dispatchers, and Google Gemini 3.8 Flash AI store co-pilot.
- **Client Cache & Offline State**: Web Storage API + in-memory store ensuring sales continue offline when network or power is disrupted.
- **Security**: Granular 4-Tier Role-Based Access Control (RBAC):
  - `admin`: Full business oversight, master settings, user management, and pricing.
  - `manager`: P&L analytics, inventory adjustments, purchase approvals, and pricing control.
  - `stock_controller`: Warehouse inventory, physical stock count sheets, purchase requisitions, and goods receiving (pricing locked).
  - `cashier`: Dedicated counter checkout, barcode scanning, shifts, and customer receipts.

---

### 2. PREREQUISITES & SYSTEM REQUIREMENTS

#### Minimum Server Requirements:
- **Operating System**: Linux (Ubuntu 22.04 LTS / Debian 12 recommended), macOS, or Windows 10/11 with WSL2.
- **Node.js**: Version `20.x` or `22.x` (LTS recommended).
- **Package Manager**: `npm` (v10+), `yarn`, or `pnpm`.
- **Hardware**:
  - Main Till / Local Server: 4GB RAM minimum (8GB recommended), Dual-core 2.0GHz CPU, 20GB free storage.
  - Client Tills / Tablets: Any modern Chromium-based browser (Google Chrome, Edge, Safari).

Check your installed versions:
```bash
node -v    # Must be v20.x.x or higher
npm -v     # Must be v10.x.x or higher
```

---

### 3. ENVIRONMENT CONFIGURATION (`.env`)

In the project root, duplicate `.env.example` to create your active `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your environment values:

```env
# SERVER PORT
PORT=3000

# NODE ENVIRONMENT ('development' or 'production')
NODE_ENV=production

# APPLICATION PUBLIC HOST URL (used for QR codes, links, LAN sync)
APP_URL=http://localhost:3000

# GEMINI AI API KEY (Obtain free from https://aistudio.google.com/)
GEMINI_API_KEY=your_actual_gemini_api_key_here

# DEFAULT REORDER ALERT RECIPIENT EMAIL
ALERT_EMAIL=shariadoo190@gmail.com

# OPTIONAL: SMTP EMAIL SERVICE CREDENTIALS (e.g. Gmail App Password, SendGrid, Resend)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_store_email@gmail.com
SMTP_PASS=your_app_specific_password_here
SMTP_FROM="Osutua Wines POS <no-reply@osutua.co.ke>"
```

---

### 4. LOCAL & LAN DEVELOPMENT SETUP

1. **Extract or clone the project repository**:
   ```bash
   unzip osutua-pos-system.zip
   cd osutua-pos-system
   ```

2. **Install all dependencies**:
   ```bash
   npm install
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The application will start on `http://localhost:3000` (or the configured `PORT`).

4. **Verify Health Endpoint**:
   ```bash
   curl http://localhost:3000/api/health
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "service": "Osutua Wines & Spirits LAN Server",
     "timestamp": "2026-11-07T12:00:00.000Z",
     "activeNodes": 1,
     "totalSyncedTransactions": 0,
     "totalAlertEmailsSent": 0
   }
   ```

---

### 5. MULTI-TERMINAL LAN SETUP (COUNTER TILLS)

Osutua Wines and Spirits can run with **one central till server computer** and multiple auxiliary tills (e.g. Cashier Counter 1, Cashier Counter 2, Warehouse Tablet):

1. **Assign a Static Local IP to the Main Server**:
   - On the main till computer (connected via Ethernet to the shop router):
     - Example Static IP: `192.168.1.100`.
2. **Open Port 3000 on the Server Firewall**:
   - On Linux Ubuntu:
     ```bash
     sudo ufw allow 3000/tcp
     ```
   - On Windows:
     Add an inbound rule in Windows Defender Firewall for TCP Port 3000.
3. **Connect Other Tills**:
   - Open Google Chrome on Counter Till 2 or the tablet.
   - Browse to: `http://192.168.1.100:3000`.
   - The auxiliary till connects to the central LAN server, syncs stock levels, and queues transactions offline if the local router momentarily drops.

---

### 6. PRODUCTION DEPLOYMENT OPTIONS

#### OPTION A: Linux Systemd & Nginx (Ubuntu / Debian VPS)

1. **Build the production frontend bundle**:
   ```bash
   npm run build
   ```
   This generates an optimized static bundle in `/dist`.

2. **Create a Systemd Service File**:
   ```bash
   sudo nano /etc/systemd/system/osutua-pos.service
   ```
   Paste the following:
   ```ini
   [Unit]
   Description=Osutua Wines and Spirits POS Service
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/var/www/osutua-pos
   ExecStart=/usr/bin/npm start
   Restart=always
   RestartSec=10
   Environment=NODE_ENV=production
   Environment=PORT=3000
   EnvironmentFile=/var/www/osutua-pos/.env

   [Install]
   WantedBy=multi-user.target
   ```

3. **Start and enable the service**:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable osutua-pos
   sudo systemctl start osutua-pos
   sudo systemctl status osutua-pos
   ```

4. **Configure Nginx Reverse Proxy with SSL**:
   ```bash
   sudo nano /etc/nginx/sites-available/osutua-pos
   ```
   ```nginx
   server {
       listen 80;
       server_name pos.osutuawines.co.ke;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```
   Enable and obtain Let's Encrypt SSL:
   ```bash
   sudo ln -s /etc/nginx/sites-available/osutua-pos /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   sudo certbot --nginx -d pos.osutuawines.co.ke
   ```

---

#### OPTION B: PM2 Process Manager (Recommended for Single Server)

1. **Install PM2 globally**:
   ```bash
   sudo npm install -g pm2
   ```

2. **Start the server with PM2**:
   ```bash
   pm2 start "npm start" --name "osutua-pos"
   ```

3. **Save PM2 process list to start automatically on system reboot**:
   ```bash
   pm2 save
   pm2 startup
   ```

4. **Monitor PM2 logs and metrics**:
   ```bash
   pm2 status
   pm2 logs osutua-pos
   ```

---

#### OPTION C: Docker & Docker Compose

A complete production `Dockerfile` and `docker-compose.yml` are included in the project package.

To build and run:
```bash
docker compose up -d --build
```

To view logs:
```bash
docker compose logs -f
```

To stop:
```bash
docker compose down
```

---

### 7. AUTOMATED LOW-STOCK EMAIL DISPATCHER SETUP

The POS features an automated stock threshold engine that dispatches reorder notices to `shariadoo190@gmail.com` whenever physical stock dips below safety minimums.

#### Built-In Endpoint:
- `POST /api/alerts/send-email`:
  - Request body:
    ```json
    {
      "to": "shariadoo190@gmail.com",
      "subject": "[Osutua POS] Low Stock Alert: Tusker Lager",
      "productName": "Tusker Lager 500ml",
      "sku": "SKU-BEER-001",
      "currentStock": 2,
      "reorderQuantity": 48
    }
    ```
- `GET /api/alerts/emails`:
  - Returns the JSON array of all dispatched alert logs with timestamps and tracking IDs.

#### Integrating Real SMTP via Nodemailer:
If you wish to send emails directly via an external SMTP server (e.g., Gmail, Outlook, SendGrid), install `nodemailer`:
```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```
In `server.ts`, import `nodemailer` and create a transporter:
```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
```

---

### 8. DATABASE & PERSISTENCE UPGRADES

Currently, the POS engine uses:
1. Fast in-memory caching and browser LocalStorage (`src/db/storage.ts`) with automated JSON backups.
2. Synchronized server-side transaction logging in `server.ts` (`/api/sync`).

#### Upgrading to PostgreSQL or SQLite:
If you wish to connect an external SQL database:
1. Install an ORM or client:
   ```bash
   npm install pg drizzle-orm
   # OR for SQLite:
   npm install better-sqlite3
   ```
2. Create tables for `products`, `sales`, `stock_movements`, `purchase_orders`, `goods_receipts`, and `audit_logs`.
3. Point `/api/sync` to execute SQL batch inserts inside a single database transaction.

---

### 9. THERMAL RECEIPT PRINTING & HARDWARE INTEGRATION

The POS supports 58mm and 80mm thermal receipt printers via browser native print dialog or ESC/POS direct USB/Network bridges:

1. **Paper Size Configuration**:
   - In **SettingsView**, toggle receipt width between `58mm` and `80mm`.
   - The styling automatically formats font sizes, tables, and margins to fit ESC/POS thermal paper without horizontal overflow.
2. **Barcode Scanner Setup**:
   - Connect any standard USB or Bluetooth 1D/2D Barcode Scanner in "HID Keyboard Emulation" mode.
   - When scanned, barcodes automatically feed into the search input and append the item to the cart instantly.
3. **Cash Drawer Kickout**:
   - Connect the cash drawer RJ11 cable to the back of your thermal receipt printer.
   - In printer driver properties, set "Open Drawer: Before Printing" or "After Printing".

---

### 10. ROLE-BASED ACCESS CONTROL (RBAC) MAINTENANCE

The system's permissions are centralized in `src/types/index.ts` under `ROLE_PERMISSIONS`:
```typescript
export const ROLE_PERMISSIONS: Record<UserRole, Record<PermissionKey, boolean>> = {
  admin: { ... },
  manager: { ... },
  cashier: { ... },
  stock_controller: { ... },
};
```
Default test credentials:
- **David Lemayian** (Admin): PIN `1234`
- **Faith Wambui** (Store Manager): PIN `2345`
- **Brian Kiprop** (Cashier): PIN `1111`
- **Mercy Achieng** (Stock Controller): PIN `3456`

---

### 11. TROUBLESHOOTING & HEALTH DIAGNOSTICS

| Issue | Cause | Solution |
|---|---|---|
| Port `3000` already in use | Another process is occupying the port | Run `kill -9 $(lsof -t -i:3000)` or change `PORT=3001` in `.env` |
| Low stock alerts not arriving | Missing recipient or network interruption | Verify `ALERT_EMAIL` is set in `.env` and inspect `/api/alerts/emails` |
| Gemini AI 429 Quota limit | API key usage rate reached | The server automatically provides offline store intelligence; upgrade key at `ai.google.dev` |
| Offline till transactions not uploading | Network link to main server disconnected | Click **Offline & LAN Sync** tab and click **Test Central Server Connection** |

---

*Document compiled for Osutua Wines and Spirits Point of Sale System.*
