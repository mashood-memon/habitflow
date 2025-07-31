import { z } from "zod";

export const habitSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Habit name is required"),
  description: z.string().optional(),
  category: z.enum(["Health", "Productivity", "Personal", "Learning", "Social", "Finance"]),
  frequency: z.enum(["daily", "weekly", "custom"]),
  customDays: z.array(z.number().min(0).max(6)).optional(), // 0-6 for Sunday-Saturday
  target: z.number().optional(),
  unit: z.enum(["minutes", "hours", "pages", "times", "glasses", "sessions"]).optional(),
  icon: z.string().default("🎯"),
  createdDate: z.string(),
  isActive: z.boolean().default(true)
});

export const completionSchema = z.object({
  id: z.string(),
  habitId: z.string(),
  date: z.string(), // YYYY-MM-DD format
  completed: z.boolean(),
  value: z.number().optional(), // actual value if target is set
  timestamp: z.string() // ISO string
});

export const achievementSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  category: z.enum(["streak", "completion", "level", "consistency", "milestone"]),
  requirement: z.number(), // threshold for unlocking
  unlockedDate: z.string().optional() // ISO string when unlocked
});

export const userSchema = z.object({
  id: z.string(),
  name: z.string().default("User"),
  level: z.number().default(1),
  totalXP: z.number().default(0),
  theme: z.enum(["light", "dark"]).default("light"),
  joinDate: z.string()
});

export const streakSchema = z.object({
  habitId: z.string(),
  current: z.number().default(0),
  best: z.number().default(0),
  lastCompletionDate: z.string().optional()
});

export type Habit = z.infer<typeof habitSchema>;
export type Completion = z.infer<typeof completionSchema>;
export type Achievement = z.infer<typeof achievementSchema>;
export type User = z.infer<typeof userSchema>;
export type Streak = z.infer<typeof streakSchema>;

export const insertHabitSchema = habitSchema.omit({ id: true, createdDate: true });
export const insertCompletionSchema = completionSchema.omit({ id: true, timestamp: true });
export const insertUserSchema = userSchema.omit({ id: true, joinDate: true });

export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type InsertCompletion = z.infer<typeof insertCompletionSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
