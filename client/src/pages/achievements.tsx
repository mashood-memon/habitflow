import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Lock, Star } from "lucide-react";
import { AchievementBadge } from "@/components/achievement-badge";
import { useUser } from "@/hooks/use-user";
import { useHabits } from "@/hooks/use-habits";
import { getAchievementProgress } from "@/lib/achievements";

export function Achievements() {
  const { achievements, user } = useUser();
  const { habits, completions, streaks } = useHabits();

  const unlockedAchievements = achievements.filter(a => a.unlockedDate);
  const lockedAchievements = achievements.filter(a => !a.unlockedDate);

  // Group achievements by category
  const achievementsByCategory = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, typeof achievements>);

  const categoryNames = {
    streak: "Streak Achievements",
    completion: "Completion Achievements", 
    level: "Level Achievements",
    consistency: "Consistency Achievements",
    milestone: "Milestone Achievements"
  };

  const categoryIcons = {
    streak: "🔥",
    completion: "🎯",
    level: "⭐",
    consistency: "💪",
    milestone: "🏆"
  };

  const completionRate = achievements.length > 0 
    ? Math.round((unlockedAchievements.length / achievements.length) * 100) 
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Achievement Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Unlocked
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {unlockedAchievements.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Lock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Locked
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {lockedAchievements.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Completion Rate
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {completionRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Overall Progress</h3>
              <Badge variant="outline">
                {unlockedAchievements.length} / {achievements.length}
              </Badge>
            </div>
            <Progress value={completionRate} className="h-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You're {completionRate === 100 ? 'a true habit master!' : `${100 - completionRate}% away from unlocking all achievements`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recently Unlocked */}
      {unlockedAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Unlocked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {unlockedAchievements
                .sort((a, b) => new Date(b.unlockedDate!).getTime() - new Date(a.unlockedDate!).getTime())
                .slice(0, 4)
                .map(achievement => (
                  <AchievementBadge key={achievement.id} achievement={achievement} />
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements by Category */}
      {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-xl">{categoryIcons[category as keyof typeof categoryIcons]}</span>
              <span>{categoryNames[category as keyof typeof categoryNames]}</span>
              <Badge variant="secondary">
                {categoryAchievements.filter(a => a.unlockedDate).length} / {categoryAchievements.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categoryAchievements.map(achievement => {
                const progress = getAchievementProgress(
                  achievement,
                  habits,
                  completions,
                  streaks,
                  user?.level || 1
                );
                
                return (
                  <AchievementBadge
                    key={achievement.id}
                    achievement={achievement}
                    progress={achievement.unlockedDate ? undefined : progress}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Help Text */}
      <Card>
        <CardContent className="p-6 text-center">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">How to Unlock Achievements</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Complete habits consistently, build streaks, and reach new levels to unlock achievements. 
              Each achievement represents a milestone in your habit-building journey!
            </p>
            <div className="flex justify-center space-x-4 mt-4 text-sm">
              <div className="flex items-center space-x-1">
                <span className="text-lg">🔥</span>
                <span>Build streaks</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-lg">🎯</span>
                <span>Complete habits</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-lg">⭐</span>
                <span>Level up</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-lg">💪</span>
                <span>Stay consistent</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
