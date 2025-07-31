# HabitFlow - Personal Habit Tracker

A comprehensive habit tracking web application with gamification features, built with React, TypeScript, and PostgreSQL.

## Features

- **Habit Management**: Create, edit, and delete habits with customizable frequencies
- **Progress Tracking**: Visual progress indicators and completion statistics
- **Gamification**: XP system, levels, achievements, and streak counters
- **Calendar View**: Monthly habit completion visualization
- **Statistics Dashboard**: Comprehensive analytics and reporting
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Theme**: Toggle between themes
- **Database Persistence**: PostgreSQL backend with localStorage fallback

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: TanStack Query, React hooks
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 13+ (optional - app works with localStorage fallback)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/habitflow.git
   cd habitflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your database URL:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/habitflow
   ```

4. **Set up the database** (optional)
   ```bash
   # Create database
   createdb habitflow
   
   # Push schema to database
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5000`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## Database Setup

### Option 1: PostgreSQL (Recommended)

1. Install PostgreSQL on your system
2. Create a new database: `createdb habitflow`
3. Set the `DATABASE_URL` in your `.env` file
4. Run `npm run db:push` to create tables

### Option 2: Local Storage (Fallback)

If you don't want to set up PostgreSQL, the app will automatically use localStorage to store data locally in your browser.

## Deployment

### Replit (Current)
The app is currently running on Replit with built-in PostgreSQL database.

### Vercel/Netlify
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting provider
3. Set up environment variables on the hosting platform

### Self-hosted
1. Set up a Linux server with Node.js and PostgreSQL
2. Clone the repository and install dependencies
3. Set up environment variables
4. Use PM2 or similar process manager: `pm2 start npm --name "habitflow" -- run dev`

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and configurations
│   │   ├── pages/          # Application pages/routes
│   │   └── App.tsx         # Main application component
├── server/                 # Backend Express server
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database interface and implementation
│   └── index.ts            # Server entry point
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Database schema and TypeScript types
└── package.json            # Dependencies and scripts
```

## API Endpoints

- `GET /api/users/:id` - Get user data
- `POST /api/users` - Create new user
- `GET /api/habits/:userId` - Get user's habits
- `POST /api/habits` - Create new habit
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit
- `GET /api/completions/:userId` - Get user's completions
- `POST /api/completions` - Create completion
- `PUT /api/completions/:id` - Update completion
- `GET /api/streaks/:userId` - Get user's streaks
- `POST /api/streaks` - Create streak record

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -m 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.