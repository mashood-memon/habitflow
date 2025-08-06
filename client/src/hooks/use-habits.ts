import { useState, useEffect, useCallback } from 'react';
import { useUser as useClerkUser, useAuth } from '@clerk/clerk-react';
import { Habit, Completion, Streak, InsertHabit } from "@shared/schema";
import { storage } from "@/lib/storage";
import { calculateStreaks, getTodayCompletionStats } from "@/lib/calculations";
import { useToast } from "@/hooks/use-toast";

export function useHabits() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useClerkUser();
  const { getToken } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // API helper functions with authentication
  const apiCall = async (url: string, options?: RequestInit) => {
    console.log(`[API] Calling: ${options?.method || 'GET'} ${url}`);
    
    try {
      // Get JWT token from Clerk
      const token = await getToken();
      console.log('[API] Token obtained:', !!token);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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

  // Get the current user ID from Clerk
  const getCurrentUserId = () => {
    if (!clerkUser?.id) {
      console.error('[HABITS] Clerk user not found:', clerkUser);
      throw new Error('User not authenticated - Clerk user ID is undefined');
    }
    console.log('[HABITS] Using Clerk user ID:', clerkUser.id);
    return clerkUser.id;
  };

  // Load data from API with localStorage fallback
  useEffect(() => {
    // Don't load data if Clerk hasn't loaded yet or user is not authenticated
    if (!clerkLoaded || !clerkUser?.id) {
      console.log('[HABITS] Waiting for Clerk to load or user to authenticate');
      console.log('[HABITS] Clerk loaded:', clerkLoaded);
      console.log('[HABITS] Clerk user ID:', clerkUser?.id);
      if (clerkLoaded && !clerkUser?.id) {
        // Clerk loaded but no user - this means user is not signed in
        setIsLoading(false);
      }
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Always try to load from API first - prioritize database
        try {
          console.log('[API] Loading habits data from database...');
          
          // Get the current user ID first
          const userId = getCurrentUserId();
          
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
  }, [toast, clerkLoaded, clerkUser?.id]);

  const createHabit = useCallback(async (habitData: InsertHabit) => {
    try {
      // Get the current user ID first
      const userId = getCurrentUserId();
      console.log('[HABITS] Creating habit for user ID:', userId);
      
      const newHabitData = {
        ...habitData,
        userId,
        // Don't set id, let database generate UUID
        createdDate: new Date(),
        isActive: true
      };

      let newHabit: Habit;
      let isApiSuccess = false;
      
      // Try API first
      try {
        console.log('[HABITS] Attempting to create habit via API...');
        newHabit = await apiCall('/api/habits', {
          method: 'POST',
          body: JSON.stringify(newHabitData),
        });
        
        console.log('[API] Habit created successfully in database:', newHabit);
        isApiSuccess = true;
        
        // Update localStorage as backup only after successful API call
        storage.setHabits([...habits, newHabit]);
        
      } catch (apiError) {
        console.error('[API] Failed to create habit in database:', apiError);
        
        // Check if this is a user not found error
        if (apiError instanceof Error && apiError.message.includes('User not found')) {
          toast({
            title: "User Setup Required",
            description: "Please wait while we set up your account...",
            variant: "destructive"
          });
          throw new Error('User not found in database. Please retry after account setup.');
        }
        
        // Fallback to localStorage with generated ID
        console.warn('API unavailable, using localStorage for creating habit');
        newHabit = {
          ...newHabitData,
          id: `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        } as unknown as Habit;
        
        // Save to localStorage only
        storage.setHabits([...habits, newHabit]);
      }

      // Update state with the new habit (either from API or localStorage)
      setHabits(prev => [...prev, newHabit]);

      // Only create streaks and completions if the API call was successful
      // Don't create them for localStorage-only habits as the IDs won't work with the API
      if (isApiSuccess) {
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
          
          console.log('[API] Streak created successfully in database:', newStreak);
          
          // Update localStorage as backup only after successful API call
          const updatedStreaks = [...streaks, newStreak];
          setStreaks(updatedStreaks);
          storage.setStreaks(updatedStreaks);
          
        } catch (apiError) {
          console.error('[API] Failed to create streak in database:', apiError);
          
          // Don't create local streak since the habit is in the database
          // This would cause inconsistency
          console.warn('Skipping streak creation due to API failure');
        }
      } else {
        console.warn('Skipping streak creation for localStorage-only habit');
      }

      toast({
        title: "Success",
        description: `Habit "${newHabit.name}" created successfully!`
      });

      return newHabit;
    } catch (error) {
      console.error('Error creating habit:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create habit",
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
      const userId = getCurrentUserId();
      
      const completionDate = date || new Date().toISOString().split('T')[0];
      const existingCompletion = completions.find(c => 
        c.habitId === habitId && c.date === completionDate
      );

      // Check if this is a localStorage-only habit (non-UUID ID)
      const isLocalHabit = habitId.startsWith('habit_');
      
      if (isLocalHabit) {
        // Handle localStorage-only habits
        console.warn('Toggling completion for localStorage-only habit');
        
        const newCompletionData = {
          id: `completion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          habitId,
          date: completionDate,
          completed: !existingCompletion?.completed,
          value: null,
          timestamp: new Date()
        } as Completion;

        let updatedCompletions: Completion[];
        
        if (existingCompletion) {
          updatedCompletions = completions.map(c => 
            c.id === existingCompletion.id ? { ...existingCompletion, completed: newCompletionData.completed, timestamp: newCompletionData.timestamp } : c
          );
        } else {
          updatedCompletions = [...completions, newCompletionData];
        }
        
        setCompletions(updatedCompletions);
        storage.setCompletions(updatedCompletions);

        const habit = habits.find(h => h.id === habitId);
        const action = newCompletionData.completed ? "completed" : "uncompleted";
        
        toast({
          title: "Success",
          description: `${habit?.name} ${action}!`
        });

        return newCompletionData;
      }

      // Handle database habits (normal flow)
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
        
        console.log('[API] Completion toggled successfully in database:', newCompletion);
        
        // Update localStorage as backup only after successful API call
        setCompletions(updatedCompletions);
        storage.setCompletions(updatedCompletions);
        
      } catch (apiError) {
        console.error('[API] Failed to toggle completion in database:', apiError);
        
        // Fallback to localStorage with generated ID if needed
        console.warn('API unavailable, using localStorage for completion toggle');
        
        if (existingCompletion) {
          newCompletion = { ...existingCompletion, ...newCompletionData } as Completion;
          updatedCompletions = completions.map(c => 
            c.id === existingCompletion.id ? newCompletion : c
          );
        } else {
          newCompletion = {
            ...newCompletionData,
            id: `completion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          } as Completion;
          updatedCompletions = [...completions, newCompletion];
        }
        
        // Save to localStorage only
        setCompletions(updatedCompletions);
        storage.setCompletions(updatedCompletions);
      }

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
