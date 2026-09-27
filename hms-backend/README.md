# HMS Backend API (Node.js + Express)

Hostel Management System REST API server implementing authentication, room allocation, student records, fee collection, complaints, visitor management, and bulletin notices.

## Available Scripts

- `npm start` or `npm run dev`: Starts the Express API server on `http://localhost:5000`

## Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health and uptime check |
| POST | `/api/auth/login` | Role-based authentication (Admin / Student) |
| GET | `/api/dashboard/stats` | KPI statistics, block occupancy, and charts |
| GET / POST | `/api/students` | List and register students |
| DELETE | `/api/students/:id` | Delete student record |
| GET | `/api/rooms` | List rooms with capacity and amenities |
| POST | `/api/rooms/allocate` | Allocate bed to student |
| GET | `/api/fees` | Get fee records and dues |
| POST | `/api/fees/pay` | Record fee transaction |
| GET / POST | `/api/complaints` | File and query complaints |
| PATCH | `/api/complaints/:id/status` | Update complaint resolution status |
| GET / POST | `/api/visitors` | Visitor log and check-in |
| POST | `/api/visitors/:id/checkout` | Check-out visitor |
| GET / POST | `/api/notices` | Bulletin board announcements |
