# HabitFlow - Habit Tracker MVP

## Overview

HabitFlow is a personal habit tracking web application built to help users develop sustainable habits through visual progress tracking, gamification, and streak motivation. The application provides a clean, modern interface with comprehensive habit management, achievement systems, and detailed analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: React hooks with custom hooks for business logic
- **Data Fetching**: TanStack Query for server state management
- **Storage**: LocalStorage for client-side data persistence
- **Routing**: Single-page application with tab-based navigation

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM (recently migrated from localStorage)
- **API**: RESTful API structure with database integration
- **Session Management**: Basic session handling setup
- **Data Storage**: Complete database schema with users, habits, completions, achievements, and streaks tables

### Key Design Decisions

1. **Client-First Approach**: The application currently operates entirely on the frontend with localStorage, making it immediately functional without server dependencies
2. **Component-Based Architecture**: Heavy use of reusable components with shadcn/ui for consistency
3. **TypeScript Throughout**: Strong typing across the entire codebase for better developer experience
4. **Modern React Patterns**: Custom hooks for business logic separation and React Query for data management

## Key Components

### Data Models
- **Habit**: Core entity with name, category, frequency, targets, and metadata
- **Completion**: Daily completion records with timestamps and optional values
- **Achievement**: Gamification system with various categories (streak, completion, level, etc.)
- **User**: User profile with level, XP, and preferences
- **Streak**: Calculated streak data for each habit

### Core Features
1. **Habit Management**: Full CRUD operations for habits with categorization
2. **Daily Dashboard**: Today's habits with completion tracking
3. **Progress Visualization**: Heat maps, charts, and progress circles
4. **Gamification**: XP system, levels, achievements, and badges
5. **Statistics**: Comprehensive analytics and reporting
6. **Calendar View**: Monthly habit completion visualization

### UI Components
- Reusable components built on shadcn/ui foundation
- Responsive design supporting mobile and desktop
- Dark/light theme support
- Accessible components with proper ARIA labels

## Data Flow

### Client-Side Data Management
1. **Storage Layer**: LocalStorage wrapper with error handling
2. **Business Logic**: Custom hooks manage CRUD operations and calculations
3. **State Management**: React hooks with local state and React Query cache
4. **UI Updates**: Automatic re-renders on data changes

### Planned Server Integration
- Express.js backend with PostgreSQL database
- Drizzle ORM for database operations
- Session-based authentication
- RESTful API endpoints

## External Dependencies

### Core Libraries
- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Type safety and developer experience
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework

### UI and UX
- **Radix UI**: Accessible component primitives
- **shadcn/ui**: Pre-built component library
- **Lucide React**: Icon library
- **date-fns**: Date manipulation utilities

### Data Management
- **TanStack Query**: Server state management
- **Zod**: Schema validation
- **React Hook Form**: Form handling

### Development Tools
- **ESLint/Prettier**: Code quality and formatting
- **Drizzle Kit**: Database migrations and management

## Deployment Strategy

### Current Setup
- **Development**: Vite dev server with hot reload
- **Build Process**: Vite build for client, ESBuild for server
- **Environment**: Node.js with ES modules

### Production Considerations
- Static file serving through Express
- Environment variable configuration
- Database connection management
- Session storage with PostgreSQL

### Replit Integration
- Replit-specific plugins for development
- Runtime error overlay for debugging
- Cartographer integration for code navigation

### Database Strategy
The application now uses PostgreSQL as the primary database with localStorage fallback:
- ✅ Complete PostgreSQL integration with Drizzle ORM
- ✅ All API endpoints implemented and tested
- ✅ Fallback to localStorage when database unavailable
- ✅ Production-ready database schema and migrations
- ✅ Database GUI available via Drizzle Studio

## Deployment and Distribution

### Repository Setup
- ✅ Comprehensive README.md with installation instructions
- ✅ GitHub setup guide with authentication and workflow
- ✅ Local development guide with prerequisites and troubleshooting
- ✅ Deployment guide covering multiple platforms (Vercel, Netlify, Railway)
- ✅ Environment configuration examples and security best practices
- ✅ Proper .gitignore for production and development files

### Supported Deployment Platforms
1. **Development**: Replit with built-in PostgreSQL
2. **Local**: Node.js + PostgreSQL or localStorage fallback
3. **Production**: Vercel, Netlify, Railway, Render, or self-hosted
4. **Database**: Neon, Supabase, Railway, AWS RDS, or self-hosted PostgreSQL

### Distribution Features
- Complete GitHub workflow with branching strategy
- Environment variable management
- Production build optimization
- Health checks and monitoring setup
- Docker containerization support
- CI/CD pipeline ready

This architecture ensures the application can run anywhere from local development to enterprise production environments.