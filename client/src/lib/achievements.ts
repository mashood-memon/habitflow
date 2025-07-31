import { Achievement, Habit, Completion, Streak } from "@shared/schema";

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_habit",
    name: "Getting Started",
    description: "Complete your first habit",
    icon: "🎯",
    category: "milestone",
    requirement: 1
  },
  {
    id: "week_streak",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "🔥",
    category: "streak",
    requirement: 7
  },
  {
    id: "month_streak",
    name: "Month Master",
    description: "Maintain a 30-day streak",
    icon: "💪",
    category: "streak",
    requirement: 30
  },
  {
    id: "perfect_week",
    name: "Perfect Week",
    description: "Complete all habits for a full week",
    icon: "⭐",
    category: "consistency",
    requirement: 7
  },
  {
    id: "hundred_completions",
    name: "Century Club",
    description: "Complete 100 total habits",
    icon: "💯",
    category: "completion",
    requirement: 100
  },
  {
    id: "level_5",
    name: "Rising Star",
    description: "Reach level 5",
    icon: "🌟",
    category: "level",
    requirement: 5
  },
  {
    id: "level_10",
    name: "Habit Hero",
    description: "Reach level 10",
    icon: "🦸‍♂️",
    category: "level",
    requirement: 10
  },
  {
    id: "level_25",
    name: "Legendary",
    description: "Reach level 25",
    icon: "👑",
    category: "level",
    requirement: 25
  },
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Complete all morning habits for 5 days",
    icon: "🐦",
    category: "consistency",
    requirement: 5
  },
  {
    id: "habit_collector",
    name: "Habit Collector",
    description: "Create 10 different habits",
    icon: "📚",
    category: "milestone",
    requirement: 10
  }
];

export function checkNewAchievements(
  currentAchievements: Achievement[],
  habits: Habit[],
  completions: Completion[],
  streaks: Streak[],
  userLevel: number
): Achievement[] {
  const newUnlocks: Achievement[] = [];
  const completedCompletions = completions.filter(c => c.completed);
  
  DEFAULT_ACHIEVEMENTS.forEach(achievement => {
    const existingAchievement = currentAchievements.find(a => a.id === achievement.id);
    
    // Skip if already unlocked
    if (existingAchievement?.unlockedDate) return;
    
    let shouldUnlock = false;
    
    switch (achievement.category) {
      case "milestone":
        if (achievement.id === "first_habit") {
          shouldUnlock = completedCompletions.length >= 1;
        } else if (achievement.id === "habit_collector") {
          shouldUnlock = habits.length >= achievement.requirement;
        }
        break;
        
      case "streak":
        const maxStreak = Math.max(...streaks.map(s => s.current), 0);
        shouldUnlock = maxStreak >= achievement.requirement;
        break;
        
      case "completion":
        shouldUnlock = completedCompletions.length >= achievement.requirement;
        break;
        
      case "level":
        shouldUnlock = userLevel >= achievement.requirement;
        break;
        
      case "consistency":
        if (achievement.id === "perfect_week") {
          // Check if user had a perfect week (all habits completed for 7 consecutive days)
          shouldUnlock = checkPerfectWeek(habits, completions);
        }
        break;
    }
    
    if (shouldUnlock) {
      const unlockedAchievement = {
        ...achievement,
        unlockedDate: new Date().toISOString()
      };
      
      if (existingAchievement) {
        // Update existing achievement
        existingAchievement.unlockedDate = unlockedAchievement.unlockedDate;
      } else {
        // Add new achievement
        newUnlocks.push(unlockedAchievement);
      }
    }
  });
  
  return newUnlocks;
}

function checkPerfectWeek(habits: Habit[], completions: Completion[]): boolean {
  // Check last 7 days for perfect completion
  const today = new Date();
  const activeHabits = habits.filter(h => h.isActive);
  
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateString = checkDate.toISOString().split('T')[0];
    
    const dayCompletions = completions.filter(c => 
      c.date === dateString && c.completed
    );
    
    // For perfect week, need to complete all active habits each day
    if (dayCompletions.length < activeHabits.length) {
      return false;
    }
  }
  
  return activeHabits.length > 0; // Must have at least one habit
}

export function getAchievementProgress(
  achievement: Achievement,
  habits: Habit[],
  completions: Completion[],
  streaks: Streak[],
  userLevel: number
): { current: number; required: number; percentage: number } {
  let current = 0;
  const required = achievement.requirement;
  
  const completedCompletions = completions.filter(c => c.completed);
  
  switch (achievement.category) {
    case "milestone":
      if (achievement.id === "first_habit") {
        current = Math.min(completedCompletions.length, 1);
      } else if (achievement.id === "habit_collector") {
        current = habits.length;
      }
      break;
      
    case "streak":
      current = Math.max(...streaks.map(s => s.current), 0);
      break;
      
    case "completion":
      current = completedCompletions.length;
      break;
      
    case "level":
      current = userLevel;
      break;
      
    case "consistency":
      if (achievement.id === "perfect_week") {
        current = checkPerfectWeek(habits, completions) ? 7 : 0;
      }
      break;
  }
  
  const percentage = Math.min(Math.round((current / required) * 100), 100);
  
  return { current, required, percentage };
}
