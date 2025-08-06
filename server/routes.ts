import type { Express } from "express";
import { createServer, type Server } from "http";
import { clerkMiddleware, getAuth } from '@clerk/express';
import { storage } from "./storage";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { users, habits, completions, achievements, streaks } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add Clerk middleware
  // Configure Clerk middleware with proper secret key
  app.use(clerkMiddleware({
    secretKey: process.env.CLERK_SECRET_KEY
  }));
  
  console.log('[SERVER] Clerk secret key loaded:', !!process.env.CLERK_SECRET_KEY);
  console.log('[SERVER] Clerk secret key length:', process.env.CLERK_SECRET_KEY?.length || 0);

  // Authentication middleware for API routes
  const requireAuth = (req: any, res: any, next: any) => {
    console.log('[AUTH] Starting authentication check...');
    console.log('[AUTH] Authorization header:', req.headers.authorization);
    console.log('[AUTH] All headers:', Object.keys(req.headers));
    
    const { userId } = getAuth(req);
    console.log('[AUTH] Extracted userId from Clerk:', userId);
    
    if (!userId) {
      console.error('[AUTH] No userId found, authentication failed');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    console.log('[AUTH] Authentication successful for user:', userId);
    req.userId = userId;
    next();
  };

  // Database status endpoint for debugging
  app.get("/api/db-status", async (req, res) => {
    try {
      // Test database connection
      const testQuery = await db.select().from(users).limit(1);
      
      // Get counts of all tables
      const [userCount] = await db.select({ count: sql`count(*)` }).from(users);
      const [habitCount] = await db.select({ count: sql`count(*)` }).from(habits);
      const [completionCount] = await db.select({ count: sql`count(*)` }).from(completions);
      const [achievementCount] = await db.select({ count: sql`count(*)` }).from(achievements);
      const [streakCount] = await db.select({ count: sql`count(*)` }).from(streaks);
      
      res.json({
        status: "connected",
        tables: {
          users: Number(userCount.count),
          habits: Number(habitCount.count),
          completions: Number(completionCount.count),
          achievements: Number(achievementCount.count),
          streaks: Number(streakCount.count)
        }
      });
    } catch (error) {
      console.error('Database connection error:', error);
      res.status(500).json({ 
        status: "error", 
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // User routes
  app.get("/api/user/:id", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.post("/api/user", requireAuth, async (req: any, res) => {
    try {
      console.log('[API] Creating user with data:', req.body);
      console.log('[API] Authenticated user ID:', req.userId);
      
      // Ensure the user ID from Clerk matches the request body
      const userData = {
        ...req.body,
        id: req.userId // Use the authenticated user ID from Clerk
      };
      
      console.log('[API] Processed user data:', userData);
      const user = await storage.createUser(userData);
      console.log('[API] User created successfully:', user);
      res.json(user);
    } catch (error) {
      console.error('[API] Error creating user:', error);
      res.status(500).json({ message: "Failed to create user", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put("/api/user/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Habit routes
  app.get("/api/habits", requireAuth, async (req: any, res) => {
    try {
      console.log(`[API] Getting habits for user: ${req.userId}`);
      const habits = await storage.getHabits(req.userId);
      console.log(`[API] Found ${habits.length} habits`);
      res.json(habits);
    } catch (error) {
      console.error('[API] Error getting habits:', error);
      res.status(500).json({ message: "Failed to get habits", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post("/api/habits", requireAuth, async (req: any, res) => {
    try {
      console.log('[API] Creating habit with data:', req.body);
      console.log('[API] Authenticated user ID:', req.userId);
      
      // First, check if the user exists
      const userExists = await storage.getUser(req.userId);
      if (!userExists) {
        console.error('[API] User not found in database:', req.userId);
        return res.status(400).json({ 
          message: "User not found in database. Please ensure user is created first.",
          userId: req.userId
        });
      }
      
      const habitData = {
        ...req.body,
        userId: req.userId,
        // Remove id, let the database generate UUID
        createdDate: req.body.createdDate ? new Date(req.body.createdDate) : new Date(),
        isActive: req.body.isActive !== undefined ? req.body.isActive : true
      };
      // Remove the id field if it exists, let DB generate UUID
      delete habitData.id;
      console.log('[API] Processed habit data:', habitData);
      const habit = await storage.createHabit(habitData);
      console.log('[API] Habit created successfully:', habit);
      res.json(habit);
    } catch (error) {
      console.error('[API] Error creating habit:', error);
      res.status(500).json({ message: "Failed to create habit", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put("/api/habits/:id", requireAuth, async (req, res) => {
    try {
      const habit = await storage.updateHabit(req.params.id, req.body);
      if (!habit) {
        return res.status(404).json({ message: "Habit not found" });
      }
      res.json(habit);
    } catch (error) {
      res.status(500).json({ message: "Failed to update habit" });
    }
  });

  app.delete("/api/habits/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteHabit(req.params.id);
      res.json({ message: "Habit deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete habit" });
    }
  });

  // Completion routes
  app.get("/api/completions", requireAuth, async (req: any, res) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const completions = await storage.getCompletions(req.userId, startDate, endDate);
      res.json(completions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get completions" });
    }
  });

  app.post("/api/completions", requireAuth, async (req: any, res) => {
    try {
      console.log('[API] Creating completion with data:', req.body);
      const completionData = {
        ...req.body,
        userId: req.userId,
        // Remove id, let the database generate UUID
        timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date()
      };
      // Remove the id field if it exists, let DB generate UUID
      delete completionData.id;
      console.log('[API] Processed completion data:', completionData);
      const completion = await storage.createCompletion(completionData);
      console.log('[API] Completion created successfully:', completion);
      res.json(completion);
    } catch (error) {
      console.error('[API] Error creating completion:', error);
      res.status(500).json({ message: "Failed to create completion", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put("/api/completions/:id", requireAuth, async (req, res) => {
    try {
      const completion = await storage.updateCompletion(req.params.id, req.body);
      if (!completion) {
        return res.status(404).json({ message: "Completion not found" });
      }
      res.json(completion);
    } catch (error) {
      res.status(500).json({ message: "Failed to update completion" });
    }
  });

  app.delete("/api/completions/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteCompletion(req.params.id);
      res.json({ message: "Completion deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete completion" });
    }
  });

  // Streak routes
  app.get("/api/streaks", requireAuth, async (req: any, res) => {
    try {
      const streaks = await storage.getStreaks(req.userId);
      res.json(streaks);
    } catch (error) {
      res.status(500).json({ message: "Failed to get streaks" });
    }
  });

  app.post("/api/streaks", requireAuth, async (req: any, res) => {
    try {
      const streakData = {
        ...req.body,
        userId: req.userId,
        // Remove id, let the database generate UUID
      };
      // Remove the id field if it exists, let DB generate UUID
      delete streakData.id;
      const streak = await storage.createStreak(streakData);
      res.json(streak);
    } catch (error) {
      console.error('[API] Error creating streak:', error);
      res.status(500).json({ message: "Failed to create streak", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put("/api/streaks/:id", requireAuth, async (req, res) => {
    try {
      const streak = await storage.updateStreak(req.params.id, req.body);
      if (!streak) {
        return res.status(404).json({ message: "Streak not found" });
      }
      res.json(streak);
    } catch (error) {
      res.status(500).json({ message: "Failed to update streak" });
    }
  });

  app.delete("/api/streaks/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteStreak(req.params.id);
      res.json({ message: "Streak deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete streak" });
    }
  });

  // Achievement routes
  app.get("/api/achievements", requireAuth, async (req: any, res) => {
    try {
      const achievements = await storage.getAchievements(req.userId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to get achievements" });
    }
  });

  app.post("/api/achievements", requireAuth, async (req: any, res) => {
    try {
      const achievementData = {
        ...req.body,
        userId: req.userId,
        id: req.body.id || `achievement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      const achievement = await storage.createAchievement(achievementData);
      res.json(achievement);
    } catch (error) {
      res.status(500).json({ message: "Failed to create achievement" });
    }
  });

  app.put("/api/achievements/:id", requireAuth, async (req, res) => {
    try {
      const achievement = await storage.updateAchievement(req.params.id, req.body);
      if (!achievement) {
        return res.status(404).json({ message: "Achievement not found" });
      }
      res.json(achievement);
    } catch (error) {
      res.status(500).json({ message: "Failed to update achievement" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
