import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
