import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO } from "date-fns";
import { useHabits } from "@/hooks/use-habits";
import { cn } from "@/lib/utils";

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { habits, completions } = useHabits();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Extend to show complete weeks
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(monthStart.getDate() - monthStart.getDay());
  
  const calendarEnd = new Date(monthEnd);
  calendarEnd.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()));
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getCompletionsForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return completions.filter(c => c.date === dateString && c.completed);
  };

  const getCompletionRate = (date: Date) => {
    const dateCompletions = getCompletionsForDate(date);
    const activeHabits = habits.filter(h => h.isActive);
    
    if (activeHabits.length === 0) return 0;
    return Math.round((dateCompletions.length / activeHabits.length) * 100);
  };

  const getCompletionColor = (rate: number) => {
    if (rate === 0) return "bg-gray-100 dark:bg-gray-800";
    if (rate < 25) return "bg-red-100 dark:bg-red-900/30";
    if (rate < 50) return "bg-orange-100 dark:bg-orange-900/30";
    if (rate < 75) return "bg-yellow-100 dark:bg-yellow-900/30";
    if (rate < 100) return "bg-green-100 dark:bg-green-900/30";
    return "bg-green-200 dark:bg-green-900/50";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <CalendarIcon className="w-5 h-5" />
                  <span>Habit Calendar</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h3 className="text-lg font-semibold min-w-[140px] text-center">
                    {format(currentDate, 'MMMM yyyy')}
                  </h3>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  const completionRate = getCompletionRate(day);
                  const completions = getCompletionsForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isCurrentDay = isToday(day);
                  
                  return (
                    <div
                      key={index}
                      className={cn(
                        "p-2 min-h-[60px] border border-gray-200 dark:border-gray-700 rounded-lg transition-colors",
                        getCompletionColor(completionRate),
                        !isCurrentMonth && "opacity-40",
                        isCurrentDay && "ring-2 ring-primary"
                      )}
                    >
                      <div className="text-sm font-medium mb-1">
                        {format(day, 'd')}
                      </div>
                      
                      {completions.length > 0 && (
                        <div className="space-y-1">
                          <Badge variant="secondary" className="text-xs">
                            {completions.length} completed
                          </Badge>
                          {completionRate === 100 && (
                            <div className="text-lg">✨</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-center space-x-4 mt-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-100 dark:bg-gray-800 rounded"></div>
                  <span>0%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 rounded"></div>
                  <span>1-24%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange-100 dark:bg-orange-900/30 rounded"></div>
                  <span>25-49%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900/30 rounded"></div>
                  <span>50-74%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 rounded"></div>
                  <span>75-99%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-200 dark:bg-green-900/50 rounded"></div>
                  <span>100%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar with month stats */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Month Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Perfect Days</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {monthDays.filter(day => getCompletionRate(day) === 100).length}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Days</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {monthDays.filter(day => getCompletionRate(day) > 0).length}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Average Rate</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.round(
                    monthDays.reduce((sum, day) => sum + getCompletionRate(day), 0) / monthDays.length
                  )}%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Habits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {habits.filter(h => h.isActive).map(habit => (
                  <div key={habit.id} className="flex items-center space-x-2">
                    <span className="text-lg">{habit.icon}</span>
                    <span className="text-sm font-medium">{habit.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
