# GitHub Setup Guide

This guide will help you push your HabitFlow project to GitHub and set it up for collaboration.

## Prerequisites

1. **GitHub Account**: Create one at https://github.com if you don't have one
2. **Git installed**: Download from https://git-scm.com/
3. **SSH key or Personal Access Token** (recommended for security)

## Step 1: Create Repository on GitHub

### Option A: Using GitHub Website

1. Go to https://github.com and sign in
2. Click the "+" icon in the top right, select "New repository"
3. Fill in the details:
   - **Repository name**: `habitflow` (or your preferred name)
   - **Description**: "Personal habit tracker with gamification features"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. Click "Create repository"

### Option B: Using GitHub CLI (if installed)

```bash
gh repo create habitflow --public --description "Personal habit tracker with gamification features"
```

## Step 2: Prepare Your Local Repository

In your project directory (on Replit or locally):

### Initialize Git (if not already done)

```bash
git init
```

### Create .gitignore file

```bash
# Create .gitignore to exclude sensitive files
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Database
*.db
*.sqlite

# Logs
logs
*.log

# IDE/Editor files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
*.tmp
*.temp

# Replit specific
.replit
.upm
replit.nix
EOF
```

### Add and commit your files

```bash
# Add all files to staging
git add .

# Create initial commit
git commit -m "Initial commit: HabitFlow habit tracker app

- Complete React + TypeScript frontend
- Express.js backend with PostgreSQL integration
- Habit management with CRUD operations
- Gamification system with XP and achievements
- Calendar view and statistics dashboard
- Responsive design with dark/light themes"
```

## Step 3: Connect to GitHub

### Add GitHub as remote origin

Replace `YOUR_USERNAME` with your actual GitHub username:

```bash
git remote add origin https://github.com/YOUR_USERNAME/habitflow.git
```

### Set default branch name

```bash
git branch -M main
```

### Push to GitHub

```bash
git push -u origin main
```

If you get authentication errors, see the Authentication section below.

## Step 4: Authentication Setup

### Option A: Personal Access Token (Recommended)

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name like "HabitFlow Development"
4. Select scopes: `repo` (full control of private repositories)
5. Copy the token (you won't see it again!)
6. Use it as your password when Git asks for credentials

### Option B: SSH Key (More Secure)

1. **Generate SSH key:**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. **Add to SSH agent:**
   ```bash
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_ed25519
   ```

3. **Copy public key:**
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```

4. **Add to GitHub:**
   - Go to GitHub → Settings → SSH and GPG keys
   - Click "New SSH key"
   - Paste your public key

5. **Update remote URL:**
   ```bash
   git remote set-url origin git@github.com:YOUR_USERNAME/habitflow.git
   ```

## Step 5: Verify Upload

1. Go to your GitHub repository
2. You should see all your files
3. The README.md should display nicely with project information

## Step 6: Set Up Repository Settings

### Add Repository Description

1. Go to your repository on GitHub
2. Click the gear icon (Settings) in the repository tabs
3. Add description: "Personal habit tracker with gamification features - React, TypeScript, PostgreSQL"
4. Add topics: `react`, `typescript`, `habit-tracker`, `postgresql`, `gamification`

### Create Releases (Optional)

1. Go to "Releases" in your repository
2. Click "Create a new release"
3. Tag version: `v1.0.0`
4. Release title: "HabitFlow v1.0.0 - Initial Release"
5. Describe the features in the release notes

## Step 7: Collaboration Setup (Optional)

### Enable Issues and Discussions

1. Go to repository Settings
2. Scroll to Features section
3. Enable "Issues" for bug tracking
4. Enable "Discussions" for community questions

### Add Branch Protection (for teams)

1. Go to Settings → Branches
2. Add rule for `main` branch
3. Enable "Require pull request reviews before merging"

## Daily Development Workflow

### Making Changes

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make your changes...

# Add and commit
git add .
git commit -m "Add new feature: description"

# Push to GitHub
git push origin feature/new-feature
```

### Syncing with Remote

```bash
# Pull latest changes
git pull origin main

# Push your changes
git push origin main
```

## Repository Management

### Useful Git Commands

```bash
# Check status
git status

# View commit history
git log --oneline

# Create and switch to new branch
git checkout -b branch-name

# Switch between branches
git checkout main
git checkout feature-branch

# Merge feature branch to main
git checkout main
git merge feature-branch

# Delete merged branch
git branch -d feature-branch
```

### Repository Structure

Your GitHub repository will contain:

```
habitflow/
├── .gitignore              # Files to ignore
├── README.md               # Project documentation
├── LOCAL_SETUP_GUIDE.md   # Local development setup
├── GITHUB_SETUP_GUIDE.md  # This guide
├── package.json            # Dependencies and scripts
├── client/                 # Frontend code
├── server/                 # Backend code
├── shared/                 # Shared types
└── other project files...
```

## Troubleshooting

### Common Issues

1. **Authentication failed**
   - Use Personal Access Token instead of password
   - Set up SSH key for better security

2. **Remote already exists**
   ```bash
   git remote remove origin
   git remote add origin https://github.com/YOUR_USERNAME/habitflow.git
   ```

3. **Files too large**
   - Check .gitignore includes node_modules/
   - Remove large files: `git rm --cached filename`

4. **Merge conflicts**
   - Edit conflicted files manually
   - Add and commit resolved files

### Getting Help

- GitHub Docs: https://docs.github.com/
- Git Handbook: https://guides.github.com/introduction/git-handbook/
- GitHub Desktop (GUI): https://desktop.github.com/

## Next Steps

After setting up GitHub:

1. ⭐ Star your own repository
2. 📝 Add a detailed description
3. 🏷️ Add relevant topics/tags
4. 🔗 Add a link to your live app (if deployed)
5. 📋 Create issues for future features
6. 🤝 Invite collaborators if working with others

Your HabitFlow project is now ready for version control and collaboration on GitHub!