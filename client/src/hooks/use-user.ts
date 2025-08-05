import { useState, useEffect, useCallback } from "react";
import { User, Achievement } from "@shared/schema";
import { storage } from "@/lib/storage";
import { calculateXP, calculateLevel, getXPForNextLevel } from "@/lib/calculations";
import { checkNewAchievements, DEFAULT_ACHIEVEMENTS } from "@/lib/achievements";
import { useLocalStorage } from "./use-local-storage";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_USER_ID = 'temp-user-id';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [theme, setTheme] = useLocalStorage<"light" | "dark">("theme", "light");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // API helper functions with localStorage fallback
  const apiCall = async (url: string, options?: RequestInit) => {
    console.log(`[API] Calling: ${options?.method || 'GET'} ${url}`);
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`[API] Success: ${url}`, data);
      return data;
    } catch (error) {
      console.error(`[API] Failed: ${url}`, error);
      throw error; // Re-throw to handle in calling code
    }
  };

  // Load user data and initialize achievements from API with localStorage fallback
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        
        // Always try to load from API first - prioritize database
        try {
          console.log('[API] Loading user data from database...');
          const [userData, achievementsData] = await Promise.all([
            apiCall(`/api/user/${DEFAULT_USER_ID}`).catch(() => null),
            apiCall(`/api/achievements?userId=${DEFAULT_USER_ID}`)
          ]);

          console.log('[API] User data loaded:', {
            user: userData ? 'found' : 'not found',
            achievements: achievementsData ? achievementsData.length : 0
          });

          if (userData) {
            setUser(userData);
            // Save to localStorage as backup after successful API load
            storage.updateUser(userData);
          } else {
            // Create default user if not found in database
            const defaultUser = {
              id: DEFAULT_USER_ID,
              name: 'User',
              level: 1,
              totalXP: 0,
              theme: theme,
              joinDate: new Date().toISOString()
            };
            
            try {
              console.log('[API] Creating new user in database...');
              const createdUser = await apiCall('/api/user', {
                method: 'POST',
                body: JSON.stringify(defaultUser),
              });
              setUser(createdUser);
              storage.updateUser(createdUser);
              console.log('[API] New user created successfully');
            } catch (createError) {
              console.error('[API] Failed to create user, using localStorage fallback');
              const localUser = storage.getUser();
              setUser(localUser);
            }
          }

          let userAchievements = achievementsData;
          
          // Initialize default achievements if none exist in database
          if (!userAchievements || userAchievements.length === 0) {
            console.log('[API] No achievements found, creating defaults...');
            userAchievements = DEFAULT_ACHIEVEMENTS.map(achievement => ({
              ...achievement,
              userId: DEFAULT_USER_ID,
              unlockedDate: null
            }));
            
            // Try to save to API
            try {
              await Promise.all(userAchievements.map((achievement: Achievement) =>
                apiCall('/api/achievements', {
                  method: 'POST',
                  body: JSON.stringify(achievement),
                }).catch((err) => console.warn('Failed to save achievement:', achievement.id, err))
              ));
              console.log('[API] Default achievements created in database');
            } catch (error) {
              console.warn('Failed to save achievements to API');
            }
          }
          
          setAchievements(userAchievements);
          // Save to localStorage as backup after successful API load
          storage.setAchievements(userAchievements);
          
        } catch (apiError) {
          console.error('[API] Failed to load user data from database:', apiError);
          
          // Only use localStorage if it has meaningful data
          const localUser = storage.getUser();
          const localAchievements = storage.getAchievements();

          if (localUser.id) {
            console.warn('[FALLBACK] Using localStorage user data');
            setUser(localUser);
          } else {
            console.warn('[FALLBACK] No local user data, creating default');
            const defaultUser = storage.getUser(); // This creates default user
            setUser(defaultUser);
          }

          if (localAchievements.length > 0) {
            setAchievements(localAchievements);
          } else {
            // Initialize default achievements in localStorage
            const defaultAchievements = DEFAULT_ACHIEVEMENTS.map(achievement => ({
              ...achievement,
              unlockedDate: null
            }));
            storage.setAchievements(defaultAchievements);
            setAchievements(defaultAchievements);
          }
        }
        
      } catch (error) {
        console.error('Error loading user data:', error);
        toast({
          title: "Error",
          description: "Failed to load user data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [theme, toast]);

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
      const updateUserTheme = async () => {
        try {
          await apiCall(`/api/user/${user.id}`, {
            method: 'PUT',
            body: JSON.stringify({ theme }),
          });
        } catch (apiError) {
          // Fallback to localStorage
          storage.updateUser({ theme });
        }
        // Always update localStorage as backup
        storage.updateUser({ theme });
      };
      
      updateUserTheme();
      setUser(prev => prev ? { ...prev, theme } : null);
    }
  }, [theme, user]);

  const updateUserStats = useCallback(async (habits: any[], completions: any[], streaks: any[]) => {
    if (!user) return;

    try {
      const totalXP = calculateXP(completions, streaks);
      const level = calculateLevel(totalXP);

      const updatedUserData = { totalXP, level };
      
      // Try API first
      try {
        const updatedUser = await apiCall(`/api/user/${user.id}`, {
          method: 'PUT',
          body: JSON.stringify(updatedUserData),
        });
        setUser(updatedUser);
      } catch (apiError) {
        // Fallback to localStorage
        console.warn('API unavailable, using localStorage for user stats update');
        const updatedUser = { ...user, ...updatedUserData };
        setUser(updatedUser);
        storage.updateUser(updatedUserData);
      }
      
      // Always update localStorage as backup
      storage.updateUser(updatedUserData);

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
        
        // Try to update achievements in API
        try {
          await Promise.all(newAchievements.map(achievement =>
            apiCall(`/api/achievements/${achievement.id}`, {
              method: 'PUT',
              body: JSON.stringify(achievement),
            }).catch(() => {})
          ));
        } catch (error) {
          console.warn('Failed to update achievements via API');
        }
        
        // Always update localStorage as backup
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

  const updateUserProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) return;

    try {
      // Try API first
      try {
        const updatedUser = await apiCall(`/api/user/${user.id}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
        setUser(updatedUser);
      } catch (apiError) {
        // Fallback to localStorage
        console.warn('API unavailable, using localStorage for profile update');
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        storage.updateUser(updates);
      }
      
      // Always update localStorage as backup
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
