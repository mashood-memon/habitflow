import { Habit, Completion, Streak } from "@shared/schema";
import { format, parseISO, isToday, subDays, startOfDay } from "date-fns";

export function calculateStreaks(habits: Habit[], completions: Completion[], existingStreaks: Streak[] = []): Streak[] {
  return habits.map(habit => {
    const habitCompletions = completions
      .filter(c => c.habitId === habit.id && c.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (habitCompletions.length === 0) {
      const existingStreak = existingStreaks.find(s => s.habitId === habit.id);
      return { 
        id: existingStreak?.id || '',
        userId: existingStreak?.userId || '',
        habitId: habit.id, 
        current: 0, 
        best: 0, 
        lastCompletionDate: null 
      };
    }

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;
    
    const today = startOfDay(new Date());
    const yesterday = startOfDay(subDays(today, 1));

    // Check if we have a completion today or yesterday to start current streak
    const latestCompletion = parseISO(habitCompletions[0].date);
    if (isToday(latestCompletion) || startOfDay(latestCompletion).getTime() === yesterday.getTime()) {
      currentStreak = 1;
      lastDate = latestCompletion;
      
      // Count consecutive days backward
      for (let i = 1; i < habitCompletions.length; i++) {
        const completionDate = parseISO(habitCompletions[i].date);
        const expectedDate = subDays(lastDate, 1);
        
        if (startOfDay(completionDate).getTime() === startOfDay(expectedDate).getTime()) {
          currentStreak++;
          lastDate = completionDate;
        } else {
          break;
        }
      }
    }

    // Calculate best streak by going through all completions
    for (let i = 0; i < habitCompletions.length; i++) {
      const completionDate = parseISO(habitCompletions[i].date);
      
      if (lastDate === null) {
        tempStreak = 1;
        lastDate = completionDate;
      } else {
        const expectedDate = subDays(lastDate, 1);
        if (startOfDay(completionDate).getTime() === startOfDay(expectedDate).getTime()) {
          tempStreak++;
        } else {
          bestStreak = Math.max(bestStreak, tempStreak);
          tempStreak = 1;
        }
        lastDate = completionDate;
      }
    }
    bestStreak = Math.max(bestStreak, tempStreak, currentStreak);

    return {
      id: existingStreaks.find(s => s.habitId === habit.id)?.id || '',
      userId: existingStreaks.find(s => s.habitId === habit.id)?.userId || '',
      habitId: habit.id,
      current: currentStreak,
      best: bestStreak,
      lastCompletionDate: habitCompletions[0]?.date || null
    };
  });
}

export function calculateXP(completions: Completion[], streaks: Streak[]): number {
  let totalXP = 0;
  
  completions.forEach(completion => {
    if (completion.completed) {
      const streak = streaks.find(s => s.habitId === completion.habitId);
      const baseXP = 10;
      const streakBonus = streak ? Math.floor(streak.current / 7) * 5 : 0; // 5 XP bonus per week of streak
      totalXP += baseXP + streakBonus;
    }
  });
  
  return totalXP;
}

export function calculateLevel(totalXP: number): number {
  // Level progression: Level 1 = 0-99 XP, Level 2 = 100-249 XP, etc.
  // Each level requires 100 + (level * 50) more XP
  let level = 1;
  let xpRequired = 0;
  let currentXP = totalXP;
  
  while (currentXP >= 0) {
    const xpForThisLevel = 100 + ((level - 1) * 50);
    if (currentXP >= xpForThisLevel) {
      currentXP -= xpForThisLevel;
      level++;
    } else {
      break;
    }
  }
  
  return level;
}

export function getXPForNextLevel(totalXP: number): { current: number; required: number } {
  const level = calculateLevel(totalXP);
  const xpForCurrentLevel = 100 + ((level - 1) * 50);
  
  let xpUsed = 0;
  for (let i = 1; i < level; i++) {
    xpUsed += 100 + ((i - 1) * 50);
  }
  
  const currentLevelXP = totalXP - xpUsed;
  
  return {
    current: currentLevelXP,
    required: xpForCurrentLevel
  };
}

export function getTodayCompletionStats(habits: Habit[], completions: Completion[]): {
  completed: number;
  total: number;
  percentage: number;
} {
  const today = format(new Date(), 'yyyy-MM-dd');
  const activeHabits = habits.filter(h => h.isActive);
  
  // Filter habits that should be completed today based on frequency
  const todayHabits = activeHabits.filter(habit => {
    if (habit.frequency === 'daily') return true;
    if (habit.frequency === 'weekly') {
      // For weekly habits, check if today is in custom days or default to Monday
      const today = new Date().getDay();
      return habit.customDays ? habit.customDays.includes(today) : today === 1;
    }
    if (habit.frequency === 'custom' && habit.customDays) {
      const today = new Date().getDay();
      return habit.customDays.includes(today);
    }
    return false;
  });

  const todayCompletions = completions.filter(c => 
    c.date === today && 
    c.completed && 
    todayHabits.some(h => h.id === c.habitId)
  );

  const completed = todayCompletions.length;
  const total = todayHabits.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percentage };
}

export function getWeeklyCompletionRate(habits: Habit[], completions: Completion[]): number {
  const today = new Date();
  const weekAgo = subDays(today, 7);
  
  const weekCompletions = completions.filter(c => {
    const completionDate = parseISO(c.date);
    return completionDate >= weekAgo && completionDate <= today && c.completed;
  });

  const weekDays = 7;
  const activeHabits = habits.filter(h => h.isActive);
  const expectedCompletions = activeHabits.length * weekDays; // Simplified for daily habits
  
  if (expectedCompletions === 0) return 0;
  
  return Math.round((weekCompletions.length / expectedCompletions) * 100);
}

export function getHeatMapData(completions: Completion[], days: number = 365): Array<{
  date: string;
  count: number;
  level: number;
}> {
  const endDate = new Date();
  const startDate = subDays(endDate, days - 1);
  
  const heatMapData: Array<{ date: string; count: number; level: number }> = [];
  
  for (let i = 0; i < days; i++) {
    const currentDate = subDays(endDate, days - 1 - i);
    const dateString = format(currentDate, 'yyyy-MM-dd');
    
    const dayCompletions = completions.filter(c => 
      c.date === dateString && c.completed
    ).length;
    
    // Convert count to level (0-4 for styling)
    let level = 0;
    if (dayCompletions > 0) level = 1;
    if (dayCompletions >= 3) level = 2;
    if (dayCompletions >= 5) level = 3;
    if (dayCompletions >= 8) level = 4;
    
    heatMapData.push({
      date: dateString,
      count: dayCompletions,
      level
    });
  }
  
  return heatMapData;
}
