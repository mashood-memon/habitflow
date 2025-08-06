import { useUser, useAuth } from '@clerk/clerk-react';

export function AuthDebug() {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();

  const testApiCall = async () => {
    try {
      const token = await getToken();
      console.log('[AUTH_DEBUG] Token:', token);
      
      const response = await fetch('/api/db-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('[AUTH_DEBUG] API Response:', data);
    } catch (error) {
      console.error('[AUTH_DEBUG] API Error:', error);
    }
  };

  return (
    <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
      <h3 className="font-bold text-yellow-800 dark:text-yellow-200">Authentication Debug</h3>
      <div className="mt-2 space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
        <p>Clerk Loaded: {isLoaded ? 'Yes' : 'No'}</p>
        <p>Signed In: {isSignedIn ? 'Yes' : 'No'}</p>
        <p>User ID: {clerkUser?.id || 'None'}</p>
        <p>User Email: {clerkUser?.emailAddresses?.[0]?.emailAddress || 'None'}</p>
        <p>First Name: {clerkUser?.firstName || 'None'}</p>
      </div>
      <button 
        onClick={testApiCall}
        className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
      >
        Test API Call
      </button>
    </div>
  );
}
