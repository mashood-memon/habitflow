import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Flame, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface HabitCardProps {
  habit: {
    id: string;
    name: string;
    category: string;
    icon: string;
    target?: number;
    unit?: string;
    completed: boolean;
    currentStreak: number;
  };
  onToggleCompletion: (habitId: string) => void;
  onEdit?: (habitId: string) => void;
}

const categoryColors = {
  Health: "border-red-400 bg-red-50 dark:bg-red-900/20",
  Productivity: "border-green-400 bg-green-50 dark:bg-green-900/20",
  Personal: "border-purple-400 bg-purple-50 dark:bg-purple-900/20",
  Learning: "border-blue-400 bg-blue-50 dark:bg-blue-900/20",
  Social: "border-pink-400 bg-pink-50 dark:bg-pink-900/20",
  Finance: "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20"
};

const categoryTextColors = {
  Health: "text-red-600 dark:text-red-400",
  Productivity: "text-green-600 dark:text-green-400",
  Personal: "text-purple-600 dark:text-purple-400",
  Learning: "text-blue-600 dark:text-blue-400",
  Social: "text-pink-600 dark:text-pink-400",
  Finance: "text-yellow-600 dark:text-yellow-400"
};

export function HabitCard({ habit, onToggleCompletion, onEdit }: HabitCardProps) {
  const cardStyle = categoryColors[habit.category as keyof typeof categoryColors] || categoryColors.Health;
  const textColor = categoryTextColors[habit.category as keyof typeof categoryTextColors] || categoryTextColors.Health;

  return (
    <Card className={cn(
      "transition-all duration-200 hover:scale-[1.02] border-l-4",
      cardStyle,
      habit.completed && "opacity-75"
    )}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3 flex-1">
            <span className="text-2xl">{habit.icon}</span>
            <div className="flex-1">
              <h3 className={cn(
                "font-semibold text-gray-900 dark:text-white",
                habit.completed && "line-through"
              )}>
                {habit.name}
              </h3>
              <Badge variant="secondary" className={cn("text-xs font-medium", textColor)}>
                {habit.category}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(habit.id)}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-full border-2 transition-colors",
                habit.completed
                  ? "bg-green-500 border-green-500 text-white"
                  : "border-gray-300 dark:border-gray-600 hover:border-green-500"
              )}
              onClick={() => onToggleCompletion(habit.id)}
            >
              <Check className={cn(
                "h-5 w-5 transition-opacity",
                habit.completed ? "opacity-100" : "opacity-0"
              )} />
            </Button>
          </div>
        </div>
        
        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
          {habit.target && habit.unit && (
            <span>{habit.target} {habit.unit}</span>
          )}
          
          <div className="flex items-center space-x-1">
            <Flame className="h-4 w-4 text-orange-500" />
            <span>{habit.currentStreak} day streak</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
