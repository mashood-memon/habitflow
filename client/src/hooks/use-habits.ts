import { useState, useEffect, useCallback } from "react";
import { Habit, Completion, Streak, InsertHabit } from "@shared/schema";
import { storage } from "@/lib/storage";
import { calculateStreaks, getTodayCompletionStats } from "@/lib/calculations";
import { useToast } from "@/hooks/use-toast";

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load data from localStorage
  useEffect(() => {
    try {
      const loadedHabits = storage.getHabits();
      const loadedCompletions = storage.getCompletions();
      const loadedStreaks = storage.getStreaks();

      setHabits(loadedHabits);
      setCompletions(loadedCompletions);
      
      // Recalculate streaks to ensure accuracy
      const updatedStreaks = calculateStreaks(loadedHabits, loadedCompletions);
      setStreaks(updatedStreaks);
      storage.setStreaks(updatedStreaks);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading habits data:', error);
      toast({
        title: "Error",
        description: "Failed to load habits data",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  }, [toast]);

  const createHabit = useCallback((habitData: InsertHabit) => {
    try {
      const newHabit: Habit = {
        ...habitData,
        id: `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdDate: new Date().toISOString(),
        isActive: true
      };

      const updatedHabits = [...habits, newHabit];
      setHabits(updatedHabits);
      storage.addHabit(newHabit);

      // Initialize streak for new habit
      const newStreak: Streak = {
        habitId: newHabit.id,
        current: 0,
        best: 0
      };
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

  const updateHabit = useCallback((id: string, updates: Partial<Habit>) => {
    try {
      const updatedHabits = habits.map(h => 
        h.id === id ? { ...h, ...updates } : h
      );
      setHabits(updatedHabits);
      storage.updateHabit(id, updates);

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

  const deleteHabit = useCallback((id: string) => {
    try {
      const habitToDelete = habits.find(h => h.id === id);
      if (!habitToDelete) return;

      const updatedHabits = habits.filter(h => h.id !== id);
      const updatedCompletions = completions.filter(c => c.habitId !== id);
      const updatedStreaks = streaks.filter(s => s.habitId !== id);

      setHabits(updatedHabits);
      setCompletions(updatedCompletions);
      setStreaks(updatedStreaks);

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

  const toggleHabitCompletion = useCallback((habitId: string, date?: string) => {
    try {
      const completionDate = date || new Date().toISOString().split('T')[0];
      const existingCompletion = completions.find(c => 
        c.habitId === habitId && c.date === completionDate
      );

      const newCompletion: Completion = {
        id: existingCompletion?.id || `completion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        habitId,
        date: completionDate,
        completed: !existingCompletion?.completed,
        timestamp: new Date().toISOString()
      };

      let updatedCompletions: Completion[];
      if (existingCompletion) {
        updatedCompletions = completions.map(c => 
          c.id === existingCompletion.id ? newCompletion : c
        );
      } else {
        updatedCompletions = [...completions, newCompletion];
      }

      setCompletions(updatedCompletions);
      storage.addCompletion(newCompletion);

      // Recalculate streaks
      const updatedStreaks = calculateStreaks(habits, updatedCompletions);
      setStreaks(updatedStreaks);
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
