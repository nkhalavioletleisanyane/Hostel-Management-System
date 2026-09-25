# 🏫 Hostel Management System (HMS)

> A modern, full-stack Web-Based Hostel Management System built according to the **MCA Project Proposal** specification. Features an olive/emerald green dashboard aesthetic inspired by modern enterprise UI designs.

---

## ⚡ Quick Start

To launch both the **Backend API** and **Frontend Web App** with a single command:

```bash
./run.sh
```

### 🛡️ Smart Port Handling
If port `5173` (Frontend) or port `5000` (Backend) is currently busy or locked by a previous process, `run.sh` will **automatically detect and kill the occupying process** before starting fresh instances.

---

## 🌐 Services & URLs

| Service | Technology | URL / Endpoint |
|---|---|---|
| **Frontend** | React 18, TypeScript, Vite, Recharts, Lucide Icons | [http://localhost:5173](http://localhost:5173) |
| **Backend API** | Node.js, Express.js, CORS, RESTful Endpoints | [http://localhost:5001](http://localhost:5001) |
| **API Health** | Express JSON Status | [http://localhost:5001/api/health](http://localhost:5001/api/health) |

---

## 🔑 Demo Access Credentials

| Role | Username / Identifier | Password | Access Rights |
|---|---|---|---|
| **Hostel Administrator** | `violet` (or `admin`) | `violet123` | Full access to Dashboard KPIs, Student Registry, Room Allocation, Fee Collection, Complaints Resolution, Visitors, Notices |
| **Resident Student** | `student` (or `MCA202401`) | `stu123` | Student portal, My Room details, Fee status, File Complaints, View Notices |

---

## 📁 Repository Directory Structure

```text
MCA_Project/
├── run.sh                          # 🚀 Master startup script (kills busy ports & runs full-stack)
├── README.md                       # Project overview and instructions
├── ProjectProposal.md              # Original MCA Project Proposal document
├── 3c3f4393482771bd81100ecbe920deb8.jpg  # UI Design Reference
├── 5a1ab08719a6a6f42414fa1e740187a0d782e790.png  # UI Design Reference
│
├── hms-frontend/                   # 💻 Modern React + TypeScript Web App
│   ├── src/
│   │   ├── components/             # Reusable UI & Layout Components (Sidebar, Navbar, Charts)
│   │   ├── pages/                  # All Pages: Dashboard, Students, Rooms, Fees, Complaints, etc.
│   │   ├── context/                # Authentication & Session Management
│   │   ├── data/                   # Typesafe Mock & Initial Data
│   │   ├── styles/                 # Custom CSS Design System (Olive/Emerald Dark Dashboard)
│   │   ├── types/                  # TypeScript Data Models
│   │   └── App.tsx                 # Route declarations & Protected Routes
│   ├── package.json
│   └── vite.config.ts
│
├── hms-backend/                    # ⚙️ Node.js + Express REST API Server
│   ├── src/
│   │   └── server.js               # Full REST API endpoints (Auth, Students, Rooms, Fees, etc.)
│   ├── .env                        # Environment configuration (Port 5000, DB variables)
│   ├── package.json
│   └── README.md
│
└── legacy-static-prototype/        # 📦 Original Static HTML/CSS/JS prototype
    ├── index.html, login.html...   # Archived static prototype pages
    ├── css/                        # Static CSS files
    ├── js/                         # Static JS scripts
    └── README.md
```

---

## 🛑 Stopping the System

When running `./run.sh`, simply press:
```bash
Ctrl + C
```
The script traps the exit signal, gracefully terminates both backend and frontend background processes, and cleanly frees the ports.
