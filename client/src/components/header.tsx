import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Moon, Sun, Settings } from "lucide-react";
import { useUser } from "@/hooks/use-user";

export function Header() {
  const { user, theme, toggleTheme, getXPProgress } = useUser();
  
  if (!user) return null;

  const xpProgress = getXPProgress();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">HabitFlow</h1>
          </div>
          
          {/* User Stats and Controls */}
          <div className="flex items-center space-x-4">
            {/* Level Badge */}
            <div className="flex items-center space-x-2 bg-primary/10 dark:bg-primary/20 px-3 py-1 rounded-full">
              <span className="text-sm font-medium text-primary dark:text-primary-foreground">Level</span>
              <span className="text-lg font-bold text-primary dark:text-primary-foreground">{user.level}</span>
            </div>
            
            {/* XP Progress */}
            <div className="hidden sm:flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">XP:</span>
              <div className="w-24">
                <Progress value={xpProgress.percentage} className="h-2" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {xpProgress.current}/{xpProgress.required}
              </span>
            </div>
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            
            {/* Settings */}
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
