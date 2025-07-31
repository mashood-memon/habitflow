import { cn } from "@/lib/utils";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "dashboard", label: "Dashboard" },
  { id: "calendar", label: "Calendar" },
  { id: "statistics", label: "Statistics" },
  { id: "achievements", label: "Achievements" }
];

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "py-3 border-b-2 font-medium text-sm transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
