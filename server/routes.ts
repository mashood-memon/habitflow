import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { users, habits, completions, achievements, streaks } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // We'll create a default user UUID or get it from database
  let DEFAULT_USER_ID = 'temp-user-id'; // Will be replaced with actual UUID

  // Initialize default user
  const initializeDefaultUser = async () => {
    try {
      // Try to find existing default user
      const existingUsers = await db.select().from(users).limit(1);
      if (existingUsers.length > 0) {
        DEFAULT_USER_ID = existingUsers[0].id;
        console.log('[INIT] Using existing user:', DEFAULT_USER_ID);
        return;
      }

      // Create default user if none exists
      const defaultUserData = {
        name: 'Default User',
        level: 1,
        totalXP: 0,
        theme: 'light' as const,
        joinDate: new Date()
      };
      
      const [newUser] = await db.insert(users).values(defaultUserData).returning();
      DEFAULT_USER_ID = newUser.id;
      console.log('[INIT] Created default user:', DEFAULT_USER_ID);
    } catch (error) {
      console.error('[INIT] Error initializing default user:', error);
    }
  };

  // Initialize the default user
  await initializeDefaultUser();

  // Endpoint to get the default user ID
  app.get("/api/default-user", async (req, res) => {
    try {
      res.json({ userId: DEFAULT_USER_ID });
    } catch (error) {
      res.status(500).json({ message: "Failed to get default user ID" });
    }
  });

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
  app.get("/api/user/:id", async (req, res) => {
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

  app.post("/api/user", async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/user/:id", async (req, res) => {
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
  app.get("/api/habits", async (req, res) => {
    try {
      const userId = req.query.userId as string || DEFAULT_USER_ID;
      console.log(`[API] Getting habits for user: ${userId}`);
      const habits = await storage.getHabits(userId);
      console.log(`[API] Found ${habits.length} habits`);
      res.json(habits);
    } catch (error) {
      console.error('[API] Error getting habits:', error);
      res.status(500).json({ message: "Failed to get habits", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post("/api/habits", async (req, res) => {
    try {
      console.log('[API] Creating habit with data:', req.body);
      const habitData = {
        ...req.body,
        userId: req.body.userId || DEFAULT_USER_ID,
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

  app.put("/api/habits/:id", async (req, res) => {
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

  app.delete("/api/habits/:id", async (req, res) => {
    try {
      await storage.deleteHabit(req.params.id);
      res.json({ message: "Habit deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete habit" });
    }
  });

  // Completion routes
  app.get("/api/completions", async (req, res) => {
    try {
      const userId = req.query.userId as string || DEFAULT_USER_ID;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const completions = await storage.getCompletions(userId, startDate, endDate);
      res.json(completions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get completions" });
    }
  });

  app.post("/api/completions", async (req, res) => {
    try {
      console.log('[API] Creating completion with data:', req.body);
      const completionData = {
        ...req.body,
        userId: req.body.userId || DEFAULT_USER_ID,
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

  app.put("/api/completions/:id", async (req, res) => {
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

  app.delete("/api/completions/:id", async (req, res) => {
    try {
      await storage.deleteCompletion(req.params.id);
      res.json({ message: "Completion deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete completion" });
    }
  });

  // Streak routes
  app.get("/api/streaks", async (req, res) => {
    try {
      const userId = req.query.userId as string || DEFAULT_USER_ID;
      const streaks = await storage.getStreaks(userId);
      res.json(streaks);
    } catch (error) {
      res.status(500).json({ message: "Failed to get streaks" });
    }
  });

  app.post("/api/streaks", async (req, res) => {
    try {
      const streakData = {
        ...req.body,
        userId: req.body.userId || DEFAULT_USER_ID,
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

  app.put("/api/streaks/:id", async (req, res) => {
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

  app.delete("/api/streaks/:id", async (req, res) => {
    try {
      await storage.deleteStreak(req.params.id);
      res.json({ message: "Streak deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete streak" });
    }
  });

  // Achievement routes
  app.get("/api/achievements", async (req, res) => {
    try {
      const userId = req.query.userId as string || DEFAULT_USER_ID;
      const achievements = await storage.getAchievements(userId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to get achievements" });
    }
  });

  app.post("/api/achievements", async (req, res) => {
    try {
      const achievementData = {
        ...req.body,
        userId: req.body.userId || DEFAULT_USER_ID,
        id: req.body.id || `achievement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      const achievement = await storage.createAchievement(achievementData);
      res.json(achievement);
    } catch (error) {
      res.status(500).json({ message: "Failed to create achievement" });
    }
  });

  app.put("/api/achievements/:id", async (req, res) => {
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
