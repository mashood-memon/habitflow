# Deployment Guide

This guide covers how to deploy your HabitFlow app to various platforms.

## Quick Deployment Options

### 1. Vercel (Recommended for React apps)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Configure build settings**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Root Directory: `./`

4. **Add environment variables in Vercel dashboard**
   - `DATABASE_URL`: Your PostgreSQL connection string

### 2. Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build and deploy**
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

### 3. Railway (Good for full-stack apps)

1. **Connect your GitHub repository**
   - Go to https://railway.app
   - Connect your GitHub account
   - Import your repository

2. **Configure environment variables**
   - Add `DATABASE_URL` in Railway dashboard
   - Railway can auto-provision PostgreSQL

### 4. Render

1. **Connect GitHub repository at https://render.com**
2. **Configure build settings**
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Environment: Node.js

## Self-Hosted Deployment

### Using PM2 (Process Manager)

1. **Install PM2**
   ```bash
   npm install -g pm2
   ```

2. **Create ecosystem file**
   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'habitflow',
       script: 'npm',
       args: 'run dev',
       env: {
         NODE_ENV: 'production',
         PORT: 5000
       }
     }]
   }
   ```

3. **Deploy**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### Using Docker

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npm run build
   
   EXPOSE 5000
   CMD ["npm", "run", "dev"]
   ```

2. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "5000:5000"
       environment:
         - DATABASE_URL=postgresql://postgres:password@db:5432/habitflow
       depends_on:
         - db
     
     db:
       image: postgres:15
       environment:
         POSTGRES_DB: habitflow
         POSTGRES_PASSWORD: password
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

3. **Deploy**
   ```bash
   docker-compose up -d
   ```

## Database Setup for Production

### Option 1: Managed PostgreSQL

**Providers:**
- **Neon** (Free tier): https://neon.tech
- **Supabase** (Free tier): https://supabase.com
- **Railway** (Simple setup): https://railway.app
- **AWS RDS** (Enterprise): https://aws.amazon.com/rds/

**Setup steps:**
1. Create database instance
2. Get connection string
3. Add to environment variables
4. Run `npm run db:push`

### Option 2: Self-hosted PostgreSQL

```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql

# Start service
sudo systemctl start postgresql  # Linux
brew services start postgresql   # macOS

# Create database
sudo -u postgres createdb habitflow
```

## Environment Variables for Production

Create these environment variables on your hosting platform:

```bash
# Required
DATABASE_URL=postgresql://user:password@host:5432/database
NODE_ENV=production

# Optional
PORT=5000
PGHOST=your-db-host
PGPORT=5432
PGUSER=your-username
PGPASSWORD=your-password
PGDATABASE=habitflow
```

## Build Process

### Production Build

```bash
# Install dependencies
npm ci --only=production

# Build the application
npm run build

# Start production server
npm start
```

### Build Script (add to package.json)

```json
{
  "scripts": {
    "start": "NODE_ENV=production tsx server/index.ts",
    "build": "vite build",
    "postbuild": "npm run db:push"
  }
}
```

## Performance Optimization

### 1. Enable Gzip Compression

Add to your server:

```javascript
// server/index.ts
import compression from 'compression';
app.use(compression());
```

### 2. Serve Static Files

```javascript
// Serve built files
app.use(express.static('dist'));

// Fallback for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});
```

### 3. Add Caching Headers

```javascript
app.use(express.static('dist', {
  maxAge: '1d',
  etag: true
}));
```

## Monitoring and Maintenance

### Health Check Endpoint

```javascript
// server/routes.ts
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'connected' // check db connection
  });
});
```

### Database Backups

```bash
# Create backup
pg_dump $DATABASE_URL > backup.sql

# Restore backup
psql $DATABASE_URL < backup.sql
```

### Log Management

```javascript
// Add to server
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## Troubleshooting Deployment

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json
   - Check for TypeScript errors

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check firewall/security group settings
   - Ensure database is accessible from hosting platform

3. **Environment Variables**
   - Double-check variable names
   - Ensure no spaces in values
   - Use quotes for complex strings

4. **Memory Issues**
   - Increase build memory limit
   - Use `--max-old-space-size=4096`

### Debugging Tools

```bash
# Check environment variables
printenv | grep DATABASE

# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check server logs
tail -f /var/log/app.log

# Monitor process
top -p $(pgrep node)
```

## Security Checklist

- [ ] Environment variables are secure
- [ ] Database has proper authentication
- [ ] HTTPS is enabled
- [ ] Security headers are configured
- [ ] Dependencies are up to date
- [ ] Sensitive files are in .gitignore
- [ ] Database backups are automated
- [ ] Monitoring is in place

## Cost Optimization

### Free Tier Options

1. **Vercel**: Free for personal projects
2. **Netlify**: Free for open source
3. **Railway**: $5/month for hobby projects
4. **Render**: Free tier available
5. **Neon**: Free PostgreSQL tier

### Tips to Reduce Costs

- Use serverless functions for API
- Implement proper caching
- Optimize database queries
- Use CDN for static assets
- Monitor usage regularly

Your HabitFlow app is now ready for production deployment!