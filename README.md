# GVP SMS System

A comprehensive Student Attendance and Management System built with Next.js, PostgreSQL, and Prisma.

## Features
- **Role-Based Access Control**: Admin, HOD, and User roles with scoped permissions.
- **Attendance Management**: Mark and view attendance history.
- **Data Export**: Download attendance reports as Excel files.
- **Student & Alumni Management**: Manage student records and alumni data.
- **PWA Support**: Installable as a Progressive Web App.

## Technology Stack
- **Framework**: Next.js 14+ (App Router)
- **Database**: PostgreSQL (via Neon or Vercel Postgres)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS / Modular CSS

## Getting Started

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd gvp-sms-system
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Database Setup
Push the schema to your PostgreSQL database:
```bash
npx prisma db push
```

**(Optional) Seed Demo Data**:
Populate the database with initial data (Departments, Sections, Admin/HOD users, and Sample Students):
```bash
npx prisma db seed
```
*Note: This creates users `admin`, `hod-cse`, `hod-csm` with password `password123`.*

### 4. Run Locally
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

## Deployment

### Vercel + Neon
1. Push your code to GitHub.
2. Create a new project on [Vercel](https://vercel.com).
3. Connect your GitHub repository.
4. Set the `DATABASE_URL` and `NEXTAUTH_SECRET` environment variables in Vercel.
5. Deploy!

For detailed deployment instructions, refer to `deployment_guide.md` (if available in artifacts).
