import { useState, useEffect, useCallback } from "react";
import { User, Achievement } from "@shared/schema";
import { storage } from "@/lib/storage";
import { calculateXP, calculateLevel, getXPForNextLevel } from "@/lib/calculations";
import { checkNewAchievements, DEFAULT_ACHIEVEMENTS } from "@/lib/achievements";
import { useLocalStorage } from "./use-local-storage";
import { useToast } from "@/hooks/use-toast";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [theme, setTheme] = useLocalStorage<"light" | "dark">("theme", "light");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load user data and initialize achievements
  useEffect(() => {
    try {
      const userData = storage.getUser();
      setUser(userData);

      let userAchievements = storage.getAchievements();
      
      // Initialize default achievements if none exist
      if (userAchievements.length === 0) {
        userAchievements = DEFAULT_ACHIEVEMENTS.map(achievement => ({
          ...achievement,
          unlockedDate: undefined
        }));
        storage.setAchievements(userAchievements);
      }
      
      setAchievements(userAchievements);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  }, [toast]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Update user theme in storage when theme changes
  useEffect(() => {
    if (user && user.theme !== theme) {
      storage.updateUser({ theme });
      setUser(prev => prev ? { ...prev, theme } : null);
    }
  }, [theme]);

  const updateUserStats = useCallback((habits: any[], completions: any[], streaks: any[]) => {
    if (!user) return;

    try {
      const totalXP = calculateXP(completions, streaks);
      const level = calculateLevel(totalXP);

      const updatedUser = { ...user, totalXP, level };
      setUser(updatedUser);
      storage.updateUser({ totalXP, level });

      // Check for new achievements
      const newAchievements = checkNewAchievements(
        achievements,
        habits,
        completions,
        streaks,
        level
      );

      if (newAchievements.length > 0) {
        // Update achievements with new unlocks
        const updatedAchievements = achievements.map(achievement => {
          const newAchievement = newAchievements.find(na => na.id === achievement.id);
          return newAchievement || achievement;
        });

        // Add any completely new achievements
        const existingIds = achievements.map(a => a.id);
        const brandNewAchievements = newAchievements.filter(na => 
          !existingIds.includes(na.id)
        );
        
        const finalAchievements = [...updatedAchievements, ...brandNewAchievements];
        setAchievements(finalAchievements);
        storage.setAchievements(finalAchievements);

        // Show notifications for new achievements
        newAchievements.forEach(achievement => {
          toast({
            title: "🎉 Achievement Unlocked!",
            description: `${achievement.icon} ${achievement.name}: ${achievement.description}`,
          });
        });
      }
    } catch (error) {
      console.error('Error updating user stats:', error);
      toast({
        title: "Error",
        description: "Failed to update user statistics",
        variant: "destructive"
      });
    }
  }, [user, achievements, toast]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  }, [setTheme]);

  const updateUserProfile = useCallback((updates: Partial<User>) => {
    if (!user) return;

    try {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      storage.updateUser(updates);

      toast({
        title: "Success",
        description: "Profile updated successfully!"
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  const getXPProgress = useCallback(() => {
    if (!user) return { current: 0, required: 100, percentage: 0 };
    return {
      ...getXPForNextLevel(user.totalXP),
      percentage: Math.round((getXPForNextLevel(user.totalXP).current / getXPForNextLevel(user.totalXP).required) * 100)
    };
  }, [user]);

  const getUnlockedAchievements = useCallback(() => {
    return achievements.filter(a => a.unlockedDate);
  }, [achievements]);

  const getLockedAchievements = useCallback(() => {
    return achievements.filter(a => !a.unlockedDate);
  }, [achievements]);

  return {
    user,
    achievements,
    theme,
    isLoading,
    updateUserStats,
    toggleTheme,
    updateUserProfile,
    getXPProgress,
    getUnlockedAchievements,
    getLockedAchievements
  };
}
