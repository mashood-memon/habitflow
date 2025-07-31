import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Navigation } from "@/components/navigation";
import { Dashboard } from "@/pages/dashboard";
import { Calendar } from "@/pages/calendar";
import { Statistics } from "@/pages/statistics";
import { Achievements } from "@/pages/achievements";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "calendar":
        return <Calendar />;
      case "statistics":
        return <Statistics />;
      case "achievements":
        return <Achievements />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="habitflow-theme">
        <TooltipProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <Header />
            <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
            <main>
              {renderContent()}
            </main>
            <Toaster />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
