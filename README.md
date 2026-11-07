# 🍷 OSUTUA WINES AND SPIRITS – Point of Sale & Inventory System

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x%20%7C%207.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4.x-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

A production-grade, offline-first Point of Sale (POS) and Real-Time Inventory Control system built specifically for alcoholic beverage retail and wholesale businesses in Kenya (wines, whiskies, spirits, ciders, craft beers, and kegs).

---

## 🌟 Core Modules & Architecture

```
┌─────────────────────────────────────────────────────────────┐
│             OSUTUA WINES & SPIRITS FRONTEND SPA             │
│   React 19 · Tailwind CSS v4 · Lucide Icons · IndexedDB     │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
        REST / LAN Sync                 Direct Printer
               ▼                               ▼
┌──────────────────────────────┐    ┌─────────────────────────┐
│     EXPRESS BACKEND NODE     │    │  ESC/POS Thermal Driver │
│ • Multi-Till LAN Sync Broker │    │  • 58mm & 80mm Receipts │
│ • Auto Email Alert Service   │    │  • KRA Tax QR & VAT     │
│ • Gemini Store AI Co-Pilot   │    └─────────────────────────┘
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│  Automated Reorder Alerts    │
│  shariadoo190@gmail.com      │
└──────────────────────────────┘
```

1. **Point of Sale (POS)**: Rapid barcode scanning, packaging unit selector (crates, cartons, packs, single bottles), split payments (Cash, M-Pesa, Bank, Credit), receipt generator.
2. **Real-Time Inventory Engine**: Continuous stock level depletion, damage/breakage logs, and physical reconciliation audits.
3. **Automated Stock Alerts**: Out-of-stock and safety threshold engine with automated email dispatch to `shariadoo190@gmail.com`.
4. **Role-Based Access Control (RBAC)**: 4 user tiers (`Administrator`, `Store Manager`, `Cashier`, `Stock Controller`) securing 17 granular permission keys.
5. **AI Store Co-Pilot**: Integrated Gemini 3.8 Flash assistance for supplier requisitions, tax calculations (16% VAT), and liquor licensing guidance.
6. **Multi-Till Offline LAN**: Till terminals continue selling without internet connectivity and automatically sync when connection returns.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: `v20.x` or `v22.x LTS` ([Download Node.js](https://nodejs.org/))
- **npm**: `v10+`

### 2. Clone & Install
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/osutua-pos-system.git
cd osutua-pos-system

# Install dependencies (use --legacy-peer-deps if npm flags peer checks)
npm install --legacy-peer-deps
```

### 3. Environment Configuration
```bash
# Windows Command Prompt
copy .env.example .env

# Windows PowerShell
Copy-Item .env.example .env

# Mac / Linux
cp .env.example .env
```

Open `.env` and configure your settings:
```ini
PORT=3000
NODE_ENV=development
ALERT_EMAIL_RECIPIENT="shariadoo190@gmail.com"
GEMINI_API_KEY="your-gemini-api-key"
```

### 4. Launch the Application
```bash
# Start full-stack Node + Vite dev server
npm run dev

# Or launch frontend UI directly:
npm run dev:ui
```

Open your browser to: **`http://localhost:3000`**

---

## 👥 Default Staff Accounts & Testing PINs

| Role | Staff Name | Default PIN | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | Daniel Kiprono | **`1234`** | Full access to all business modules, financial reports, user management, and pricing. |
| **Store Manager** | Sarah Wanjiku | **`2345`** | P&L analytics, inventory adjustments, purchase approvals, shift oversight. |
| **Cashier** | Brian Otieno | **`1111`** | Counter sales processing, receipt printing, customer payments, cash drawer management. |
| **Stock Controller**| Mercy Chebet | **`3456`** | Goods receiving notes (GRN), warehouse stock counts, physical adjustments (pricing locked). |

---

## 🚢 Production Deployment

### Option A: Docker Compose (1-Click)
```bash
docker compose up -d --build
```

### Option B: PM2 Process Manager
```bash
npm run build
npm install -g pm2
pm2 start server.ts --name "osutua-pos" --interpreter tsx
pm2 save
pm2 startup
```

### Option C: Linux Systemd & Nginx
See the exhaustive **`BACKEND_SETUP_GUIDE.md`** file included in the root directory for full systemd service definitions, Nginx reverse proxy configs with SSL, and thermal receipt hardware setup.

---

## 📦 Publishing to GitHub

To push this repository to GitHub:

```bash
# 1. Initialize git
git init

# 2. Add files and make initial commit
git add .
git commit -m "Initial commit: OSUTUA Wines and Spirits POS system v1.0.0"

# 3. Rename branch to main
git branch -M main

# 4. Link your remote GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

---

## 📄 License
This project is licensed under the Apache License 2.0.
