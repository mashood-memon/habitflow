import { format, parseISO, subDays, startOfWeek, addDays } from "date-fns";
import { cn } from "@/lib/utils";

interface HeatMapProps {
  data: Array<{
    date: string;
    count: number;
    level: number;
  }>;
  className?: string;
}

const levelColors = {
  0: "bg-gray-200 dark:bg-gray-700",
  1: "bg-green-200 dark:bg-green-800",
  2: "bg-green-400 dark:bg-green-600", 
  3: "bg-green-500 dark:bg-green-500",
  4: "bg-green-600 dark:bg-green-400"
};

const monthLabels = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

export function HeatMap({ data, className }: HeatMapProps) {
  // Group data by weeks
  const weeks: Array<Array<typeof data[0]>> = [];
  let currentWeek: Array<typeof data[0]> = [];
  
  // Start from the beginning of the week for the first data point
  const startDate = startOfWeek(parseISO(data[0]?.date || new Date().toISOString()));
  
  data.forEach((day, index) => {
    const dayOfWeek = parseISO(day.date).getDay();
    
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      // Start a new week on Sunday
      weeks.push(currentWeek);
      currentWeek = [];
    }
    
    currentWeek.push(day);
    
    // Add the last week
    if (index === data.length - 1) {
      weeks.push(currentWeek);
    }
  });

  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className="inline-flex flex-col space-y-1">
        {/* Month labels */}
        <div className="flex space-x-1 ml-8">
          {weeks.map((week, weekIndex) => {
            const firstDay = week[0];
            if (!firstDay) return <div key={weekIndex} className="w-3" />;
            
            const date = parseISO(firstDay.date);
            const isFirstWeekOfMonth = date.getDate() <= 7;
            
            return (
              <div key={weekIndex} className="w-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                {isFirstWeekOfMonth ? monthLabels[date.getMonth()] : ""}
              </div>
            );
          })}
        </div>
        
        {/* Day labels and heat map grid */}
        {dayLabels.map((dayLabel, dayIndex) => (
          <div key={dayIndex} className="flex items-center space-x-1">
            <div className="text-xs text-gray-500 dark:text-gray-400 w-6">
              {dayIndex % 2 === 1 ? dayLabel : ""}
            </div>
            
            {weeks.map((week, weekIndex) => {
              const day = week.find(d => parseISO(d.date).getDay() === dayIndex);
              const level = day?.level || 0;
              const colorClass = levelColors[level as keyof typeof levelColors];
              
              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={cn(
                    "w-3 h-3 rounded-sm",
                    colorClass
                  )}
                  title={day ? `${day.date}: ${day.count} completions` : "No data"}
                />
              );
            })}
          </div>
        ))}
        
        {/* Legend */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Less</span>
          <div className="flex space-x-1">
            {Object.entries(levelColors).map(([level, colorClass]) => (
              <div
                key={level}
                className={cn("w-3 h-3 rounded-sm", colorClass)}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
