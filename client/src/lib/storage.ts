import { Habit, Completion, Achievement, User, Streak } from "@shared/schema";

const STORAGE_KEYS = {
  HABITS: 'habitflow_habits',
  COMPLETIONS: 'habitflow_completions',
  ACHIEVEMENTS: 'habitflow_achievements',
  USER: 'habitflow_user',
  STREAKS: 'habitflow_streaks'
} as const;

export class LocalStorage {
  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setItem(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  // Habits
  getHabits(): Habit[] {
    return this.getItem(STORAGE_KEYS.HABITS, []);
  }

  setHabits(habits: Habit[]): void {
    this.setItem(STORAGE_KEYS.HABITS, habits);
  }

  addHabit(habit: Habit): void {
    const habits = this.getHabits();
    habits.push(habit);
    this.setHabits(habits);
  }

  updateHabit(id: string, updates: Partial<Habit>): void {
    const habits = this.getHabits();
    const index = habits.findIndex(h => h.id === id);
    if (index !== -1) {
      habits[index] = { ...habits[index], ...updates };
      this.setHabits(habits);
    }
  }

  deleteHabit(id: string): void {
    const habits = this.getHabits().filter(h => h.id !== id);
    this.setHabits(habits);
    
    // Also clean up related data
    const completions = this.getCompletions().filter(c => c.habitId !== id);
    this.setCompletions(completions);
    
    const streaks = this.getStreaks().filter(s => s.habitId !== id);
    this.setStreaks(streaks);
  }

  // Completions
  getCompletions(): Completion[] {
    return this.getItem(STORAGE_KEYS.COMPLETIONS, []);
  }

  setCompletions(completions: Completion[]): void {
    this.setItem(STORAGE_KEYS.COMPLETIONS, completions);
  }

  addCompletion(completion: Completion): void {
    const completions = this.getCompletions();
    // Remove existing completion for same habit and date
    const filtered = completions.filter(c => 
      !(c.habitId === completion.habitId && c.date === completion.date)
    );
    filtered.push(completion);
    this.setCompletions(filtered);
  }

  // User
  getUser(): User {
    const defaultUser: User = {
      id: 'user_1',
      name: 'User',
      level: 1,
      totalXP: 0,
      theme: 'light',
      joinDate: new Date().toISOString()
    };
    return this.getItem(STORAGE_KEYS.USER, defaultUser);
  }

  setUser(user: User): void {
    this.setItem(STORAGE_KEYS.USER, user);
  }

  updateUser(updates: Partial<User>): void {
    const user = this.getUser();
    this.setUser({ ...user, ...updates });
  }

  // Achievements
  getAchievements(): Achievement[] {
    return this.getItem(STORAGE_KEYS.ACHIEVEMENTS, []);
  }

  setAchievements(achievements: Achievement[]): void {
    this.setItem(STORAGE_KEYS.ACHIEVEMENTS, achievements);
  }

  unlockAchievement(achievementId: string): void {
    const achievements = this.getAchievements();
    const achievement = achievements.find(a => a.id === achievementId);
    if (achievement && !achievement.unlockedDate) {
      achievement.unlockedDate = new Date().toISOString();
      this.setAchievements(achievements);
    }
  }

  // Streaks
  getStreaks(): Streak[] {
    return this.getItem(STORAGE_KEYS.STREAKS, []);
  }

  setStreaks(streaks: Streak[]): void {
    this.setItem(STORAGE_KEYS.STREAKS, streaks);
  }

  updateStreak(habitId: string, updates: Partial<Streak>): void {
    const streaks = this.getStreaks();
    const index = streaks.findIndex(s => s.habitId === habitId);
    if (index !== -1) {
      streaks[index] = { ...streaks[index], ...updates };
    } else {
      streaks.push({ habitId, current: 0, best: 0, ...updates });
    }
    this.setStreaks(streaks);
  }

  // Data export/import
  exportData(): string {
    const data = {
      habits: this.getHabits(),
      completions: this.getCompletions(),
      achievements: this.getAchievements(),
      user: this.getUser(),
      streaks: this.getStreaks(),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.habits) this.setHabits(data.habits);
      if (data.completions) this.setCompletions(data.completions);
      if (data.achievements) this.setAchievements(data.achievements);
      if (data.user) this.setUser(data.user);
      if (data.streaks) this.setStreaks(data.streaks);
      
      return true;
    } catch {
      return false;
    }
  }

  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}

export const storage = new LocalStorage();
