# Local Development Setup Guide

This guide will help you set up the HabitFlow app on your local machine.

## Prerequisites

Before starting, make sure you have these installed:

1. **Node.js 18 or higher**
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **Git**
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

3. **PostgreSQL (Optional but recommended)**
   - Download from: https://www.postgresql.org/download/
   - The app will work without it using localStorage

## Step-by-Step Setup

### 1. Clone from GitHub

First, you'll need to push your code to GitHub (see GitHub setup section), then:

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/habitflow.git
cd habitflow
```

### 2. Install Dependencies

```bash
npm install
```

This will install all the required packages listed in `package.json`.

### 3. Environment Setup

```bash
# Copy the example environment file
cp .env.example .env
```

Edit the `.env` file with your database settings:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/habitflow
NODE_ENV=development
PORT=5000
```

### 4. Database Setup (Optional)

#### Option A: With PostgreSQL (Recommended)

1. **Install PostgreSQL**
   - Windows: Download installer from postgresql.org
   - macOS: `brew install postgresql` (if you have Homebrew)
   - Linux: `sudo apt-get install postgresql postgresql-contrib`

2. **Start PostgreSQL service**
   - Windows: Service starts automatically
   - macOS: `brew services start postgresql`
   - Linux: `sudo systemctl start postgresql`

3. **Create database**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create database and user
   CREATE DATABASE habitflow;
   CREATE USER habituser WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE habitflow TO habituser;
   \q
   ```

4. **Update your .env file**
   ```env
   DATABASE_URL=postgresql://habituser:your_password@localhost:5432/habitflow
   ```

5. **Create database tables**
   ```bash
   npm run db:push
   ```

#### Option B: Without PostgreSQL (localStorage)

If you skip database setup, the app will automatically use localStorage in your browser. No additional setup needed!

### 5. Start the Application

```bash
npm run dev
```

The app will start and be available at: `http://localhost:5000`

You should see:
- Frontend served by Vite
- Backend API running on Express
- Hot reloading for development

## Development Workflow

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Database management
npm run db:push          # Apply schema changes
npm run db:studio        # Open database GUI

# Other utilities
npm run type-check       # Check TypeScript types
npm run lint            # Check code quality
```

### Making Changes

1. **Frontend changes**: Edit files in `client/src/`
2. **Backend changes**: Edit files in `server/`
3. **Database schema**: Edit `shared/schema.ts` then run `npm run db:push`

Changes will automatically reload in your browser!

### Project Structure

```
habitflow/
├── client/src/           # React frontend
│   ├── components/       # UI components
│   ├── pages/           # App pages
│   ├── hooks/           # Custom hooks
│   └── lib/             # Utilities
├── server/              # Express backend
│   ├── index.ts         # Server entry
│   ├── routes.ts        # API routes
│   └── storage.ts       # Database layer
├── shared/              # Shared code
│   └── schema.ts        # Database schema
└── package.json         # Dependencies
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill process on port 5000
   npx kill-port 5000
   ```

2. **Database connection errors**
   - Check PostgreSQL is running
   - Verify credentials in `.env`
   - Try the app without database (it will use localStorage)

3. **Module not found errors**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **TypeScript errors**
   ```bash
   # Check for type errors
   npm run type-check
   ```

### Getting Help

- Check the browser console for frontend errors
- Check the terminal for backend errors
- Ensure all environment variables are set correctly
- Verify PostgreSQL is running (if using database)

## Database GUI (Optional)

To view and edit your database visually:

```bash
npm run db:studio
```

This opens Drizzle Studio in your browser with a GUI for your database.

## Production Build

To create a production build:

```bash
npm run build
```

This creates optimized files in the `dist/` folder ready for deployment.