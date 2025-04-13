import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

// Temporary fix to avoid authentication context issues
function useCurrentUser() {
  // Check if the user is logged in by making a direct API call
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    // Check if user is authenticated
    fetch("/api/user", {
      credentials: "include"
    })
    .then(res => {
      if (res.status === 401) {
        return null;
      }
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return res.json();
    })
    .then(userData => {
      setUser(userData);
      setLoading(false);
    })
    .catch(err => {
      console.error("Error checking authentication:", err);
      setLoading(false);
    });
  }, []);
  
  return { user, isLoading: loading };
}

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => JSX.Element;
}) {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
