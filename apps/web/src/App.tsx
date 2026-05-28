import { Switch, Route, Router } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Github from "@/pages/Github";
import AiProviders from "@/pages/AiProviders";
import AiRegistry from "@/pages/AiRegistry";
import N8n from "@/pages/N8n";
import Infrastructure from "@/pages/Infrastructure";
import Languages from "@/pages/Languages";
import AuditLogs from "@/pages/AuditLogs";
import ObservabilityKeys from "@/pages/ObservabilityKeys";

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 60_000, refetchOnWindowFocus: false } } });

function Shell() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-[var(--cyan)] font-mono animate-pulse">Initializing RALD OS...</div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/github" component={Github} />
            <Route path="/ai-providers" component={AiProviders} />
            <Route path="/ai-registry" component={AiRegistry} />
            <Route path="/n8n" component={N8n} />
            <Route path="/infrastructure" component={Infrastructure} />
            <Route path="/languages" component={Languages} />
            <Route path="/audit" component={AuditLogs} />
            <Route path="/observability" component={ObservabilityKeys} />
            <Route>
              <div className="flex h-full items-center justify-center text-[var(--muted)]">404 — Page not found</div>
            </Route>
          </Switch>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <Router>
        <AuthProvider>
          <Shell />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}
