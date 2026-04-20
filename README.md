# Leave Management API (MERN Backend)

**Version**: 1.0.0  
A robust, production-ready backend for managing employee leave requests. Built with **Node.js, Express 5, MongoDB (Mongoose 9.x), JWT authentication, and role-based access control**.

**Key Features**:
- Secure JWT authentication with role-based access (`admin` / `employee`)
- Employee leave request creation, viewing, and cancellation
- Full admin dashboard: user management, leave approvals, and soft-delete/restore/trash
- Automatic leave balance deduction on approval
- Strong password policy, input validation (Joi), secure headers (Helmet), and CORS
- Interactive Swagger documentation (YAML-based)
- Soft delete, trash, and restore functionality for both users and leaves (data safety)
- Consistent API response format (`success`, `statusCode`, `message`)
- One-command admin seeding

---

## Features

- **Authentication & Authorization**
  - JWT tokens containing user ID, role, and email
  - Protected routes with custom `authMiddleware` + `roleMiddleware`
  - Login, profile fetch (`/me`), and secure password change

- **User Management (Admin only)**
  - Create new employees or admins
  - Soft delete, restore, and permanent delete employees
  - Default 20-day leave balance on user creation

- **Leave Management**
  - Employees: Create, view own leaves, and cancel **pending** leaves
  - Admins: Approve/reject, move to trash, restore, or permanently delete leaves
  - Accurate leave day calculation (inclusive of start & end dates) via `calculateLeaveDays`
  - Leave balance only deducted on **approved** leaves

- **Security & Best Practices**
  - Password hashing via Mongoose pre-save hook (`bcryptjs`)
  - Strong password validation (uppercase, lowercase, number, special character, min 8 chars)
  - Helmet for secure headers, CORS protection, Joi validation middleware
  - Global error handling middleware

- **Documentation & Developer Experience**
  - Full OpenAPI 3.0 Swagger UI (served from `swagger.yaml` in development)
  - Health check endpoint
  - ESLint + Prettier for code quality

- **Data Safety**
  - Soft delete (`isDeleted`, `deletedAt`) for users
  - Trash/restore (`isTrashed`, `trashedAt`) for leaves

---

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js v5
- **Database**: MongoDB + Mongoose ODM (v9.3+)
- **Auth**: JSON Web Tokens (jsonwebtoken)
- **Validation**: Joi
- **Security**: Helmet, bcryptjs
- **Docs**: Swagger-jsdoc + Swagger UI Express + YAML config
- **Dev Tools**: Nodemon, ESLint, Prettier

---

## Project Structure

```bash
leave-management-backend/
├── scripts/
│   └── seedAdmin.js
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── swagger.js
│   │   └── swagger.yaml
│   ├── controllers/
│   │   ├── admin.controller.js
│   │   ├── auth.controller.js
│   │   └── employee.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   ├── role.middleware.js
│   │   └── validate.middleware.js
│   ├── models/
│   │   ├── Leave.model.js
│   │   └── User.model.js
│   ├── routes/
│   │   ├── admin.routes.js
│   │   ├── auth.routes.js
│   │   └── employee.routes.js
│   ├── utils/
│   │   └── leaveUtils.js
│   └── validators/
│       ├── auth.validator.js
│       ├── leave.validator.js
│       └── user.validator.js
├── .env
├── .env.example
├── package.json
├── package-lock.json
├── server.js
└── README.md
'''
---

## ⚙️ Setup & Installation

### 1. Clone the Repository
bash
git clone <your-repo-url>
cd leave-management-backend


### 2. Install Dependencies
bash
npm install


### 3. Configure Environment Variables
bash
cp .env.example .env


Edit `.env` with your values:
env
NODE_ENV=development
PORT=5000

# MongoDB Connection
MONGO_URI=mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER>.mongodb.net/LeaveManagement?retryWrites=true&w=majority

# JWT Configuration (change this in production!)
JWT_SECRET=super-long-secure-random-secret-key-2026-change-this-in-production
JWT_EXPIRES_IN=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Optional: Swagger server URL
SWAGGER_SERVER_URL=http://localhost:5000/api/v1


### 4. Seed the Default Admin Account
bash
npm run seed:admin


**Default Admin** (created only if it doesn't exist):
- **Email**: `aljun.dalman@neu.edu.ph`
- **Password**: `Admin123`

The seeder uses the Mongoose pre-save hook to hash the password automatically.

### 5. Run the Server
**Development** (recommended – auto-restart):
bash
npm run dev


**Production**:
bash
npm start


Server runs on `http://localhost:5000` (or your `PORT`).

**API Base**: `http://localhost:5000/api/v1`  
**Swagger UI** (development only): http://localhost:5000/api-docs

---

## API Endpoints

All protected routes (except login) require a valid `Bearer <token>`.

### Auth Routes
| Method | Endpoint                  | Description                  | Protected |
|--------|---------------------------|------------------------------|-----------|
| POST   | `/auth/login`             | Login user                   | No        |
| GET    | `/auth/me`                | Get current user profile     | Yes       |
| POST   | `/auth/change-password`   | Change password              | Yes       |

### Employee Routes
| Method | Endpoint                          | Description                       | Protected |
|--------|-----------------------------------|-----------------------------------|-----------|
| GET    | `/employee/employees/:id`         | Get employee by ID                | Yes       |
| GET    | `/employee/leaves/my`             | Get leave history                 | Yes       |
| POST   | `/employee/leaves`                | Create leave request              | Yes       |
| PATCH  | `/employee/leaves/:id/cancel`     | Cancel pending leave              | Yes       |

### Admin Routes
| Method | Endpoint                               | Description                          | Protected |
|--------|----------------------------------------|--------------------------------------|-----------|
| POST   | `/admin/users`                         | Create new user                      | Yes       |
| GET    | `/admin/employees`                     | Get all active employees             | Yes       |
| GET    | `/admin/stats`                         | Get dashboard statistics             | Yes       |
| PATCH  | `/admin/employees/:id/remove`          | Soft delete employee                 | Yes       |
| PATCH  | `/admin/employees/:id/restore`         | Restore employee                     | Yes       |
| DELETE | `/admin/employees/:id/permanent`       | Permanent delete employee            | Yes       |
| GET    | `/admin/leaves`                        | Get all active leaves                | Yes       |
| PATCH  | `/admin/leaves/:id/status`             | Approve / Reject leave               | Yes       |
| PATCH  | `/admin/leaves/:id/trash`              | Move leave to trash                  | Yes       |
| PATCH  | `/admin/leaves/:id/restore`            | Restore leave from trash             | Yes       |
| DELETE | `/admin/leaves/:id/permanent`          | Permanent delete leave               | Yes       |

**Additional**:
- `GET /api/v1/health` – Server health check

---

## Available Scripts (`package.json`)

bash
npm run dev          # Start with nodemon (recommended)
npm start            # Production start
npm run seed:admin   # Seed default admin
npm run lint         # Run ESLint
npm run format       # Run Prettier

---

## Recent Changes (Updated April 2026)

- **Trash/Restore System**: Full soft-delete + trash functionality added for both employees (`isDeleted`) and leaves (`isTrashed`).
- **Strong Password Policy**: Enforced via Joi validators (min 8 chars + uppercase/lowercase/number/special).
- **Swagger YAML**: Now uses `swagger.yaml` for cleaner OpenAPI spec (loaded in `server.js`).
- **Consistent Responses**: All controllers now return standardized `{ success, statusCode, message, ... }` format.
- **Improved Validation**: Separate validator files with detailed error messages.
- **Health Check Endpoint**: Added for monitoring.
- **Code Quality**: ESLint + Prettier setup + updated dependencies (Express 5, Mongoose 9.x).
- **Leave Calculation**: Centralized in `leaveUtils.js` with better error handling.

---

## 🔮 Future Enhancements (Roadmap)

- Exclude weekends/holidays from leave day calculation
- Email notifications (nodemailer)
- Rate limiting & advanced logging
- Docker + CI/CD pipeline
- Analytics & reporting dashboard

---

## 👨‍💻 Author

**Aljun Dalman**  
Quezon City, Philippines
