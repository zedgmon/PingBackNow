import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import MissedCalls from "@/pages/missed-calls";
import Conversations from "@/pages/conversations";
import Scheduled from "@/pages/scheduled";
import Leads from "@/pages/leads";
import Settings from "@/pages/settings";
import Billing from "@/pages/billing";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/missed-calls" component={MissedCalls} />
      <ProtectedRoute path="/conversations" component={Conversations} />
      <ProtectedRoute path="/scheduled" component={Scheduled} />
      <ProtectedRoute path="/leads" component={Leads} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/billing" component={Billing} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;