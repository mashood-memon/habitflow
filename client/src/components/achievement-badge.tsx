import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Achievement } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

interface AchievementBadgeProps {
  achievement: Achievement;
  progress?: {
    current: number;
    required: number;
    percentage: number;
  };
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "p-3",
  md: "p-4", 
  lg: "p-6"
};

const iconSizes = {
  sm: "text-2xl",
  md: "text-3xl",
  lg: "text-4xl"
};

const categoryColors = {
  streak: "from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700",
  completion: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700",
  level: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700",
  consistency: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700",
  milestone: "from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700"
};

const categoryTextColors = {
  streak: "text-orange-800 dark:text-orange-200",
  completion: "text-blue-800 dark:text-blue-200", 
  level: "text-purple-800 dark:text-purple-200",
  consistency: "text-green-800 dark:text-green-200",
  milestone: "text-yellow-800 dark:text-yellow-200"
};

export function AchievementBadge({ achievement, progress, size = "md" }: AchievementBadgeProps) {
  const isUnlocked = !!achievement.unlockedDate;
  const bgClass = categoryColors[achievement.category] || categoryColors.milestone;
  const textColorClass = categoryTextColors[achievement.category] || categoryTextColors.milestone;

  return (
    <Card className={cn(
      "text-center transition-all duration-200 hover:scale-105",
      isUnlocked 
        ? `bg-gradient-to-br ${bgClass}` 
        : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60"
    )}>
      <CardContent className={sizeClasses[size]}>
        <div className="flex flex-col items-center space-y-2">
          {isUnlocked ? (
            <div className={iconSizes[size]}>{achievement.icon}</div>
          ) : (
            <div className="relative">
              <div className={cn(iconSizes[size], "opacity-30")}>{achievement.icon}</div>
              <Lock className="absolute inset-0 m-auto h-4 w-4 text-gray-400" />
            </div>
          )}
          
          <div>
            <p className={cn(
              "font-medium",
              size === "sm" ? "text-sm" : "text-base",
              isUnlocked ? textColorClass : "text-gray-500 dark:text-gray-400"
            )}>
              {achievement.name}
            </p>
            
            <p className={cn(
              "text-xs",
              isUnlocked ? "text-gray-600 dark:text-gray-300" : "text-gray-400 dark:text-gray-500"
            )}>
              {achievement.description}
            </p>
            
            {!isUnlocked && progress && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {progress.current}/{progress.required}
                </p>
              </div>
            )}
            
            {isUnlocked && achievement.unlockedDate && (
              <Badge variant="secondary" className="mt-1 text-xs">
                Unlocked {new Date(achievement.unlockedDate).toLocaleDateString()}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
