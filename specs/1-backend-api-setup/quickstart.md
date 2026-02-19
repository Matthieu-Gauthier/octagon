# Backend Quickstart

## Prerequisites
- Node.js 20+
- PostgreSQL 16 (Running on Unraid or Local Docker)
- Supabase Project (for Auth)

## Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Variables**
   Create `.env` in `backend/`:
   ```env
   DATABASE_URL="postgresql://user:pass@host:5432/octagon?schema=public"
   SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_KEY="your-anon-key"
   JWT_SECRET="your-supabase-jwt-secret"
   ```

3. **Database Setup**
   ```bash
   # Generate Prisma Client
   npx prisma generate
   
   # Push schema to DB (Dev mode)
   npx prisma db push
   ```

4. **Seed Data**
   ```bash
   npm run seed
   ```

5. **Run Server**
   ```bash
   # Watch mode
   npm run start:dev
   ```

## Verification
- Open `http://localhost:3000/api/v1/health` -> `{ "status": "ok" }`
