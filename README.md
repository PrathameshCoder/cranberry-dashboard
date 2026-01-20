# 🍒 Cranberry Dashboard

A secure, role-based internal knowledge management dashboard built with **Next.js App Router**, **Prisma**, and **MongoDB**.  
Designed for university/company use with controlled access, HR onboarding, and enterprise-grade authentication.

---

## ✨ Key Features

### 🔐 Authentication & Security
- Database-backed email + password authentication
- Secure password hashing using **bcrypt**
- HttpOnly cookie-based sessions
- Middleware-protected routes
- Company/university email domain restriction
- Forced password change on first login

### 🧑‍💼 Role-Based Access Control (RBAC)
- Roles supported: **ADMIN**, **HR**, **EMPLOYEE**
- API-level role enforcement
- HR/Admin-only user management APIs
- Disabled users are fully blocked from access

### 👥 User Management
- HR/Admin can:
  - Create new users
  - Assign roles
  - Reset passwords
  - Disable accounts
- New users must update password on first login

### 📚 Knowledge Management
- Authenticated users can view knowledge items
- Create new knowledge entries with:
  - Title, summary, content, tags
  - Impact level (LOW / MEDIUM / HIGH)
- Author attribution and timestamps

### 🧪 Developer Experience
- Dev-only admin seed endpoint (safely guarded)
- Clean API structure using Next.js App Router
- Prisma schema designed for scalability
- Feature-branch-based Git workflow

---

## 🛠 Tech Stack

- **Frontend**: Next.js 16 (App Router), React, TypeScript
- **UI**: shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **ORM**: Prisma
- **Auth**: Custom session-based auth
- **Styling**: Tailwind CSS

---

## 📂 Project Structure (Simplified)

```text
app/
├── api/
│   ├── auth/
│   ├── users/
│   ├── knowledge/
│   └── dev/seed-admin/
├── dashboard/
├── admin/users/
├── account/change-password/
lib/
├── auth.ts
├── prisma.ts
middleware.ts
```

---

## 🚀 Getting Started (Local Development)

1. Install dependencies
```bash
pnpm install
```

2. Configure environment variables
```
DATABASE_URL=
ADMIN_EMAIL=
ADMIN_PASSWORD=
DEV_SEED_SECRET=
```

3. Run Development Server
```
pnpm dev
```

---

## 🔒 Security Notes

- All sensitive routes are protected by middleware and API checks
- Dev-only routes are blocked in production
- No secrets are committed to the repository

---

## 📌 Current Status
- Core authentication, RBAC, and onboarding flows are complete
- Stable and ready for UI expansion and feature development

---

## 🔜 Planned Enhancements
- HR/Admin user management UI
- Knowledge edit/delete permissions
- Account/profile page enhancements
- Search functionality

--- 

## 👤 Maintainer
Built and maintained as part of a collaborative academic software project.
