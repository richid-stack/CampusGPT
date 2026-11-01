import { Switch, Route, Router as WouterRouter } from "wouter";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppShell } from "./components/layout/AppShell";

import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Documents from "./pages/Documents";
import Planner from "./pages/Planner";
import Timetable from "./pages/Timetable";
import Events from "./pages/Events";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppShell>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/chat/new" component={Home} />
        <Route path="/chat/:threadId" component={Chat} />
        <Route path="/documents" component={Documents} />
        <Route path="/planner" component={Planner} />
        <Route path="/timetable" component={Timetable} />
        <Route path="/events" component={Events} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

// Shows the app only to signed-in users; everyone else sees the sign-in screen.
function AuthGate() {
  const { data: session, isPending } = authClient.useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id ?? null;
  // Never show one user's cached data to the next person who signs in.
  useEffect(() => { queryClient.clear(); }, [userId, queryClient]);
  if (isPending) {
    return (
      <div className="h-full flex items-center justify-center bg-background" role="status" aria-label="Loading">
        <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
      </div>
    );
  }
  if (!session) return <Login />;
  return <Router />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Switch>
            <Route path="/reset-password" component={ResetPassword} />
            <Route component={AuthGate} />
          </Switch>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
