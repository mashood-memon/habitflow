import { users, habits, completions, achievements, streaks, type User, type InsertUser, type Habit, type InsertHabit, type Completion, type InsertCompletion, type Achievement, type InsertAchievement, type Streak, type InsertStreak } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  
  // Habit methods
  getHabits(userId: string): Promise<Habit[]>;
  getHabit(id: string): Promise<Habit | undefined>;
  createHabit(habit: InsertHabit): Promise<Habit>;
  updateHabit(id: string, data: Partial<InsertHabit>): Promise<Habit | undefined>;
  deleteHabit(id: string): Promise<void>;
  
  // Completion methods
  getCompletions(userId: string, startDate?: string, endDate?: string): Promise<Completion[]>;
  createCompletion(completion: InsertCompletion): Promise<Completion>;
  updateCompletion(id: string, data: Partial<InsertCompletion>): Promise<Completion | undefined>;
  deleteCompletion(id: string): Promise<void>;
  
  // Achievement methods
  getAchievements(userId: string): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  updateAchievement(id: string, data: Partial<InsertAchievement>): Promise<Achievement | undefined>;
  
  // Streak methods
  getStreaks(userId: string): Promise<Streak[]>;
  createStreak(streak: InsertStreak): Promise<Streak>;
  updateStreak(id: string, data: Partial<InsertStreak>): Promise<Streak | undefined>;
  deleteStreak(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Habit methods
  async getHabits(userId: string): Promise<Habit[]> {
    return await db.select().from(habits).where(eq(habits.userId, userId));
  }

  async getHabit(id: string): Promise<Habit | undefined> {
    const [habit] = await db.select().from(habits).where(eq(habits.id, id));
    return habit || undefined;
  }

  async createHabit(habit: InsertHabit): Promise<Habit> {
    const [newHabit] = await db
      .insert(habits)
      .values(habit)
      .returning();
    return newHabit;
  }

  async updateHabit(id: string, data: Partial<InsertHabit>): Promise<Habit | undefined> {
    const [habit] = await db
      .update(habits)
      .set(data)
      .where(eq(habits.id, id))
      .returning();
    return habit || undefined;
  }

  async deleteHabit(id: string): Promise<void> {
    await db.delete(habits).where(eq(habits.id, id));
  }

  // Completion methods
  async getCompletions(userId: string, startDate?: string, endDate?: string): Promise<Completion[]> {
    if (startDate && endDate) {
      return await db.select().from(completions).where(
        and(
          eq(completions.userId, userId),
          gte(completions.date, startDate),
          lte(completions.date, endDate)
        )
      ).orderBy(desc(completions.date));
    }
    
    return await db.select().from(completions)
      .where(eq(completions.userId, userId))
      .orderBy(desc(completions.date));
  }

  async createCompletion(completion: InsertCompletion): Promise<Completion> {
    const [newCompletion] = await db
      .insert(completions)
      .values(completion)
      .returning();
    return newCompletion;
  }

  async updateCompletion(id: string, data: Partial<InsertCompletion>): Promise<Completion | undefined> {
    const [completion] = await db
      .update(completions)
      .set(data)
      .where(eq(completions.id, id))
      .returning();
    return completion || undefined;
  }

  async deleteCompletion(id: string): Promise<void> {
    await db.delete(completions).where(eq(completions.id, id));
  }

  // Achievement methods
  async getAchievements(userId: string): Promise<Achievement[]> {
    return await db.select().from(achievements).where(eq(achievements.userId, userId));
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db
      .insert(achievements)
      .values(achievement)
      .returning();
    return newAchievement;
  }

  async updateAchievement(id: string, data: Partial<InsertAchievement>): Promise<Achievement | undefined> {
    const [achievement] = await db
      .update(achievements)
      .set(data)
      .where(eq(achievements.id, id))
      .returning();
    return achievement || undefined;
  }

  // Streak methods
  async getStreaks(userId: string): Promise<Streak[]> {
    return await db.select().from(streaks).where(eq(streaks.userId, userId));
  }

  async createStreak(streak: InsertStreak): Promise<Streak> {
    const [newStreak] = await db
      .insert(streaks)
      .values(streak)
      .returning();
    return newStreak;
  }

  async updateStreak(id: string, data: Partial<InsertStreak>): Promise<Streak | undefined> {
    const [streak] = await db
      .update(streaks)
      .set(data)
      .where(eq(streaks.id, id))
      .returning();
    return streak || undefined;
  }

  async deleteStreak(id: string): Promise<void> {
    await db.delete(streaks).where(eq(streaks.id, id));
  }
}

export const storage = new DatabaseStorage();
