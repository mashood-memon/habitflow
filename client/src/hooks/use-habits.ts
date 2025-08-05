import { useState, useEffect, useCallback } from "react";
import { Habit, Completion, Streak, InsertHabit } from "@shared/schema";
import { storage } from "@/lib/storage";
import { calculateStreaks, getTodayCompletionStats } from "@/lib/calculations";
import { useToast } from "@/hooks/use-toast";

let CURRENT_USER_ID = 'temp-user-id'; // Will be replaced with actual UUID from server

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
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

  // Get the current user ID from server
  const getCurrentUserId = async () => {
    try {
      const response = await apiCall('/api/default-user');
      CURRENT_USER_ID = response.userId;
      console.log('[API] Got current user ID:', CURRENT_USER_ID);
      return CURRENT_USER_ID;
    } catch (error) {
      console.warn('[API] Failed to get user ID, using fallback');
      return 'temp-user-id';
    }
  };

  // Load data from API with localStorage fallback
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Always try to load from API first - prioritize database
        try {
          console.log('[API] Loading habits data from database...');
          
          // Get the current user ID first
          const userId = await getCurrentUserId();
          
          const [habitsData, completionsData, streaksData] = await Promise.all([
            apiCall(`/api/habits?userId=${userId}`),
            apiCall(`/api/completions?userId=${userId}`),
            apiCall(`/api/streaks?userId=${userId}`)
          ]);

          console.log('[API] Successfully loaded from database:', {
            habits: habitsData.length,
            completions: completionsData.length,
            streaks: streaksData.length
          });

          setHabits(habitsData);
          setCompletions(completionsData);
          setStreaks(streaksData);

          // Save to localStorage as backup after successful API load
          storage.setHabits(habitsData);
          storage.setCompletions(completionsData);
          storage.setStreaks(streaksData);
          
        } catch (apiError) {
          console.error('[API] Failed to load from database:', apiError);
          
          // Only use localStorage if API completely fails AND localStorage has data
          const localHabits = storage.getHabits();
          const localCompletions = storage.getCompletions();
          const localStreaks = storage.getStreaks();

          if (localHabits.length > 0 || localCompletions.length > 0) {
            console.warn('[FALLBACK] Using localStorage data');
            setHabits(localHabits);
            setCompletions(localCompletions);
            
            // Recalculate streaks to ensure accuracy
            const updatedStreaks = calculateStreaks(localHabits, localCompletions);
            setStreaks(updatedStreaks);
            storage.setStreaks(updatedStreaks);
          } else {
            console.warn('[FALLBACK] No localStorage data available, starting fresh');
            // Start with empty arrays if no local data exists
            setHabits([]);
            setCompletions([]);
            setStreaks([]);
          }
        }
        
      } catch (error) {
        console.error('Error loading habits data:', error);
        toast({
          title: "Error",
          description: "Failed to load habits data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const createHabit = useCallback(async (habitData: InsertHabit) => {
    try {
      // Get the current user ID first
      const userId = await getCurrentUserId();
      
      const newHabitData = {
        ...habitData,
        userId,
        // Don't set id, let database generate UUID
        createdDate: new Date(),
        isActive: true
      };

      let newHabit: Habit;
      
      // Try API first
      try {
        newHabit = await apiCall('/api/habits', {
          method: 'POST',
          body: JSON.stringify(newHabitData),
        });
      } catch (apiError) {
        // Fallback to localStorage with generated ID
        console.warn('API unavailable, using localStorage for creating habit');
        newHabit = {
          ...newHabitData,
          id: `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        } as unknown as Habit;
        storage.addHabit(newHabit);
      }

      const updatedHabits = [...habits, newHabit];
      setHabits(updatedHabits);
      
      // Always update localStorage as backup
      storage.addHabit(newHabit);

      // Initialize streak for new habit
      const newStreakData = {
        userId,
        habitId: newHabit.id,
        current: 0,
        best: 0,
        lastCompletionDate: null
      };

      let newStreak: Streak;
      
      // Try API first for streak
      try {
        newStreak = await apiCall('/api/streaks', {
          method: 'POST',
          body: JSON.stringify(newStreakData),
        });
      } catch (apiError) {
        // Fallback to localStorage with generated ID
        newStreak = {
          ...newStreakData,
          id: `streak_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        } as Streak;
        storage.updateStreak(newHabit.id, newStreak);
      }

      const updatedStreaks = [...streaks, newStreak];
      setStreaks(updatedStreaks);
      storage.updateStreak(newHabit.id, newStreak);

      toast({
        title: "Success",
        description: `Habit "${newHabit.name}" created successfully!`
      });

      return newHabit;
    } catch (error) {
      console.error('Error creating habit:', error);
      toast({
        title: "Error",
        description: "Failed to create habit",
        variant: "destructive"
      });
      throw error;
    }
  }, [habits, streaks, toast]);

  const updateHabit = useCallback(async (id: string, updates: Partial<Habit>) => {
    try {
      let updatedHabit: Habit | undefined;
      
      // Try API first
      try {
        updatedHabit = await apiCall(`/api/habits/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
      } catch (apiError) {
        // Fallback to localStorage
        console.warn('API unavailable, using localStorage for updating habit');
        const habitToUpdate = habits.find(h => h.id === id);
        if (habitToUpdate) {
          updatedHabit = { ...habitToUpdate, ...updates };
        }
        storage.updateHabit(id, updates);
      }

      if (updatedHabit) {
        const updatedHabits = habits.map(h => 
          h.id === id ? updatedHabit! : h
        );
        setHabits(updatedHabits);
        
        // Always update localStorage as backup
        storage.updateHabit(id, updates);
      }

      toast({
        title: "Success",
        description: "Habit updated successfully!"
      });
    } catch (error) {
      console.error('Error updating habit:', error);
      toast({
        title: "Error",
        description: "Failed to update habit",
        variant: "destructive"
      });
      throw error;
    }
  }, [habits, toast]);

  const deleteHabit = useCallback(async (id: string) => {
    try {
      const habitToDelete = habits.find(h => h.id === id);
      if (!habitToDelete) return;

      // Try API first
      try {
        await apiCall(`/api/habits/${id}`, {
          method: 'DELETE',
        });
        
        // Also delete related completions and streaks
        const relatedCompletions = completions.filter(c => c.habitId === id);
        const relatedStreaks = streaks.filter(s => s.habitId === id);
        
        await Promise.all([
          ...relatedCompletions.map(c => 
            apiCall(`/api/completions/${c.id}`, { method: 'DELETE' }).catch(() => {})
          ),
          ...relatedStreaks.map(s => 
            apiCall(`/api/streaks/${s.id}`, { method: 'DELETE' }).catch(() => {})
          )
        ]);
      } catch (apiError) {
        // Fallback to localStorage
        console.warn('API unavailable, using localStorage for deleting habit');
        storage.deleteHabit(id);
      }

      const updatedHabits = habits.filter(h => h.id !== id);
      const updatedCompletions = completions.filter(c => c.habitId !== id);
      const updatedStreaks = streaks.filter(s => s.habitId !== id);

      setHabits(updatedHabits);
      setCompletions(updatedCompletions);
      setStreaks(updatedStreaks);

      // Always update localStorage as backup
      storage.deleteHabit(id);

      toast({
        title: "Success",
        description: `Habit "${habitToDelete.name}" deleted successfully!`
      });
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast({
        title: "Error",
        description: "Failed to delete habit",
        variant: "destructive"
      });
      throw error;
    }
  }, [habits, completions, streaks, toast]);

  const toggleHabitCompletion = useCallback(async (habitId: string, date?: string) => {
    try {
      // Get the current user ID first
      const userId = await getCurrentUserId();
      
      const completionDate = date || new Date().toISOString().split('T')[0];
      const existingCompletion = completions.find(c => 
        c.habitId === habitId && c.date === completionDate
      );

      const newCompletionData = {
        // Don't set id for new completions, let database generate UUID
        // Only include id if updating existing completion
        ...(existingCompletion?.id ? { id: existingCompletion.id } : {}),
        userId,
        habitId,
        date: completionDate,
        completed: !existingCompletion?.completed,
        value: null,
        timestamp: new Date()
      };

      let newCompletion: Completion;
      let updatedCompletions: Completion[];

      // Try API first
      try {
        if (existingCompletion) {
          // Update existing completion
          newCompletion = await apiCall(`/api/completions/${existingCompletion.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              completed: newCompletionData.completed,
              timestamp: newCompletionData.timestamp
            }),
          });
          updatedCompletions = completions.map(c => 
            c.id === existingCompletion.id ? newCompletion : c
          );
        } else {
          // Create new completion
          newCompletion = await apiCall('/api/completions', {
            method: 'POST',
            body: JSON.stringify(newCompletionData),
          });
          updatedCompletions = [...completions, newCompletion];
        }
      } catch (apiError) {
        // Fallback to localStorage
        console.warn('API unavailable, using localStorage for completion toggle');
        newCompletion = newCompletionData as Completion;
        
        if (existingCompletion) {
          updatedCompletions = completions.map(c => 
            c.id === existingCompletion.id ? newCompletion : c
          );
        } else {
          updatedCompletions = [...completions, newCompletion];
        }
        storage.addCompletion(newCompletion);
      }

      setCompletions(updatedCompletions);
      // Always update localStorage as backup
      storage.addCompletion(newCompletion);

      // Recalculate streaks
      const updatedStreaks = calculateStreaks(habits, updatedCompletions);
      setStreaks(updatedStreaks);

      // Update streaks in API and localStorage
      try {
        await Promise.all(updatedStreaks.map(async (streak) => {
          try {
            await apiCall(`/api/streaks/${streak.id}`, {
              method: 'PUT',
              body: JSON.stringify(streak),
            });
          } catch (streakApiError) {
            // Fallback to localStorage for streaks
            storage.updateStreak(streak.habitId, streak);
          }
        }));
      } catch (error) {
        console.warn('Error updating streaks via API, using localStorage');
      }
      
      // Always update localStorage as backup
      storage.setStreaks(updatedStreaks);

      const habit = habits.find(h => h.id === habitId);
      const action = newCompletion.completed ? "completed" : "uncompleted";
      
      toast({
        title: "Success",
        description: `${habit?.name} ${action}!`
      });

      return newCompletion;
    } catch (error) {
      console.error('Error toggling habit completion:', error);
      toast({
        title: "Error",
        description: "Failed to update habit completion",
        variant: "destructive"
      });
      throw error;
    }
  }, [habits, completions, toast]);

  const getTodayHabits = useCallback(() => {
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const todayString = new Date().toISOString().split('T')[0];

    return habits.filter(habit => {
      if (!habit.isActive) return false;
      
      switch (habit.frequency) {
        case 'daily':
          return true;
        case 'weekly':
          // Default to Monday for weekly habits if no custom days
          return habit.customDays ? habit.customDays.includes(today) : today === 1;
        case 'custom':
          return habit.customDays ? habit.customDays.includes(today) : false;
        default:
          return true;
      }
    }).map(habit => {
      const todayCompletion = completions.find(c => 
        c.habitId === habit.id && c.date === todayString
      );
      const habitStreak = streaks.find(s => s.habitId === habit.id);
      
      return {
        ...habit,
        completed: todayCompletion?.completed || false,
        currentStreak: habitStreak?.current || 0,
        bestStreak: habitStreak?.best || 0
      };
    });
  }, [habits, completions, streaks]);

  const getTodayStats = useCallback(() => {
    return getTodayCompletionStats(habits, completions);
  }, [habits, completions]);

  return {
    habits,
    completions,
    streaks,
    isLoading,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    getTodayHabits,
    getTodayStats
  };
}
