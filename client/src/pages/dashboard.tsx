import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Flame, Target, TrendingUp } from "lucide-react";
import { HabitCard } from "@/components/habit-card";
import { HabitModal } from "@/components/habit-modal";
import { ProgressCircle } from "@/components/progress-circle";
import { AchievementBadge } from "@/components/achievement-badge";
import { HeatMap } from "@/components/heat-map";
import { useHabits } from "@/hooks/use-habits";
import { useUser } from "@/hooks/use-user";
import { getHeatMapData, getWeeklyCompletionRate } from "@/lib/calculations";
import { InsertHabit } from "@shared/schema";

export function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingHabit, setEditingHabit] = useState<InsertHabit | null>(null);
  const { 
    habits, 
    completions, 
    streaks, 
    isLoading, 
    createHabit, 
    updateHabit,
    toggleHabitCompletion, 
    getTodayHabits, 
    getTodayStats 
  } = useHabits();
  
  const { 
    user, 
    achievements, 
    updateUserStats, 
    getUnlockedAchievements 
  } = useUser();

  // Update user stats when data changes
  useEffect(() => {
    if (!isLoading && habits.length > 0) {
      updateUserStats(habits, completions, streaks);
    }
  }, [isLoading]);

  const todayHabits = getTodayHabits();
  const todayStats = getTodayStats();
  const weeklyRate = getWeeklyCompletionRate(habits, completions);
  const longestStreak = Math.max(...streaks.map(s => s.current), 0);
  const recentAchievements = getUnlockedAchievements()
    .sort((a, b) => new Date(b.unlockedDate!).getTime() - new Date(a.unlockedDate!).getTime())
    .slice(0, 3);

  const heatMapData = getHeatMapData(completions, 84); // Last 12 weeks

  const handleCreateHabit = (habitData: InsertHabit) => {
    createHabit(habitData);
    setIsModalOpen(false);
  };

  const handleToggleCompletion = (habitId: string) => {
    toggleHabitCompletion(habitId);
  };

  const handleEditHabit = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      setEditingHabitId(habitId);
      // Convert habit to InsertHabit format for editing
      const editableHabit: InsertHabit = {
        name: habit.name,
        description: habit.description,
        category: habit.category,
        frequency: habit.frequency,
        customDays: habit.customDays,
        target: habit.target,
        unit: habit.unit,
        icon: habit.icon,
        isActive: habit.isActive
      };
      setEditingHabit(editableHabit);
      setIsModalOpen(true);
    }
  };

  const handleSaveEdit = (habitData: InsertHabit) => {
    if (editingHabitId) {
      updateHabit(editingHabitId, habitData);
    }
    setIsModalOpen(false);
    setEditingHabitId(null);
    setEditingHabit(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHabitId(null);
    setEditingHabit(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your habits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Daily Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Daily Progress Circle */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Today's Progress
              </h3>
              <ProgressCircle percentage={todayStats.percentage} className="mx-auto mb-4" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {todayStats.completed} of {todayStats.total} habits completed
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Stats */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Current Streak */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <Flame className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Current Streak
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {longestStreak} days
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Total Habits */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Active Habits
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {habits.filter(h => h.isActive).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Weekly Score */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Weekly Score
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {weeklyRate}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Today's Habits Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Today's Habits
          </h2>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Add Habit</span>
          </Button>
        </div>
        
        {todayHabits.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No habits for today
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create your first habit to start building better routines!
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                Create Your First Habit
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {todayHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={{
                  ...habit,
                  description: habits.find(h => h.id === habit.id)?.description
                }}
                onToggleCompletion={handleToggleCompletion}
                onEdit={handleEditHabit}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Achievements Section */}
      {recentAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {recentAchievements.map((achievement) => (
                <div key={achievement.id} className="flex-shrink-0">
                  <AchievementBadge achievement={achievement} size="sm" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Heat Map Section */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Heat Map</CardTitle>
        </CardHeader>
        <CardContent>
          <HeatMap data={heatMapData} />
        </CardContent>
      </Card>

      {/* Habit Creation/Edit Modal */}
      <HabitModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={editingHabitId ? handleSaveEdit : handleCreateHabit}
        initialData={editingHabit || undefined}
      />
    </div>
  );
}
