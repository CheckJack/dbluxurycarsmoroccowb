# Setup Required - Missing Components

## ✅ Already Available
- ✅ Node.js v20.19.5
- ✅ npm 10.8.2  
- ✅ PostgreSQL 14.19 (installed via Homebrew)
- ✅ Database `dbcars_db` exists
- ✅ All source code files cloned from GitHub

## ❌ Missing Components

### 1. Install Dependencies

#### Backend Dependencies
```bash
cd dbcars/backend
npm install
```

#### Frontend Dependencies
```bash
cd dbcars/frontend
npm install
```

### 2. Create Environment Files

#### Backend Environment (.env)
Create file: `dbcars/backend/.env`

**Required Variables:**
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dbcars_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration (IMPORTANT: Generate secure secret for production)
# Generate with: openssl rand -base64 32
JWT_SECRET=your_strong_random_jwt_secret_key_here_min_32_characters
JWT_EXPIRES_IN=7d

# Email Configuration (Optional - for email notifications)
BREVO_API_KEY=your_brevo_api_key_here
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=DB Luxury Cars
BREVO_ADMIN_EMAIL=admin@yourdomain.com

# Public URLs (for email links)
PUBLIC_API_URL=http://localhost:3001
PUBLIC_FRONTEND_URL=http://localhost:3000

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

#### Frontend Environment (.env.local)
Create file: `dbcars/frontend/.env.local`

**Required Variables:**
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 3. Database Setup

The database `dbcars_db` already exists. However, you may need to:

1. **Restore database schema** (if not already done):
   ```bash
   # Check if backup.sql exists and restore it
   cd dbcars/backend
   psql -U postgres -d dbcars_db -f backup.sql
   ```

2. **Run migrations** (if needed):
   ```bash
   cd dbcars/backend/migrations
   # Run each migration file in order
   psql -U postgres -d dbcars_db -f create_blog_posts_table.sql
   psql -U postgres -d dbcars_db -f create_booking_drafts_table.sql
   # ... etc
   ```

### 4. Verify PostgreSQL Connection

Test your PostgreSQL connection:
```bash
psql -U postgres -d dbcars_db -c "SELECT 1;"
```

If this fails, you may need to:
- Start PostgreSQL: `brew services start postgresql`
- Update `.env` with correct PostgreSQL password
- Create database if missing: `createdb dbcars_db`

## Quick Start Commands

### Option 1: Use the Combined Script
```bash
# From project root
./start-dev.sh
```

### Option 2: Manual Start
```bash
# Terminal 1 - Backend
cd dbcars/backend
npm install
npm run dev

# Terminal 2 - Frontend  
cd dbcars/frontend
npm install
npm run dev
```

## After Setup

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## Important Notes

1. **JWT_SECRET**: In development, a weak secret will work but show warnings. For production, you MUST use a strong random string (32+ characters).

2. **Email (Optional)**: If `BREVO_API_KEY` is not set, email functionality will be disabled. The app will still work but won't send notifications.

3. **Database Password**: Replace `your_postgres_password_here` with your actual PostgreSQL password.

4. **Port Conflicts**: Ensure ports 3000 (frontend) and 3001 (backend) are not in use.

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check database exists: `psql -U postgres -l | grep dbcars_db`
- Verify credentials in `.env` file

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Module Not Found Errors
- Ensure you've run `npm install` in both `backend/` and `frontend/` directories
- Delete `node_modules` and `package-lock.json`, then reinstall if issues persist

