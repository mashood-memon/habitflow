import { z } from "zod";
import { pgTable, text, boolean, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";



// Drizzle ORM Tables
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Changed from uuid to text for Clerk IDs
  name: text("name").notNull().default("User"),
  level: integer("level").notNull().default(1),
  totalXP: integer("total_xp").notNull().default(0),
  theme: text("theme", { enum: ["light", "dark"] }).notNull().default("light"),
  joinDate: timestamp("join_date").notNull().defaultNow()
});

export const habits = pgTable("habits", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // Changed from uuid to text
  name: text("name").notNull(),
  description: text("description"),
  category: text("category", { enum: ["Health", "Productivity", "Personal", "Learning", "Social", "Finance"] }).notNull(),
  frequency: text("frequency", { enum: ["daily", "weekly", "custom"] }).notNull(),
  customDays: integer("custom_days").array(),
  target: integer("target"),
  unit: text("unit", { enum: ["minutes", "hours", "pages", "times", "glasses", "sessions"] }),
  icon: text("icon").notNull().default("🎯"),
  createdDate: timestamp("created_date").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true)
});

export const completions = pgTable("completions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // Changed from uuid to text
  habitId: uuid("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD format
  completed: boolean("completed").notNull(),
  value: integer("value"),
  timestamp: timestamp("timestamp").notNull().defaultNow()
});

export const achievements = pgTable("achievements", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // Changed from uuid to text
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  category: text("category", { enum: ["streak", "completion", "level", "consistency", "milestone"] }).notNull(),
  requirement: integer("requirement").notNull(),
  unlockedDate: timestamp("unlocked_date")
});

export const streaks = pgTable("streaks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // Changed from uuid to text
  habitId: uuid("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }),
  current: integer("current").notNull().default(0),
  best: integer("best").notNull().default(0),
  lastCompletionDate: text("last_completion_date")
});

// Create insert schemas using drizzle-zod
export const insertUserSchemaDb = createInsertSchema(users);
export const insertHabitSchemaDb = createInsertSchema(habits);
export const insertCompletionSchemaDb = createInsertSchema(completions);
export const insertAchievementSchemaDb = createInsertSchema(achievements);
export const insertStreakSchemaDb = createInsertSchema(streaks);

// Infer types from tables
export type User = typeof users.$inferSelect;
export type Habit = typeof habits.$inferSelect;
export type Completion = typeof completions.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type Streak = typeof streaks.$inferSelect;

export type InsertUser = typeof users.$inferInsert;
export type InsertHabit = typeof habits.$inferInsert;
export type InsertCompletion = typeof completions.$inferInsert;
export type InsertAchievement = typeof achievements.$inferInsert;
export type InsertStreak = typeof streaks.$inferInsert;
