import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, TrendingUp, Calendar, Flame, Target, Award } from "lucide-react";
import { useHabits } from "@/hooks/use-habits";
import { useUser } from "@/hooks/use-user";
import { getWeeklyCompletionRate } from "@/lib/calculations";

export function Statistics() {
  const { habits, completions, streaks } = useHabits();
  const { user, getUnlockedAchievements } = useUser();

  const totalCompletions = completions.filter(c => c.completed).length;
  const weeklyRate = getWeeklyCompletionRate(habits, completions);
  const activeHabits = habits.filter(h => h.isActive);
  const longestStreak = Math.max(...streaks.map(s => s.best), 0);
  const currentStreaks = streaks.filter(s => s.current > 0);
  const unlockedAchievements = getUnlockedAchievements();

  // Calculate category breakdown
  const categoryStats = activeHabits.reduce((acc, habit) => {
    const category = habit.category;
    const habitCompletions = completions.filter(c => c.habitId === habit.id && c.completed).length;
    
    if (!acc[category]) {
      acc[category] = { count: 0, completions: 0 };
    }
    acc[category].count++;
    acc[category].completions += habitCompletions;
    
    return acc;
  }, {} as Record<string, { count: number; completions: number }>);

  // Calculate streak distribution
  const streakRanges = {
    "1-7 days": streaks.filter(s => s.current >= 1 && s.current <= 7).length,
    "8-30 days": streaks.filter(s => s.current >= 8 && s.current <= 30).length,
    "30+ days": streaks.filter(s => s.current > 30).length
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Completions
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalCompletions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Weekly Rate
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {weeklyRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Flame className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Best Streak
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {longestStreak} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Achievements
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {unlockedAchievements.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart className="w-5 h-5" />
              <span>Habits by Category</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(categoryStats).map(([category, stats]) => {
              const percentage = totalCompletions > 0 ? Math.round((stats.completions / totalCompletions) * 100) : 0;
              
              return (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{category}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{stats.count} habits</Badge>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {stats.completions} completions
                      </span>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">{percentage}% of total completions</p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Current Streaks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Flame className="w-5 h-5" />
              <span>Active Streaks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentStreaks.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No active streaks. Complete some habits to start building streaks!
              </p>
            ) : (
              <div className="space-y-3">
                {currentStreaks
                  .sort((a, b) => b.current - a.current)
                  .slice(0, 5)
                  .map(streak => {
                    const habit = habits.find(h => h.id === streak.habitId);
                    if (!habit) return null;
                    
                    return (
                      <div key={streak.habitId} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{habit.icon}</span>
                          <span className="font-medium">{habit.name}</span>
                        </div>
                        <Badge variant="outline">
                          {streak.current} days
                        </Badge>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Streak Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Streak Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(streakRanges).map(([range, count]) => (
              <div key={range} className="flex justify-between items-center">
                <span className="text-sm font-medium">{range}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: streaks.length > 0 ? `${(count / streaks.length) * 100}%` : '0%' 
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[2rem]">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Personal Records */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Most Consistent Habit</span>
              <div className="text-right">
                {(() => {
                  const mostConsistent = streaks.reduce((prev, current) => 
                    current.best > prev.best ? current : prev, streaks[0]
                  );
                  const habit = habits.find(h => h.id === mostConsistent?.habitId);
                  return (
                    <div>
                      <span className="text-sm font-medium">
                        {habit ? `${habit.icon} ${habit.name}` : 'N/A'}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {mostConsistent?.best || 0} days best streak
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Current Level</span>
              <div className="text-right">
                <span className="text-sm font-medium">Level {user?.level || 1}</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.totalXP || 0} total XP
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Active Days</span>
              <span className="text-sm font-medium">
                {new Set(completions.filter(c => c.completed).map(c => c.date)).size} days
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Average Daily Completions</span>
              <span className="text-sm font-medium">
                {totalCompletions > 0 && new Set(completions.map(c => c.date)).size > 0
                  ? (totalCompletions / new Set(completions.map(c => c.date)).size).toFixed(1)
                  : '0'
                }
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
