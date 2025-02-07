import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { ProtectedAdminRoute } from "./lib/protected-admin-route";
import Landing from "@/pages/landing";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import MissedCalls from "@/pages/missed-calls";
import Conversations from "@/pages/conversations";
import Scheduled from "@/pages/scheduled";
import Leads from "@/pages/leads";
import Settings from "@/pages/settings";
import Billing from "@/pages/billing";
import AdminDashboard from "@/pages/admin";
import AdminCustomers from "@/pages/admin/customers";
import AdminBilling from "@/pages/admin/billing";
import AdminMetrics from "@/pages/admin/metrics";
import AdminSupport from "@/pages/admin/support";
import AdminSettings from "@/pages/admin/settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={AuthPage} />
      <Route path="/register" component={AuthPage} />
      <Route path="/auth" component={AuthPage} />

      {/* Protected User Routes */}
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/missed-calls" component={MissedCalls} />
      <ProtectedRoute path="/conversations" component={Conversations} />
      <ProtectedRoute path="/scheduled" component={Scheduled} />
      <ProtectedRoute path="/leads" component={Leads} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/billing" component={Billing} />

      {/* Protected Admin Routes */}
      <ProtectedAdminRoute path="/admin" component={AdminDashboard} />
      <ProtectedAdminRoute path="/admin/customers" component={AdminCustomers} />
      <ProtectedAdminRoute path="/admin/billing" component={AdminBilling} />
      <ProtectedAdminRoute path="/admin/metrics" component={AdminMetrics} />
      <ProtectedAdminRoute path="/admin/support" component={AdminSupport} />
      <ProtectedAdminRoute path="/admin/settings" component={AdminSettings} />

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