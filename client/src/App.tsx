import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';
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
  const { user: clerkUser, isLoaded } = useUser();

  // Debug Clerk authentication
  useEffect(() => {
    console.log('[APP] Clerk loaded:', isLoaded);
    console.log('[APP] Clerk user:', clerkUser);
    console.log('[APP] Clerk user ID:', clerkUser?.id);
  }, [isLoaded, clerkUser]);

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
            
            <SignedOut>
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-6 p-8">
                  <div className="space-y-2">
                    <h1 className="text-6xl font-bold text-gray-900 dark:text-white">🎯</h1>
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white">HabitFlow</h2>
                    <p className="text-xl text-gray-600 dark:text-gray-400">
                      Track your habits, build your future
                    </p>
                  </div>
                  <div className="space-y-4">
                    <p className="text-gray-500 dark:text-gray-400">
                      Sign in to start building better habits
                    </p>
                    <SignInButton mode="modal">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                        Get Started
                      </button>
                    </SignInButton>
                  </div>
                </div>
              </div>
            </SignedOut>
            
            <SignedIn>
              <Header />
              <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
              <main>
                {renderContent()}
              </main>
            </SignedIn>
            
            <Toaster />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
