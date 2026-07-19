<div align="center">
  <img src="https://raw.githubusercontent.com/Andrewsscorp/AccountingPRO/main/frontend/public/favicon.svg" width="120" alt="AccountingPRO Logo" />
  
  # AccountingPRO 🚀
  
  **Next-Generation Multi-Tenant Accounting & Financial Management System**

  <p align="center">
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
    <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" />
    <img src="https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white" />
  </p>
  
  *AccountingPRO is designed to provide unprecedented isolation, security, and performance for multi-company financial operations. A true SaaS architecture right out of the box.*
</div>

---

## 🌟 Key Features

### 🏢 True Multi-Tenant Architecture
Instead of mixing all data in a single database and relying on `tenant_id` columns (which poses a security risk), AccountingPRO utilizes a **Multi-Database Tenant Architecture**. 
- A **Global Database** manages companies, master access, and subscriptions.
- Each created company automatically gets its own **isolated SQLite database** (`EMP00000X.db`). 
- 100% data separation. No cross-contamination. Lightning-fast localized queries.

### 📊 Comprehensive Accounting Module
- **Chart of Accounts (PUC):** Dynamic and fully hierarchical (Class, Group, Account, Subaccount, Auxiliary).
- **Cost Centers:** Multi-level cost center structures to track profitability accurately.
- **Third Parties (Terceros):** Complete management of customers, suppliers, and employees.
- **Document Types Configuration:** Customizable accounting documents with their own numbering rules (Automatic vs. Manual, prefixes, lengths).

### ⚡ Smart Capture & Validation
- **Smart Consecutive System:** Intelligent anti-collision system. If a requested automatic number is already in use (due to imports or manual overrides), the engine automatically scans and safely assigns the next available consecutive, alerting the user gracefully.
- **Strict Double-Entry Accounting:** It is physically impossible to save an unbalanced entry. The system enforces strict mathematical balancing in real-time.

### 🚀 Massive Excel Importation Engine
A state-of-the-art 5-step wizard for massive data ingestion:
1. **Upload:** Drag & drop large Excel files.
2. **Sheet Selection:** Choose which sheet to process.
3. **Smart Mapping:** Dynamically map Excel columns to database fields.
4. **Strict Preview & Validation:** The system pre-processes the data without saving it. It highlights missing accounts, unregistered third parties, unbalanced entries, or duplicate documents in a beautiful color-coded grid.
5. **Safe Import:** Transactional commit. It either saves 100% flawlessly or rolls back safely.

### 📄 Professional PDF Engine
- On-the-fly, high-quality PDF generation for Accounting Receipts and Movements.
- Uses strict HTML-to-PDF layouting for pixel-perfect printing.

---

## 🛠️ Tech Stack

### Frontend 🎨
- **Framework:** React 18 + Vite
- **Language:** TypeScript
- **UI Library:** Mantine UI (Modern, accessible, and stunning components)
- **Icons:** Tabler Icons
- **Routing:** React Router v6
- **State Management:** React Hooks + Context

### Backend ⚙️
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **ORM:** Prisma (Dual schema setup: Global Schema + Tenant Schema)
- **Database:** SQLite (Multiple dynamic instances)
- **File Handling:** Multer + XLSX for Excel processing
- **PDF Generation:** Puppeteer / HTML-PDF tools

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)

### 1. Clone the repository
```bash
git clone https://github.com/Andrewsscorp/AccountingPRO.git
cd AccountingPRO
```

### 2. Setup the Backend
```bash
cd backend
npm install
npm run dev
```
*(The backend runs by default on `http://localhost:3000`)*

### 3. Setup the Frontend
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*(The frontend runs by default on `http://localhost:5173` or `5174`)*

### 4. Login (Dev Mode)
Since the app is currently in MVP/Development phase, the login screen acts as a mockup. You can leave the credentials blank and just hit **Login** to enter the Dashboard.

---

## 📂 Project Structure

```text
AccountingPRO/
├── backend/                  # Node.js + Express API
│   ├── prisma/               # Database Schemas & SQLite DBs
│   │   ├── global.schema.prisma  # Global config & tenant directory
│   │   └── tenant.schema.prisma  # Actual accounting structure per company
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   ├── routes/           # API Endpoints
│   │   └── services/         # Business logic (Import, PDF, etc.)
│   └── uploads/              # Temporary Excel and PDF storage
│
└── frontend/                 # React + Vite Application
    ├── public/               # Static assets
    └── src/
        ├── components/       # Reusable UI components & Modals
        ├── pages/            # Application views (Dashboard, Capture, Config)
        └── utils/            # Helpers & formatters
```

---

## 🛡️ Security & Scalability Note
This project is built from the ground up to support horizontal scaling. Because databases are cleanly separated per tenant at the file level (SQLite) or connection level, migrating a heavy-traffic company to its own dedicated PostgreSQL instance in the future requires almost zero code refactoring.

---
<div align="center">
  <i>Built with passion for next-gen financial software.</i> 💡
</div>
